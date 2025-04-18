// src/mongo-storage.ts
import {
  type User, type InsertUser,
  type Event, type InsertEvent,
  type Resource, type InsertResource,
  type Notification as TNotification, // Alias Notification type
  type InsertNotification
} from "@shared/schema";
import { IStorage } from "./storage"; // Assuming this interface exists
import { getDb, convertToObjectId, ObjectId } from "./mongo"; // Assuming mongo utils exist
import { deleteFile } from "./file-upload"; // *** IMPORT deleteFile ***

export class MongoStorage implements IStorage {
  // --- User methods (Keep as is) ---
  async getUser(id: number | string): Promise<User | undefined> { // Allow string ID
    const { collections } = getDb();
    const user = await collections.users.findOne({ _id: convertToObjectId(id) });
    if (!user) return undefined;

    // Convert MongoDB _id to id to match our schema
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password, // Be careful exposing password hash
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
      password: insertUser.password, // Assume password is already hashed before calling this
      isAdmin: insertUser.isAdmin || false
    });

    return {
      id: result.insertedId.toString(),
      username: insertUser.username,
      password: insertUser.password, // Hashed password
      isAdmin: insertUser.isAdmin || false
    };
  }

  // --- Event methods (Keep as is, ensure createEvent/updateEvent return mapped objects) ---
   async getEvents(): Promise<Event[]> {
    const { collections } = getDb();
    // Optional: Sort by date/time by default if desired
    const events = await collections.events.find({}).sort({ date: 1, time: 1 }).toArray();

    return events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description || undefined, // Use undefined if null/optional
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location || undefined, // Use undefined if null/optional
      createdById: event.createdById ? event.createdById.toString() : '' // Ensure string return
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
      description: insertEvent.description || undefined, // Store as undefined if optional
      category: insertEvent.category,
      date: insertEvent.date,
      time: insertEvent.time,
      location: insertEvent.location || undefined, // Store as undefined if optional
      // Ensure createdById is a string before converting
      createdById: insertEvent.createdById ? convertToObjectId(insertEvent.createdById.toString()) : undefined
    };

    const result = await collections.events.insertOne(eventToInsert);

    // Map the inserted document back to the Event type
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

    // Prepare update object, converting IDs if necessary
    const updateObj: any = { ...updateEvent };
    if (updateObj.createdById) {
        updateObj.createdById = convertToObjectId(updateObj.createdById.toString());
    }
    // Remove fields that shouldn't be directly set via update if necessary (e.g., id)
    delete updateObj.id;


    const result = await collections.events.findOneAndUpdate(
      { _id: convertToObjectId(id) },
      { $set: updateObj },
      { returnDocument: 'after' } // Ensures the updated document is returned
    );

    // Check if result.value exists before accessing its properties
    if (!result) return undefined;

    // Map the updated document back to the Event type
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

  // --- Resource methods (Keep as is) ---
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
      uploadedAt: resource.uploadedAt, // Should already be a Date object
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
      uploadedAt: new Date(), // Set current date/time
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
    // Note: File deletion from storage should happen *before* calling this, typically in the route handler
  }

  // --- Notification methods (MODIFY/ADD) ---

  // MODIFIED: Added sorting options
  async getNotifications(options?: { sortBy?: string, order?: 'asc' | 'desc' }): Promise<TNotification[]> {
    const { collections } = getDb();

    // Define sort order
    let sortCriteria: any = { notifyAt: -1 }; // Default sort: newest first
    if (options?.sortBy) {
        sortCriteria = { [options.sortBy]: options.order === 'asc' ? 1 : -1 };
    }

    const notifications = await collections.notifications.find({})
        .sort(sortCriteria)
        .toArray();

    // Map to TNotification type
    return notifications.map(notification => ({
      id: notification._id.toString(),
      // Handle optional eventId
      eventId: notification.eventId ? notification.eventId.toString() : undefined,
      message: notification.message,
      notifyAt: notification.notifyAt, // Should already be a Date object
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
      // Handle optional eventId
      eventId: insertNotification.eventId ? convertToObjectId(insertNotification.eventId.toString()) : undefined,
      message: insertNotification.message,
      notifyAt: insertNotification.notifyAt, // Should be a Date object from schema validation
      sent: false // Default to false
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

  // ADDED: Get notifications due to be sent
  async getDueNotifications(date: Date): Promise<TNotification[]> {
      const { collections } = getDb();
      const notifications = await collections.notifications.find({
          sent: false,
          notifyAt: { $lte: date } // Find notifications where notifyAt is less than or equal to the current date
      }).toArray();

      // Map to TNotification type
      return notifications.map(notification => ({
          id: notification._id.toString(),
          eventId: notification.eventId ? notification.eventId.toString() : undefined,
          message: notification.message,
          notifyAt: notification.notifyAt,
          sent: notification.sent
      }));
  }

  // Keep existing markNotificationAsSent
  async markNotificationAsSent(id: number | string): Promise<boolean> {
    const { collections } = getDb();
    const result = await collections.notifications.updateOne(
      { _id: convertToObjectId(id), sent: false }, // Added sent: false condition
      { $set: { sent: true } }
    );
    return result.modifiedCount > 0;
  }

  // ADDED: Delete notifications associated with an event
  async deleteNotificationsByEventId(eventId: number | string): Promise<void> {
      const { collections } = getDb();
      await collections.notifications.deleteMany({ eventId: convertToObjectId(eventId) });
  }

  // ADDED: Delete resources associated with an event (including files)
  async deleteResourcesByEventId(eventId: number | string): Promise<void> {
      const { collections } = getDb();
      const eventObjectId = convertToObjectId(eventId);

      // Find resources to get file paths
      const resourcesToDelete = await collections.resources.find({ eventId: eventObjectId }).toArray();

      // Attempt to delete associated files
      for (const resource of resourcesToDelete) {
          if (resource.filePath) {
              try {
                  await deleteFile(resource.filePath); // Use the imported deleteFile function
                  console.log(`Deleted file for resource ${resource._id}: ${resource.filePath}`);
              } catch (fileError: any) {
                  // Log error but continue to delete DB record
                  console.warn(`Failed to delete file ${resource.filePath} for event ${eventId}: ${fileError.message}`);
              }
          }
      }

      // Delete database records
      await collections.resources.deleteMany({ eventId: eventObjectId });
  }

} // End of MongoStorage class