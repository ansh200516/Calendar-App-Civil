
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { MongoStorage } from "./mongo-storage";
import bcrypt from 'bcrypt';
import { insertEventSchema, insertNotificationSchema, insertResourceSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import { upload, deleteFile } from "./file-upload";
import { checkAdminIp } from "./middlewares/checkAdminIp";

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();


const NOTIFICATION_RECIPIENTS = ['ce1231156@iitd.ac.in', 'ansh.singh.160305@gmail.com',  "ce1230248@iitd.ac.in",
  "ce1230285@iitd.ac.in",
  "ce1230023@iitd.ac.in",
  "ce1231162@iitd.ac.in",
  "ce1230637@civil.iitd.ac.in",
  "ce1230086@civil.iitd.ac.in",
  "ce1230841@civil.iitd.ac.in",
  "ce1231182@iitd.ac.in",
  "ce1230878@iitd.ac.in",
  "ce1230462@civil.iitd.ac.in",
  "ce1230026@iitd.ac.in",
  "ce1230991@iitd.ac.in",
  "ce1221518@iitd.ac.in",
  "ce1221052@iitd.ac.in",
  "ce1230662@iitd.ac.in",
  "ce1230367@iitd.civil.ac.in",
  "ce1231116@iitd.ac.in",
  "ce1230283@iitd.ac.in",
  "ce1230084@iitd.ac.in",
  "ce1231034@civil.iitd.ac.in",
  "ce1231041@iitd.ac.in",
  "ce1230562@iitd.ac.in",
  "ce1230370@civil.iitd.ac.in",
  "ce1230275@iitd.ac.in",
  "ce1231225@iitd.ac.in",
  "ce1230818@iitd.ac.in",
  "ce1230803@iitd.ac.in",
  "apb2005jgd@gmail.com",
  "ce1230277@iitd.ac.in",
  "ce1230636@iitd.ac.in",
  "ce1230297@iitd.ac.in",
  "ce1230716@civil.iitd.ac.in",
  "Ce1230928@iitd.ac.in",
  "ce1230070@civil.iitd.ac.in",
  "ce1230670@gmail.com",
  "ce1231051@iitd.ac.in",
  "ce1231189@iitd.ac.in",
  "ce1231069@iitd.ac.in",
  "ce1230073@iitd.ac.in",
  "Ce1230539@iitd.ac.in",
  "ce1230028@iitd.ac.in",
  "ce1231159@iitd.ac.in",
  "ce1231109@civil.iitd.ac.in",
  "ce1231223@civil.iitd.ac.in",
  "ce1230454@iitd.ac.in",
  "ce1231073@civil.iitd.ac.in",
  "ce1231180@iitd.ac.in",
  "ce1230370@civil.iitd.ac.in",
  "ce1231043@iitd.ac.in",
  "ce1231185@iitd.ac.in"];
const EMAIL_ENABLED = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';

let transporter: nodemailer.Transporter | null = null;
if (EMAIL_ENABLED && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: parseInt(process.env.EMAIL_PORT || "587", 10) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify(function(error, success) {
    if (error) {
      console.error("Email transporter verification failed:", error);
      transporter = null;
    } else {
      console.log("Email transporter is ready to send messages");
    }
  });

} else {
  console.warn('Email notifications are disabled or configuration is missing.');
}

async function sendNotificationEmail(subject: string, textBody: string, htmlBody?: string) {
  if (!transporter) {
    console.warn('Email transporter not available. Skipping email notification.');
    return;
  }
  if (NOTIFICATION_RECIPIENTS.length === 0) {
      console.warn('No recipients configured for email notifications.');
      return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Calendar App" <${process.env.EMAIL_USER}>`,
    to: NOTIFICATION_RECIPIENTS.join(', '),
    subject: subject,
    text: textBody,
    html: htmlBody || `<p>${textBody}</p>`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}


declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      username: string;
      isAdmin: boolean;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const storage = new MongoStorage();
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new SessionStore({
        checkPeriod: 86400000,
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'calendar-app-secret',
    })
  );

  app.post('/api/auth/signup', checkAdminIp, async (req: Request, res: Response) => {
    try {
      let { username, password, isAdmin } = req.body;

      const validatedData = insertUserSchema.parse({
        username,
        password,
        isAdmin: isAdmin === true
      });
      password = await bcrypt.hash(validatedData.password, 10);
      validatedData.password = password;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(validatedData);

      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
      const user = await storage.getUserByUsername(username);
      const isMatch = user && await bcrypt.compare(password, user.password);
      if (!user || !isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      return res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/user', (req: Request, res: Response) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.status(200).json({ user });
  });


  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      return res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
          return res.status(400).json({ message: 'Invalid event ID format' });
      }
      const event = await storage.getEvent(id);
      if (!event) {
          return res.status(404).json({ message: 'Event not found' });
      }
      return res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    next();
  };

  app.post('/api/events', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
          return res.status(401).json({ message: 'User ID not found' });
      }
      const eventData = { ...req.body, createdById: userId };
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);
      return res.status(201).json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating event:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/events/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
          return res.status(400).json({ message: 'Invalid event ID format' });
      }
      const eventExists = await storage.getEvent(id);
      if (!eventExists) {
          return res.status(404).json({ message: 'Event not found' });
      }
      const updatedEvent = await storage.updateEvent(id, req.body);
      return res.status(200).json(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/events/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
          return res.status(400).json({ message: 'Invalid event ID format' });
      }
      const eventExists = await storage.getEvent(id);
      if (!eventExists) {
          return res.status(404).json({ message: 'Event not found' });
      }
      await storage.deleteEvent(id);
      return res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotifications();
      return res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications', isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);

      const notification = await storage.createNotification(validatedData);

      sendNotificationEmail(
          `New Notification: ${notification.message.substring(0, 30)}...`, // Subject
          `A new notification has been created:\n\n${notification.message}\n\nScheduled for: ${notification.notifyAt.toLocaleString()}`, // Text Body
          `<p>A new notification has been created:</p><blockquote>${notification.message}</blockquote><p>Scheduled for: ${notification.notifyAt.toLocaleString()}</p>` // HTML Body
      ).catch(err => {
          console.error("Background email sending failed:", err);
      });

      return res.status(201).json(notification);

    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }

      console.error('Error creating notification:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/notifications/:id/mark-sent', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
          return res.status(400).json({ message: 'Invalid notification ID format' });
      }
      const notificationExists = await storage.getNotification(id);
      if (!notificationExists) {
          return res.status(404).json({ message: 'Notification not found' });
      }
      await storage.markNotificationAsSent(id);
      return res.status(200).json({ message: 'Notification marked as sent' });
    } catch (error) {
      console.error('Error marking notification as sent:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  app.post('/api/notifications/send-now', isAdmin, async (req: Request, res: Response) => {
    const { message, sendEmail /*, sendBrowser */ } = req.body; // sendBrowser might be used later

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ message: 'Notification message is required' });
    }

    let emailSent = false;
    if (sendEmail && EMAIL_ENABLED) {
        try {
            sendNotificationEmail(
                `Announcement`,
                message,
                `<p><b>Announcement:</b></p><p>${message}</p>`
            ).catch(err => console.error("Background email sending for announcement failed:", err));
            emailSent = true;
        } catch (emailError) {
            console.error('Error initiating announcement email:', emailError);
        }
    }

    return res.status(200).json({
        message: "Announcement processed.",
        emailAttempted: sendEmail && EMAIL_ENABLED,
    });
});

    app.get('/api/events/:eventId/resources', async (req: Request, res: Response) => {
      try {
          const eventId = req.params.eventId;
          if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) {
              return res.status(400).json({ message: 'Invalid event ID format' });
          }
          const eventExists = await storage.getEvent(eventId);
          if (!eventExists) {
              return res.status(404).json({ message: 'Event not found' });
          }
          const resources = await storage.getResourcesByEventId(eventId);
          return res.status(200).json(resources);
      } catch (error) {
          console.error('Error fetching resources:', error);
          return res.status(500).json({ message: 'Internal server error' });
      }
  });

  app.post('/api/events/:eventId/resources', isAdmin, upload.single('file'), async (req: Request, res: Response) => {
      try {
          const eventId = req.params.eventId;
          if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) {        
             if (req.file) { await deleteFile(`uploads/${req.file.filename}`).catch(console.error); }
              return res.status(400).json({ message: 'Invalid event ID format' });
          }
          const eventExists = await storage.getEvent(eventId);
          if (!eventExists) {
              if (req.file) { await deleteFile(`uploads/${req.file.filename}`).catch(console.error); }
              return res.status(404).json({ message: 'Event not found' });
          }
          if (!req.file) {
              return res.status(400).json({ message: 'No file uploaded' });
          }
          const userId = req.session.user?.id;
          if (!userId) {
              if (req.file) { await deleteFile(`uploads/${req.file.filename}`).catch(console.error); }
              return res.status(401).json({ message: 'User ID not found in session' });
          }
          const relativeFilePath = path.join('uploads', req.file.filename);

          const resourceData = {
            eventId: eventId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: relativeFilePath,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedById: userId
        };

          const resource = await storage.createResource(resourceData);
          return res.status(201).json(resource);
      } catch (error) {
          if (req.file) { await deleteFile(`uploads/${req.file.filename}`).catch(console.error); }
          console.error('Error uploading resource:', error);
          return res.status(500).json({ message: 'Internal server error' });
      }
  });

app.get('/api/resources/:id/download', async (req: Request, res: Response) => {
  try {
      const id = req.params.id;
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
          return res.status(400).json({ message: 'Invalid resource ID format' });
      }
      const resource = await storage.getResource(id);
      if (!resource) {
          return res.status(404).json({ message: 'Resource record not found' });
      }

      const mountPath = process.env.RENDER_DISK_MOUNT_PATH;
      if (!mountPath) {
          console.error("FATAL: RENDER_DISK_MOUNT_PATH environment variable is not set!");
          return res.status(500).json({ message: 'Server configuration error (disk path missing)' });
      }

      const filePath = path.join(mountPath, resource.filePath);
      console.log(`Attempting to download file from: ${filePath}`);

      try {
          await fs.promises.access(filePath, fs.constants.R_OK);
          console.log(`File exists and is readable: ${filePath}`);
      } catch (err: any) {
           console.error(`File not found or not readable at path ${filePath}:`, err);
           return res.status(404).json({ message: 'File not found on server storage.' });
      }


      return res.download(filePath, resource.originalName, (err) => {
          if (err) {
              console.error(`Error during file download stream for ${filePath}:`, err);
              if (!res.headersSent) {
                   if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                       return res.status(404).json({ message: 'File disappeared before sending' });
                   } else {
                       return res.status(500).json({ message: 'Error sending file' });
                   }
              } else {
                   console.error("Headers already sent, could not send error response for download failure.");
              }
          } else {
              console.log(`Successfully initiated download for ${filePath}`);
          }
      });

  } catch (error) {
      console.error('Error processing resource download request:', error);
      if (!res.headersSent) {
          return res.status(500).json({ message: 'Internal server error processing download' });
      }
  }
});

  app.delete('/api/resources/:id', isAdmin, async (req: Request, res: Response) => {
      try {
          const id = req.params.id;
          if (!id || !/^[a-f\d]{24}$/i.test(id)) {
              return res.status(400).json({ message: 'Invalid resource ID format' });
          }
          const resource = await storage.getResource(id);
          if (!resource) {
              return res.status(404).json({ message: 'Resource not found' });
          }

          try {
            await deleteFile(resource.filePath);
        } catch (fileError) {
            console.error(`Failed to delete file from filesystem: ${resource.filePath}. Error: ${fileError}. Proceeding to delete database record.`);
        }

          await storage.deleteResource(id);
          return res.status(200).json({ message: 'Resource deleted successfully' });
      } catch (error) {
          console.error('Error deleting resource:', error);
          return res.status(500).json({ message: 'Internal server error' });
      }
  });

  const checkScheduledNotifications = async () => {
    if (!EMAIL_ENABLED) return;

    console.log('Checking for scheduled notifications to send...');
    try {
        const now = new Date();
        const dueNotifications = await storage.getDueNotifications(now);

        if (dueNotifications.length === 0) {
            console.log('No due notifications found.');
            return;
        }

        console.log(`Found ${dueNotifications.length} due notifications.`);

        for (const notification of dueNotifications) {
            try {
                let eventDetails = '';
                if (notification.eventId) {
                    const event = await storage.getEvent(notification.eventId);
                    if (event) {
                        eventDetails = ` related to event "${event.title}" (${event.category})`;
                    }
                }

                const subject = `Upcoming Reminder${eventDetails}`;
                const body = `${notification.message}\n\nThis notification was scheduled for ${notification.notifyAt.toLocaleString()}.`;
                const htmlBody = `<p>${notification.message}</p><p><small>This notification was scheduled for ${notification.notifyAt.toLocaleString()}${eventDetails}.</small></p>`;

                await sendNotificationEmail(subject, body, htmlBody);

                await storage.markNotificationAsSent(notification.id);
                console.log(`Sent and marked notification ${notification.id}`);

            } catch (error) {
                console.error(`Error processing notification ${notification.id}:`, error);
            }
             await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (error) {
        console.error('Error fetching/processing scheduled notifications:', error);
    }
  };

  if (EMAIL_ENABLED) {
      setInterval(checkScheduledNotifications, 60 * 1000);
      console.log('Scheduled notification checker started.');
  } else {
      console.log('Scheduled notification checker is disabled (EMAIL_NOTIFICATIONS_ENABLED=false).');
  }

  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required to access files' });
    }
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}