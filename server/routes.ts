// src/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { MongoStorage } from "./mongo-storage";
import bcrypt from 'bcrypt';
// import mongoose from 'mongoose'; // Remove if not used directly
// import jwt from 'jsonwebtoken'; // Remove if not used directly
// const JWT_SECRET="ab212b4b53"; // Remove if not used directly
// import { storage as defaultStorage } from "./storage"; // Remove if not used directly
import { insertEventSchema, insertNotificationSchema, insertResourceSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import { upload, deleteFile } from "./file-upload";
import { checkAdminIp } from "./middlewares/checkAdminIp";
// import { Schema } from "mongoose"; // Remove if not used directly

// --- Email Sending Imports and Setup ---
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config(); // Load environment variables

// Hardcoded email list for notifications
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
    // Optional: Add timeout or other configurations
    // tls: {
    //   rejectUnauthorized: false // Use only for testing with self-signed certs
    // }
  });

  // Verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error("Email transporter verification failed:", error);
      transporter = null; // Disable email if verification fails
    } else {
      console.log("Email transporter is ready to send messages");
    }
  });

} else {
  console.warn('Email notifications are disabled or configuration is missing.');
}

// Async function to send email
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
    // Consider implementing retry logic or logging to a more robust system
  }
}
// --- End Email Sending Setup ---


// Extend Express session to include user property
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
  // Use global storage if available, otherwise use default
  const storage = new MongoStorage();
  // Set up user sessions
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'calendar-app-secret', // Use env var
    })
  );

  // --- Auth routes (keep as is) ---
  // ... (signup, login, logout, user routes remain the same) ...
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


  // --- Event routes (keep as is) ---
  // ... (GET /events, GET /events/:id, POST /events, PUT /events/:id, DELETE /events/:id remain the same) ...
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
      // Basic validation (consider using a library like validator or stricter regex)
      if (!id || !/^[a-f\d]{24}$/i.test(id)) { // Example: Check if it looks like a MongoDB ObjectId
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

  // Auth middleware to check if user is admin
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
      // Ensure createdById is handled correctly by storage or passed explicitly
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
      // Add validation for req.body if needed
      const updatedEvent = await storage.updateEvent(id, req.body);
      return res.status(200).json(updatedEvent);
    } catch (error) {
      // Add ZodError handling if validating req.body
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
      // Add logic here if deleting an event should delete associated resources/notifications
      await storage.deleteEvent(id);
      return res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // --- Notification routes ---
  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      // Add filtering/pagination if needed
      const notifications = await storage.getNotifications();
      return res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // --- MODIFIED: Post Notification Route ---
  app.post('/api/notifications', isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);

      // Create notification in DB
      const notification = await storage.createNotification(validatedData);

      // --- Send Email Notification ---
      // Trigger email sending asynchronously (don't wait for it to finish)
      sendNotificationEmail(
          `New Notification: ${notification.message.substring(0, 30)}...`, // Subject
          `A new notification has been created:\n\n${notification.message}\n\nScheduled for: ${notification.notifyAt.toLocaleString()}`, // Text Body
          `<p>A new notification has been created:</p><blockquote>${notification.message}</blockquote><p>Scheduled for: ${notification.notifyAt.toLocaleString()}</p>` // HTML Body
      ).catch(err => {
          // Log email sending errors separately, but don't fail the API response
          console.error("Background email sending failed:", err);
      });
      // --- End Send Email ---

      return res.status(201).json(notification); // Return DB notification object

    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }

      console.error('Error creating notification:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  // --- End MODIFIED Post Notification Route ---

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
      await storage.markNotificationAsSent(id); // Assume this updates the 'sent' field
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

    // For simplicity, we don't save these immediate announcements to the DB
    // If you want to keep a record, you'd call storage.createNotification here

    let emailSent = false;
    if (sendEmail && EMAIL_ENABLED) {
        try {
            // Send email immediately (don't wait for it)
            sendNotificationEmail(
                `Announcement`,
                message,
                `<p><b>Announcement:</b></p><p>${message}</p>`
            ).catch(err => console.error("Background email sending for announcement failed:", err));
            emailSent = true;
        } catch (emailError) {
            console.error('Error initiating announcement email:', emailError);
            // Don't fail the request, just log the error
        }
    }

    // Placeholder for immediate browser push (would need WebSocket or Push API)
    // if (sendBrowser) {
    //   // Trigger push notification to connected clients/service workers
    //   console.log("Attempting to trigger immediate browser notification (requires WebSocket/Push API)");
    // }

    return res.status(200).json({
        message: "Announcement processed.",
        emailAttempted: sendEmail && EMAIL_ENABLED,
        // browserPushAttempted: sendBrowser // Indicate if browser push was attempted
    });
});
  // --- Resource routes (keep as is, but add ID validation) ---
  // ... (GET /events/:eventId/resources, POST /events/:eventId/resources, GET /resources/:id/download, DELETE /resources/:id) ...
  // Add ID validation similar to events/notifications routes
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
             // If file was uploaded but event ID invalid, delete the orphaned file
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
            filename: req.file.filename,      // Keep unique generated name if needed
            originalName: req.file.originalname,
            // Store the RELATIVE path within the persistent disk
            filePath: relativeFilePath,       // STORE THIS (e.g., uploads/file-123.pdf)
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedById: userId
        };

          // Validate resourceData if needed (using insertResourceSchema)
          // const validatedResourceData = insertResourceSchema.parse(resourceData); // Might need adjustment
          const resource = await storage.createResource(resourceData); // Pass validated data if parsed
          return res.status(201).json(resource);
      } catch (error) {
           // If file was uploaded but error occurred, try deleting the orphaned file
          if (req.file) { await deleteFile(`uploads/${req.file.filename}`).catch(console.error); }
          // Add ZodError handling if validating resourceData
          console.error('Error uploading resource:', error);
          return res.status(500).json({ message: 'Internal server error' });
      }
  });

// Inside GET /api/resources/:id/download
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

      // --- Get Persistent Disk Path ---
      const mountPath = process.env.RENDER_DISK_MOUNT_PATH;
      if (!mountPath) {
          console.error("FATAL: RENDER_DISK_MOUNT_PATH environment variable is not set!");
          return res.status(500).json({ message: 'Server configuration error (disk path missing)' });
      }

      // --- Construct Full Path ---
      // Assumes resource.filePath is stored like "uploads/file-abc.pdf"
      const filePath = path.join(mountPath, resource.filePath);
      console.log(`Attempting to download file from: ${filePath}`); // Logging

      // --- Check File Existence (Crucial Debug Step) ---
      try {
          // Use fs.promises.access for async check
          await fs.promises.access(filePath, fs.constants.R_OK); // Check read access
          console.log(`File exists and is readable: ${filePath}`);
      } catch (err: any) {
           console.error(`File not found or not readable at path ${filePath}:`, err);
           // Send a specific 404 if the file itself is missing on disk
           return res.status(404).json({ message: 'File not found on server storage.' });
      }

      // --- Send File ---
      // Set header *before* calling download/sendFile
       res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(resource.originalName)}`);

      // Use res.download (it handles Content-Type etc.)
      return res.download(filePath, resource.originalName, (err) => {
          if (err) {
              console.error(`Error during file download stream for ${filePath}:`, err);
              // Avoid sending another response if headers were already sent
              if (!res.headersSent) {
                   // Check error type if possible
                   if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                      // This shouldn't happen if the access check above passed, but maybe a race condition?
                       return res.status(404).json({ message: 'File disappeared before sending' });
                   } else {
                       return res.status(500).json({ message: 'Error sending file' });
                   }
              } else {
                   // If headers are sent, the connection might be broken. Nothing much to do here.
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

          // Attempt to delete file first
          try {
            // Pass the relative path stored in the DB
            await deleteFile(resource.filePath);
        } catch (fileError) {
            console.error(`Failed to delete file from filesystem: ${resource.filePath}. Error: ${fileError}. Proceeding to delete database record.`);
            // Decide if this is critical. If the DB record is deleted, the file is orphaned.
            // You might want to return 500 here if file deletion fails.
            // return res.status(500).json({ message: 'Failed to delete file from filesystem, database record not deleted' });
        }

          await storage.deleteResource(id);
          return res.status(200).json({ message: 'Resource deleted successfully' });
      } catch (error) {
          console.error('Error deleting resource:', error);
          return res.status(500).json({ message: 'Internal server error' });
      }
  });

    // --- Scheduled Notification Sender (Simple Interval Timer) ---
  // WARNING: Not suitable for production scale. Consider using a proper job scheduler (node-cron, BullMQ)
  // or a dedicated microservice for reliable notification delivery.
  const checkScheduledNotifications = async () => {
    if (!EMAIL_ENABLED) return; // Don't run if emails are globally disabled

    console.log('Checking for scheduled notifications to send...');
    try {
        const now = new Date();
        const dueNotifications = await storage.getDueNotifications(now); // Needs new storage method

        if (dueNotifications.length === 0) {
            console.log('No due notifications found.');
            return;
        }

        console.log(`Found ${dueNotifications.length} due notifications.`);

        for (const notification of dueNotifications) {
            try {
                // Fetch related event details if necessary (for message customization)
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

                // Send email
                await sendNotificationEmail(subject, body, htmlBody);

                // Mark notification as sent in DB
                await storage.markNotificationAsSent(notification.id);
                console.log(`Sent and marked notification ${notification.id}`);

            } catch (error) {
                console.error(`Error processing notification ${notification.id}:`, error);
                // Optionally mark as failed or retry later
            }
             // Add a small delay to avoid overwhelming the email server
             await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (error) {
        console.error('Error fetching/processing scheduled notifications:', error);
    }
  };

  // Run check every minute (adjust interval as needed)
  // Ensure storage methods like getDueNotifications and markNotificationAsSent exist
  if (EMAIL_ENABLED) {
      setInterval(checkScheduledNotifications, 60 * 1000); // Check every 60 seconds
      console.log('Scheduled notification checker started.');
  } else {
      console.log('Scheduled notification checker is disabled (EMAIL_NOTIFICATIONS_ENABLED=false).');
  }

  // Serve static files from uploads directory
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required to access files' });
    }
    // Consider adding more granular access control if needed
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}