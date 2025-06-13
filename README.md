# Calendar App

A full-featured calendar application.

## Table of Contents

- [About The Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [License](#license)
- [Contact](#contact)

## About The Project

A full-featured calendar application built with a modern tech stack. This application allows users to manage their schedules, events, and tasks efficiently. It features a secure authentication system and a responsive user interface.

*(Further details will be added as I explore the codebase.)*

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Radix UI (likely via shadcn/ui)
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB
- **Authentication:** Passport.js, JWT, bcrypt

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- Node.js (v20.x or higher recommended)
- npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username_/Project-Name.git
   ```
2. Install NPM packages. This will install both server and client dependencies.
   ```sh
   npm install
   ```
3. Set up your environment variables. Create a `.env` file in the root of the project and add the necessary variables.

   ```ini
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/calendar-app

   # Express Session Secret
   SESSION_SECRET=your-very-secret-key

   # Email Notifications (using nodemailer)
   # Enable or disable email notifications
   EMAIL_NOTIFICATIONS_ENABLED=true

   # SMTP Server details
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=user@example.com
   EMAIL_PASS=your-email-password
   EMAIL_FROM="Your App Name" <noreply@example.com>

   # Optional: For file uploads when deploying on Render
   # RENDER_DISK_MOUNT_PATH=/var/data/uploads
   ```

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in the development mode.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run start`: Runs the built app in production mode.
- `npm run db:push`: Pushes the drizzle schema changes to the database.
- `npm run check`: Type-checks the project files.

## Usage

*(Instructions on how to use the application will be added here.)*

## Project Structure

The project is a monorepo with the client and server code in separate directories.

```
.
├── client/         # Frontend code (React, Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── ...
├── server/         # Backend code (Express.js)
│   ├── src/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.ts
│   └── ...
├── uploads/        # Directory for file uploads
├── drizzle.config.ts # Drizzle ORM configuration (currently unused)
├── package.json    # Project dependencies and scripts
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json   # TypeScript configuration
└── vite.config.ts  # Vite configuration
```

A brief explanation of the key directories:

-   `client`: Contains the React frontend application.
    -   `client/src`: Main source code for the client.
        -   `components`: Reusable React components.
        -   `lib`: Helper functions and libraries.
        -   `pages`: Main pages of the application.
-   `server`: Contains the Express.js backend application.
    -   `server/src`: Main source code for the server.
        -   `db`: Database connection and schema.
        -   `middleware`: Express middleware.
        -   `models`: Mongoose models.
        -   `routes`: API routes.
-   `uploads`: Stores files uploaded by users.

## API Endpoints

The server exposes the following REST API endpoints.

### Authentication

| Method | Endpoint          | Description                    |
| ------ | ----------------- | ------------------------------ |
| POST   | `/api/auth/signup`| Register a new user (admin only) |
| POST   | `/api/auth/login` | Login a user                   |
| POST   | `/api/auth/logout`| Logout a user                  |
| GET    | `/api/auth/user`  | Get the current authenticated user |

### Events

| Method | Endpoint         | Description                   |
| ------ | ---------------- | ----------------------------- |
| GET    | `/api/events`    | Get all events                |
| GET    | `/api/events/:id`| Get a single event by ID      |
| POST   | `/api/events`    | Create a new event (admin only) |
| PUT    | `/api/events/:id`| Update an event (admin only)  |
| DELETE | `/api/events/:id`| Delete an event (admin only)  |

### Notifications

| Method | Endpoint                          | Description                        |
| ------ | --------------------------------- | ---------------------------------- |
| GET    | `/api/notifications`              | Get all notifications              |
| POST   | `/api/notifications`              | Create a new notification (admin only) |
| PUT    | `/api/notifications/:id/mark-sent`| Mark a notification as sent      |
| POST   | `/api/notifications/send-now`     | Send a notification immediately (admin only) |

### Resources (File Uploads)

| Method | Endpoint                         | Description                        |
| ------ | -------------------------------- | ---------------------------------- |
| GET    | `/api/events/:eventId/resources` | Get all resources for an event     |
| POST   | `/api/events/:eventId/resources` | Upload a resource for an event (admin only) |

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - email@example.com

Project Link: [https://github.com/your_username_/Project-Name](https://github.com/your_username_/Project-Name) 