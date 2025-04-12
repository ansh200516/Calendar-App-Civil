import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { insertEventSchema, insertNotificationSchema, insertResourceSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import { upload, deleteFile } from "./file-upload";

export async function registerRoutes(app: Express): Promise<Server> {
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
      secret: 'calendar-app-secret', // In production, use environment variable
    })
  );

  // Auth routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set user in session (except password)
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
  
  // Event routes
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
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
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
  const isAdmin = (req: Request, res: Response, next: Function) => {
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
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
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
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
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
  
  // Notification routes
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
  
  app.put('/api/notifications/:id/mark-sent', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
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

  const httpServer = createServer(app);
  return httpServer;
}
