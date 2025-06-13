import { db } from "./db";
import { users, events, notifications } from "@shared/schema";
import type { InsertUser, InsertEvent, InsertNotification } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");


  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {

    const adminUser: InsertUser = {
      username: 'admin@example.com',
      password: 'admin123',
      isAdmin: true,
    };
    
    const [user] = await db.insert(users).values(adminUser).returning();
    console.log("Created admin user:", user.id);
    

    const currentYear = new Date().getFullYear();
    const demoEvents: InsertEvent[] = [
      {
        title: 'Project Deadline',
        category: 'deadline',
        date: `${currentYear}-05-01`,
        time: '10:00',
        description: 'Submit your final project report through the online portal.',
        location: 'Online Submission Portal',
        createdById: user.id
      },
      {
        title: 'Math Quiz',
        category: 'quiz',
        date: `${currentYear}-05-03`,
        time: '14:00',
        description: 'Quiz on chapters 1-5 covering algebra and calculus.',
        location: 'Room 101',
        createdById: user.id
      },
      {
        title: 'Guest Lecture',
        category: 'other',
        date: `${currentYear}-05-06`,
        time: '11:30',
        description: 'Guest lecture on advanced topics by Prof. Smith.',
        location: 'Main Auditorium',
        createdById: user.id
      },
      {
        title: 'Physics Quiz',
        category: 'quiz',
        date: `${currentYear}-05-08`,
        time: '09:00',
        description: 'Quiz on physics fundamentals and applications.',
        location: 'Room 202',
        createdById: user.id
      },
      {
        title: 'Essay Submission',
        category: 'deadline',
        date: `${currentYear}-05-12`,
        time: '23:59',
        description: 'Submit your essay on the assigned topic.',
        location: 'Online Portal',
        createdById: user.id
      },
      {
        title: 'Study Group',
        category: 'other',
        date: `${currentYear}-05-15`,
        time: '15:30',
        description: 'Weekly study group for exam preparation.',
        location: 'Library Study Room 3',
        createdById: user.id
      },
      {
        title: 'History Quiz',
        category: 'quiz',
        date: `${currentYear}-05-17`,
        time: '14:15',
        description: 'Quiz on world history from 1900-1950.',
        location: 'Room 305',
        createdById: user.id
      },
      {
        title: 'Final Project',
        category: 'deadline',
        date: `${currentYear}-05-23`,
        time: '09:00',
        description: 'Submit your final project with all required components.',
        location: 'Department Office',
        createdById: user.id
      },
      {
        title: 'Department Meeting',
        category: 'other',
        date: `${currentYear}-05-25`,
        time: '13:00',
        description: 'End of semester department meeting.',
        location: 'Main Auditorium',
        createdById: user.id
      },
      {
        title: 'Final Exam',
        category: 'quiz',
        date: `${currentYear}-05-30`,
        time: '10:00',
        description: 'Comprehensive final exam covering all course material.',
        location: 'Exam Hall A',
        createdById: user.id
      }
    ];
    
    const createdEvents = await db.insert(events).values(demoEvents).returning();
    console.log(`Created ${createdEvents.length} events`);
    

    const finalProjectEvent = createdEvents.find(e => e.title === 'Final Project');
    const finalExamEvent = createdEvents.find(e => e.title === 'Final Exam');
    const deptMeetingEvent = createdEvents.find(e => e.title === 'Department Meeting');
    
    if (finalProjectEvent && finalExamEvent && deptMeetingEvent) {
      const notificationData: InsertNotification[] = [
        {
          eventId: finalProjectEvent.id,
          message: 'Reminder: Final Project submission is due soon!',
          notifyAt: new Date(currentYear, 4, 22, 9, 0) // May 22, current year, 9:00 AM
        },
        {
          eventId: finalExamEvent.id,
          message: 'Don\'t forget your Final Exam tomorrow!',
          notifyAt: new Date(currentYear, 4, 29, 10, 0) // May 29, current year, 10:00 AM
        },
        {
          eventId: deptMeetingEvent.id,
          message: 'Department Meeting starts in 1 hour',
          notifyAt: new Date(currentYear, 4, 25, 12, 0) // May 25, current year, 12:00 PM
        }
      ];
      
      const createdNotifications = await db.insert(notifications).values(notificationData).returning();
      console.log(`Created ${createdNotifications.length} notifications`);
    }
    
    console.log("Database seeding completed!");
  } else {
    console.log("Database already contains data, skipping seed");
  }
}


seedDatabase().catch(error => {
  console.error("Error seeding database:", error);
  process.exit(1);
});