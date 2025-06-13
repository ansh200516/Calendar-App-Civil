import {
  type User, type InsertUser,
  type Event, type InsertEvent,
  type Resource, type InsertResource,
  type Notification as TNotification,
  type InsertNotification
} from "@shared/schema";
import { IStorage } from "./storage";
import { getDb, convertToObjectId, ObjectId } from "./mongo";
import { deleteFile } from "./file-upload";

export class MongoStorage implements IStorage {
  async getUser(id: number | string): Promise<User | undefined> {
    const { collections } = getDb();
    const user = await collections.users.findOne({ _id: convertToObjectId(id) });
    if (!user) return undefined;

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

   async getEvents(): Promise<Event[]> {
    const { collections } = getDb();
    const events = await collections.events.find({}).sort({ date: 1, time: 1 }).toArray();

    return events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description || undefined,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location || undefined,
      createdById: event.createdById ? event.createdById.toString() : ''
    }));
  }

  async getEvent(id: number | string): Promise<Event | undefined> {
    const { collections } = getDb();
    const event = await collections.events.findOne({ _id: convertToObjectId(id) });
    if (!event) return undefined;

    return {
      id: event._id.toString(),
      title: event.title,
      description: event.description || undefined,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location || undefined,
      createdById: event.createdById ? event.createdById.toString() : ''
    };
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const { collections } = getDb();

    const eventToInsert = {
      title: insertEvent.title,
      description: insertEvent.description || undefined,
      category: insertEvent.category,
      date: insertEvent.date,
      time: insertEvent.time,
      location: insertEvent.location || undefined,
      createdById: insertEvent.createdById ? convertToObjectId(insertEvent.createdById.toString()) : undefined
    };

    const result = await collections.events.insertOne(eventToInsert);

    return {
      id: result.insertedId.toString(),
      title: eventToInsert.title,
      description: eventToInsert.description,
      category: eventToInsert.category,
      date: eventToInsert.date,
      time: eventToInsert.time,
      location: eventToInsert.location,
      createdById: eventToInsert.createdById ? eventToInsert.createdById.toString() : ''
    };
  }

  async updateEvent(id: number | string, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const { collections } = getDb();

    const updateObj: any = { ...updateEvent };
    if (updateObj.createdById) {
        updateObj.createdById = convertToObjectId(updateObj.createdById.toString());
    }
    delete updateObj.id;


    const result = await collections.events.findOneAndUpdate(
      { _id: convertToObjectId(id) },
      { $set: updateObj },
      { returnDocument: 'after' }
    );

    if (!result) return undefined;

    return {
      id: result._id.toString(),
      title: result.title,
      description: result.description || undefined,
      category: result.category,
      date: result.date,
      time: result.time,
      location: result.location || undefined,
      createdById: result.createdById ? result.createdById.toString() : ''
    };
  }

  async deleteEvent(id: number | string): Promise<boolean> {
    const { collections } = getDb();
    const result = await collections.events.deleteOne({ _id: convertToObjectId(id) });
    return result.deletedCount > 0;
  }

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
      uploadedById: resource.uploadedById ? resource.uploadedById.toString() : ''
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
      uploadedById: resource.uploadedById ? resource.uploadedById.toString() : ''
    };
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const { collections } = getDb();

    const resourceToInsert = {
      eventId: convertToObjectId(insertResource.eventId.toString()),
      filename: insertResource.filename,
      originalName: insertResource.originalName,
      filePath: insertResource.filePath,
      fileType: insertResource.fileType,
      fileSize: insertResource.fileSize,
      uploadedAt: new Date(),
      uploadedById: insertResource.uploadedById ? convertToObjectId(insertResource.uploadedById.toString()) : undefined
    };

    const result = await collections.resources.insertOne(resourceToInsert);

    return {
      id: result.insertedId.toString(),
      eventId: resourceToInsert.eventId.toString(),
      filename: resourceToInsert.filename,
      originalName: resourceToInsert.originalName,
      filePath: resourceToInsert.filePath,
      fileType: resourceToInsert.fileType,
      fileSize: resourceToInsert.fileSize,
      uploadedAt: resourceToInsert.uploadedAt,
      uploadedById: resourceToInsert.uploadedById ? resourceToInsert.uploadedById.toString() : ''
    };
  }

  async deleteResource(id: number | string): Promise<boolean> {
    const { collections } = getDb();
    const result = await collections.resources.deleteOne({ _id: convertToObjectId(id) });
    return result.deletedCount > 0;
  }

  async getNotifications(options?: { sortBy?: string, order?: 'asc' | 'desc' }): Promise<TNotification[]> {
    const { collections } = getDb();

    let sortCriteria: any = { notifyAt: -1 };
    if (options?.sortBy) {
        sortCriteria = { [options.sortBy]: options.order === 'asc' ? 1 : -1 };
    }

    const notifications = await collections.notifications.find({})
        .sort(sortCriteria)
        .toArray();

    return notifications.map(notification => ({
      id: notification._id.toString(),
      eventId: notification.eventId ? notification.eventId.toString() : undefined,
      message: notification.message,
      notifyAt: notification.notifyAt,
      sent: notification.sent
    }));
  }

  async getNotification(id: number | string): Promise<TNotification | undefined> {
    const { collections } = getDb();
    const notification = await collections.notifications.findOne({ _id: convertToObjectId(id) });
    if (!notification) return undefined;

    return {
      id: notification._id.toString(),
      eventId: notification.eventId ? notification.eventId.toString() : undefined,
      message: notification.message,
      notifyAt: notification.notifyAt,
      sent: notification.sent
    };
  }

  async createNotification(insertNotification: InsertNotification): Promise<TNotification> {
    const { collections } = getDb();

    const notificationToInsert = {
      eventId: insertNotification.eventId ? convertToObjectId(insertNotification.eventId.toString()) : undefined,
      message: insertNotification.message,
      notifyAt: insertNotification.notifyAt,
      sent: false
    };

    const result = await collections.notifications.insertOne(notificationToInsert);

    return {
      id: result.insertedId.toString(),
      eventId: notificationToInsert.eventId ? notificationToInsert.eventId.toString() : undefined,
      message: notificationToInsert.message,
      notifyAt: notificationToInsert.notifyAt,
      sent: notificationToInsert.sent
    };
  }

  async getDueNotifications(date: Date): Promise<TNotification[]> {
      const { collections } = getDb();
      const notifications = await collections.notifications.find({
          sent: false,
          notifyAt: { $lte: date }
      }).toArray();

      return notifications.map(notification => ({
          id: notification._id.toString(),
          eventId: notification.eventId ? notification.eventId.toString() : undefined,
          message: notification.message,
          notifyAt: notification.notifyAt,
          sent: notification.sent
      }));
  }

  async markNotificationAsSent(id: number | string): Promise<boolean> {
    const { collections } = getDb();
    const result = await collections.notifications.updateOne(
      { _id: convertToObjectId(id), sent: false },
      { $set: { sent: true } }
    );
    return result.modifiedCount > 0;
  }

  async deleteNotificationsByEventId(eventId: number | string): Promise<void> {
      const { collections } = getDb();
      await collections.notifications.deleteMany({ eventId: convertToObjectId(eventId) });
  }

  async deleteResourcesByEventId(eventId: number | string): Promise<void> {
      const { collections } = getDb();
      const eventObjectId = convertToObjectId(eventId);

      const resourcesToDelete = await collections.resources.find({ eventId: eventObjectId }).toArray();

      for (const resource of resourcesToDelete) {
          if (resource.filePath) {
              try {
                  await deleteFile(resource.filePath);
                  console.log(`Deleted file for resource ${resource._id}: ${resource.filePath}`);
              } catch (fileError: any) {
                  console.warn(`Failed to delete file ${resource.filePath} for event ${eventId}: ${fileError.message}`);
              }
          }
      }

      await collections.resources.deleteMany({ eventId: eventObjectId });
  }

}