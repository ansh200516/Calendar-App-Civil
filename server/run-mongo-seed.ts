import { MongoClient } from 'mongodb';
import { connectToMongoDB } from './mongo';

/**
 * This script populates the MongoDB database with initial data.
 * It should be run once during the initial setup of the MongoDB database.
 */
async function seedMongoDB() {
  let client;
  try {
    console.log("Starting MongoDB seed process...");
    const { collections } = await connectToMongoDB();
    
    // Check if users already exist
    const users = await collections.users.find({}).toArray();
    
    if (users.length === 0) {
      console.log("Creating initial data...");
      
      // Create admin user
      const adminUser = {
        username: 'admin@example.com',
        password: 'admin123',
        isAdmin: true
      };
      
      const userResult = await collections.users.insertOne(adminUser);
      const userId = userResult.insertedId;
      console.log(`Created admin user with ID: ${userId}`);
      
      // Create initial events
      const currentYear = new Date().getFullYear();
      const events = [
        {
          title: 'Project Deadline',
          category: 'deadline',
          date: `${currentYear}-05-01`,
          time: '10:00',
          description: 'Submit your final project report through the online portal.',
          location: 'Online Submission Portal',
          createdById: userId
        },
        {
          title: 'Math Quiz',
          category: 'quiz',
          date: `${currentYear}-05-03`,
          time: '14:00',
          description: 'Quiz on chapters 1-5 covering algebra and calculus.',
          location: 'Room 101',
          createdById: userId
        },
        {
          title: 'Guest Lecture',
          category: 'other',
          date: `${currentYear}-05-06`,
          time: '11:30',
          description: 'Guest lecture on advanced topics by Prof. Smith.',
          location: 'Main Auditorium',
          createdById: userId
        },
        {
          title: 'Physics Quiz',
          category: 'quiz',
          date: `${currentYear}-05-08`,
          time: '09:00',
          description: 'Quiz on physics fundamentals and applications.',
          location: 'Room 202',
          createdById: userId
        },
        {
          title: 'Essay Submission',
          category: 'deadline',
          date: `${currentYear}-05-12`,
          time: '23:59',
          description: 'Submit your essay on the assigned topic.',
          location: 'Online Portal',
          createdById: userId
        },
        {
          title: 'Study Group',
          category: 'other',
          date: `${currentYear}-05-15`,
          time: '15:30',
          description: 'Weekly study group for exam preparation.',
          location: 'Library Study Room 3',
          createdById: userId
        },
        {
          title: 'History Quiz',
          category: 'quiz',
          date: `${currentYear}-05-17`,
          time: '14:15',
          description: 'Quiz on world history from 1900-1950.',
          location: 'Room 305',
          createdById: userId
        },
        {
          title: 'Final Project',
          category: 'deadline',
          date: `${currentYear}-05-23`,
          time: '09:00',
          description: 'Submit your final project with all required components.',
          location: 'Department Office',
          createdById: userId
        },
        {
          title: 'Department Meeting',
          category: 'other',
          date: `${currentYear}-05-25`,
          time: '13:00',
          description: 'End of semester department meeting.',
          location: 'Main Auditorium',
          createdById: userId
        },
        {
          title: 'Final Exam',
          category: 'quiz',
          date: `${currentYear}-05-30`,
          time: '10:00',
          description: 'Comprehensive final exam covering all course material.',
          location: 'Exam Hall A',
          createdById: userId
        }
      ];
      
      const eventsResult = await collections.events.insertMany(events);
      console.log(`Created ${Object.keys(eventsResult.insertedIds).length} events`);
      
      // Create notifications
      const finalProject = await collections.events.findOne({ title: 'Final Project' });
      const finalExam = await collections.events.findOne({ title: 'Final Exam' });
      const deptMeeting = await collections.events.findOne({ title: 'Department Meeting' });
      
      if (finalProject && finalExam && deptMeeting) {
        const notifications = [
          {
            eventId: finalProject._id,
            message: 'Reminder: Final Project submission is due soon!',
            notifyAt: new Date(currentYear, 4, 22, 9, 0), // May 22, current year, 9:00 AM
            sent: false
          },
          {
            eventId: finalExam._id,
            message: 'Don\'t forget your Final Exam tomorrow!',
            notifyAt: new Date(currentYear, 4, 29, 10, 0), // May 29, current year, 10:00 AM
            sent: false
          },
          {
            eventId: deptMeeting._id,
            message: 'Department Meeting starts in 1 hour',
            notifyAt: new Date(currentYear, 4, 25, 12, 0), // May 25, current year, 12:00 PM
            sent: false
          }
        ];
        
        const notificationsResult = await collections.notifications.insertMany(notifications);
        console.log(`Created ${Object.keys(notificationsResult.insertedIds).length} notifications`);
      }
      
      console.log("Seed data created successfully!");
    } else {
      console.log("Database already has users. Skipping seed process.");
    }
    
  } catch (error) {
    console.error("Error seeding MongoDB:", error);
  }
}

// Run the seed function
seedMongoDB().catch(console.error);