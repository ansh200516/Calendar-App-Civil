import { 
  type User, type InsertUser,
  type Event, type InsertEvent,
  type Resource, type InsertResource,
  type Notification, type InsertNotification
} from "@shared/schema";
import { IStorage } from "./storage";
import { getDb, convertToObjectId, ObjectId } from "./mongo";

export class MongoStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { collections } = getDb();
    const user = await collections.users.findOne({ _id: convertToObjectId(id) });
    if (!user) return undefined;
    
    // Convert MongoDB _id to id to match our schema
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      isAdmin: user.isAdmin
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { collections } = getDb();
    const user = await collections.users.findOne({ username });
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      isAdmin: user.isAdmin
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { collections } = getDb();
    const result = await collections.users.insertOne({
      username: insertUser.username,
      password: insertUser.password,
      isAdmin: insertUser.isAdmin || false
    });
    
    return {
      id: result.insertedId.toString(),
      username: insertUser.username,
      password: insertUser.password,
      isAdmin: insertUser.isAdmin || false
    };
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    const { collections } = getDb();
    const events = await collections.events.find({}).toArray();
    
    return events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location,
      createdById: event.createdById ? event.createdById.toString() : null
    }));
  }
  
  async getEvent(id: number | string): Promise<Event | undefined> {
    const { collections } = getDb();
    const event = await collections.events.findOne({ _id: convertToObjectId(id) });
    if (!event) return undefined;
    
    return {
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location,
      createdById: event.createdById ? event.createdById.toString() : null
    };
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const { collections } = getDb();
    
    // Convert createdById to ObjectId if it exists
    const eventToInsert = {
      title: insertEvent.title,
      description: insertEvent.description || null,
      category: insertEvent.category,
      date: insertEvent.date,
      time: insertEvent.time,
      location: insertEvent.location || null,
      createdById: insertEvent.createdById ? convertToObjectId(insertEvent.createdById) : null
    };
    
    const result = await collections.events.insertOne(eventToInsert);
    
    return {
      id: result.insertedId.toString(),
      ...eventToInsert,
      createdById: eventToInsert.createdById ? eventToInsert.createdById.toString() : null
    };
  }
  
  async updateEvent(id: number | string, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const { collections } = getDb();
    
    // Convert createdById to ObjectId if it exists in the update
    const updateObj: any = { ...updateEvent };
    if (updateObj.createdById) {
      updateObj.createdById = convertToObjectId(updateObj.createdById);
    }
    
    const result = await collections.events.findOneAndUpdate(
      { _id: convertToObjectId(id) },
      { $set: updateObj },
      { returnDocument: 'after' }
    );
    
    if (!result) return undefined;
    
    return {
      id: result._id.toString(),
      title: result.title,
      description: result.description,
      category: result.category,
      date: result.date,
      time: result.time,
      location: result.location,
      createdById: result.createdById ? result.createdById.toString() : null
    };
  }
  
  async deleteEvent(id: number | string): Promise<boolean> {
    const { collections } = getDb();
    const result = await collections.events.deleteOne({ _id: convertToObjectId(id) });
    return result.deletedCount > 0;
  }
  
  // Resource methods
  async getResourcesByEventId(eventId: number | string): Promise<Resource[]> {
    const { collections } = getDb();
    const resources = await collections.resources.find({ 
      eventId: convertToObjectId(eventId) 
    }).toArray();
    
    return resources.map(resource => ({
      id: resource._id.toString(),
      eventId: resource.eventId.toString(),
      filename: resource.filename,
      originalName: resource.originalName,
      filePath: resource.filePath,
      fileType: resource.fileType,
      fileSize: resource.fileSize,
      uploadedAt: resource.uploadedAt,
      uploadedById: resource.uploadedById ? resource.uploadedById.toString() : null
    }));
  }
  
  async getResource(id: number | string): Promise<Resource | undefined> {
    const { collections } = getDb();
    const resource = await collections.resources.findOne({ _id: convertToObjectId(id) });
    if (!resource) return undefined;
    
    return {
      id: resource._id.toString(),
      eventId: resource.eventId.toString(),
      filename: resource.filename,
      originalName: resource.originalName,
      filePath: resource.filePath,
      fileType: resource.fileType,
      fileSize: resource.fileSize,
      uploadedAt: resource.uploadedAt,
      uploadedById: resource.uploadedById ? resource.uploadedById.toString() : null
    };
  }
  
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const { collections } = getDb();
    
    const resourceToInsert = {
      eventId: convertToObjectId(insertResource.eventId),
      filename: insertResource.filename,
      originalName: insertResource.originalName,
      filePath: insertResource.filePath,
      fileType: insertResource.fileType,
      fileSize: insertResource.fileSize,
      uploadedAt: new Date(),
      uploadedById: insertResource.uploadedById ? convertToObjectId(insertResource.uploadedById) : null
    };
    
    const result = await collections.resources.insertOne(resourceToInsert);
    
    return {
      id: result.insertedId.toString(),
      ...resourceToInsert,
      eventId: resourceToInsert.eventId.toString(),
      uploadedById: resourceToInsert.uploadedById ? resourceToInsert.uploadedById.toString() : null
    };
  }
  
  async deleteResource(id: number | string): Promise<boolean> {
    const { collections } = getDb();
    const result = await collections.resources.deleteOne({ _id: convertToObjectId(id) });
    return result.deletedCount > 0;
  }
  
  // Notification methods
  async getNotifications(): Promise<Notification[]> {
    const { collections } = getDb();
    const notifications = await collections.notifications.find({}).toArray();
    
    return notifications.map(notification => ({
      id: notification._id.toString(),
      eventId: notification.eventId ? notification.eventId.toString() : null,
      message: notification.message,
      notifyAt: notification.notifyAt,
      sent: notification.sent
    }));
  }
  
  async getNotification(id: number | string): Promise<Notification | undefined> {
    const { collections } = getDb();
    const notification = await collections.notifications.findOne({ _id: convertToObjectId(id) });
    if (!notification) return undefined;
    
    return {
      id: notification._id.toString(),
      eventId: notification.eventId ? notification.eventId.toString() : null,
      message: notification.message,
      notifyAt: notification.notifyAt,
      sent: notification.sent
    };
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const { collections } = getDb();
    
    const notificationToInsert = {
      eventId: insertNotification.eventId ? convertToObjectId(insertNotification.eventId) : null,
      message: insertNotification.message || null,
      notifyAt: insertNotification.notifyAt,
      sent: false
    };
    
    const result = await collections.notifications.insertOne(notificationToInsert);
    
    return {
      id: result.insertedId.toString(),
      ...notificationToInsert,
      eventId: notificationToInsert.eventId ? notificationToInsert.eventId.toString() : null
    };
  }
  
  async markNotificationAsSent(id: number | string): Promise<boolean> {
    const { collections } = getDb();
    const result = await collections.notifications.updateOne(
      { _id: convertToObjectId(id) },
      { $set: { sent: true } }
    );
    return result.modifiedCount > 0;
  }
}