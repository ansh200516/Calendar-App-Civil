import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();
// Create a MongoDB connection string

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Database and collections
let db: any;
let usersCollection: any;
let eventsCollection: any;
let resourcesCollection: any;
let notificationsCollection: any;

export async function connectToMongoDB() {
  try {
    // Connect the client to the server
    await client.connect();
    
    // Access the database
    db = client.db("calendar-app");
    
    // Access collections
    usersCollection = db.collection("users");
    eventsCollection = db.collection("events");
    resourcesCollection = db.collection("resources");
    notificationsCollection = db.collection("notifications");
    
    // Set up indexes
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await eventsCollection.createIndex({ createdById: 1 });
    await resourcesCollection.createIndex({ eventId: 1 });
    await notificationsCollection.createIndex({ eventId: 1 });
    
    console.log("Successfully connected to MongoDB!");
    
    return {
      db,
      collections: {
        users: usersCollection,
        events: eventsCollection,
        resources: resourcesCollection,
        notifications: notificationsCollection
      }
    };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error("You must connect to MongoDB first!");
  }
  return {
    db,
    collections: {
      users: usersCollection,
      events: eventsCollection,
      resources: resourcesCollection,
      notifications: notificationsCollection
    }
  };
}

export function convertToObjectId(id: string | number): ObjectId {
  if (typeof id === 'string') {
    return new ObjectId(id);
  }
  return new ObjectId(String(id));
}

export { ObjectId };