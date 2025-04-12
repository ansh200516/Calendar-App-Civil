import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  resources, type Resource, type InsertResource,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Resource methods
  getResourcesByEventId(eventId: number): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  deleteResource(id: number): Promise<boolean>;
  
  // Notification methods
  getNotifications(): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsSent(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private resources: Map<number, Resource>;
  private notifications: Map<number, Notification>;
  private userId: number;
  private eventId: number;
  private resourceId: number;
  private notificationId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.resources = new Map();
    this.notifications = new Map();
    this.userId = 1;
    this.eventId = 1;
    this.resourceId = 1;
    this.notificationId = 1;
    
    // Set up some default users
    this.createUser({
      username: 'admin@example.com',
      password: 'password',
      isAdmin: true
    });
    
    // Set up demo events
    const currentYear = new Date().getFullYear();
    const demoEvents: InsertEvent[] = [
      {
        title: 'Project Deadline',
        category: 'deadline',
        date: `${currentYear}-05-01`,
        time: '10:00',
        description: 'Submit your final project report through the online portal.',
        location: 'Online Submission Portal',
        createdById: 1
      },
      {
        title: 'Math Quiz',
        category: 'quiz',
        date: `${currentYear}-05-03`,
        time: '14:00',
        description: 'Quiz on chapters 1-5 covering algebra and calculus.',
        location: 'Room 101',
        createdById: 1
      },
      {
        title: 'Guest Lecture',
        category: 'other',
        date: `${currentYear}-05-06`,
        time: '11:30',
        description: 'Guest lecture on advanced topics by Prof. Smith.',
        location: 'Main Auditorium',
        createdById: 1
      },
      {
        title: 'Physics Quiz',
        category: 'quiz',
        date: `${currentYear}-05-08`,
        time: '09:00',
        description: 'Quiz on physics fundamentals and applications.',
        location: 'Room 202',
        createdById: 1
      },
      {
        title: 'Essay Submission',
        category: 'deadline',
        date: `${currentYear}-05-12`,
        time: '23:59',
        description: 'Submit your essay on the assigned topic.',
        location: 'Online Portal',
        createdById: 1
      },
      {
        title: 'Study Group',
        category: 'other',
        date: `${currentYear}-05-15`,
        time: '15:30',
        description: 'Weekly study group for exam preparation.',
        location: 'Library Study Room 3',
        createdById: 1
      },
      {
        title: 'History Quiz',
        category: 'quiz',
        date: `${currentYear}-05-17`,
        time: '14:15',
        description: 'Quiz on world history from 1900-1950.',
        location: 'Room 305',
        createdById: 1
      },
      {
        title: 'Final Project',
        category: 'deadline',
        date: `${currentYear}-05-23`,
        time: '09:00',
        description: 'Submit your final project with all required components.',
        location: 'Department Office',
        createdById: 1
      },
      {
        title: 'Department Meeting',
        category: 'other',
        date: `${currentYear}-05-25`,
        time: '13:00',
        description: 'End of semester department meeting.',
        location: 'Main Auditorium',
        createdById: 1
      },
      {
        title: 'Final Exam',
        category: 'quiz',
        date: `${currentYear}-05-30`,
        time: '10:00',
        description: 'Comprehensive final exam covering all course material.',
        location: 'Exam Hall A',
        createdById: 1
      }
    ];
    
    demoEvents.forEach(event => this.createEvent(event));
    
    // Create mock notifications
    const notificationData: InsertNotification[] = [
      {
        eventId: 8, // Final Project
        message: 'Reminder: Final Project submission is due soon!',
        notifyAt: new Date(currentYear, 4, 22, 9, 0) // May 22, current year, 9:00 AM
      },
      {
        eventId: 10, // Final Exam
        message: 'Don\'t forget your Final Exam tomorrow!',
        notifyAt: new Date(currentYear, 4, 29, 10, 0) // May 29, current year, 10:00 AM
      },
      {
        eventId: 9, // Department Meeting
        message: 'Department Meeting starts in 1 hour',
        notifyAt: new Date(currentYear, 4, 25, 12, 0) // May 25, current year, 12:00 PM
      }
    ];
    
    notificationData.forEach(notification => this.createNotification(notification));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false
    };
    this.users.set(id, user);
    return user;
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const event: Event = { 
      ...insertEvent, 
      id,
      description: insertEvent.description ?? null,
      location: insertEvent.location ?? null,
      createdById: insertEvent.createdById ?? null
    };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent: Event = { ...event, ...updateEvent };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }
  
  // Resource methods
  async getResourcesByEventId(eventId: number): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.eventId === eventId
    );
  }
  
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }
  
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.resourceId++;
    const resource: Resource = {
      ...insertResource,
      id,
      uploadedAt: new Date(),
      uploadedById: insertResource.uploadedById ?? null
    };
    this.resources.set(id, resource);
    return resource;
  }
  
  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }
  
  // Notification methods
  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values());
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      sent: false,
      message: insertNotification.message ?? null,
      eventId: insertNotification.eventId ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsSent(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.sent = true;
    this.notifications.set(id, notification);
    return true;
  }
}

export const storage = new MemStorage();
