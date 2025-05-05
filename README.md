# MERN Tours (Backend)

## Description

This is the backend repository for MERN Tours, the server-side application powering the tour booking platform. It is built using Node.js and Express.js, providing a robust and secure API to handle user authentication, tour data management, booking processes, payments, and email notifications.

## Features

- **User Authentication & Authorization:** Secure signup, login, and access control using a refresh token mechanism.
- **Email Verification:** Implemented for user signup to ensure valid email addresses.
- **Forget Password Functionality:** Secure process for users to reset their passwords via email.
- **Real-time Availability:** Provides up-to-date information on tour slot availability.
- **Tour Management API:** Endpoints for managing tour data (create, read, update, delete).
- **Booking System:** Handles tour bookings, including payment integration.
- **Booking Notifications:** Sends email confirmations for successful bookings and cancellations.
- **Secure Payment Processing:** Integrates with Stripe to handle payment transactions.
- **Database Indexing:** Optimized database performance through effective indexing strategies.
- **Session Management:** Uses Redis for efficient and scalable session storage.
- **Scheduled Tasks:** Utilizes node-cron for handling scheduled jobs (e.g., reminders, data cleanup).
- **Input Validation:** Ensures data integrity and security through comprehensive input validation using Zod.
- **Rate Limiting and Slow Down:** Protects against abuse and brute-force attacks.
- **Security Headers:** Implemented using Helmet for enhanced application security.

## Technologies Used

- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose (for interacting with MongoDB)
- **Authentication:**
  - bcrypt (for secure password hashing)
  - jsonwebtoken (for creating and verifying JWTs)
- **Session Storage:** Redis
- **Queueing/Task Scheduling:** @upstash/qstash, node-cron
- **Email Sending:** Nodemailer
- **Payment Processing:** Stripe
- **Validation:** Zod
- **Security:**
  - express-rate-limit
  - express-slow-down
  - helmet
  - eslint-plugin-security (for static analysis of security vulnerabilities)
- **Linting & Formatting:**
  - @typescript-eslint/eslint-plugin
  - eslint-plugin-node
  - Husky (for Git hooks)
  - lint-staged (for running linters on staged files)
- **Other:**
  - concurrently (for running multiple commands)
  - cookie-parser (for parsing cookies)
  - dotenv (for managing environment variables)
  - node-cache (for in-memory caching)
  - uuid (for generating unique IDs)
  - cors (for enabling Cross-Origin Resource Sharing)

## Architecture and Principles

The backend is structured following the **MVCS (Model-View-Controller-Service)** architecture pattern.

- **Models:** Define the data structure and interact with the MongoDB database using Mongoose.
- **Views:** (Less prominent in an API-only backend, but conceptually handles data presentation if rendering server-side or simply the response structure).
- **Controllers:** Handle incoming requests, interact with services, and send responses.
- **Services:** Contain the business logic and interact with models and external services (like email or payment gateways).

This architecture promotes separation of concerns, making the codebase more organized, testable, and maintainable.

The backend also adheres to **SOLID principles** where applicable to server-side development, contributing to a flexible and scalable system.

## Security

The backend is built with a strong emphasis on security, implementing measures to address critical vulnerabilities aligned with the **OWASP Top 10**. Key security practices include:

- **Input Validation and Sanitization:** Using Zod to validate and sanitize incoming data to prevent injection attacks.
- **Secure Authentication:** Implementing secure password hashing with bcrypt and using JWTs with a refresh token mechanism to manage user sessions and prevent unauthorized access.
- **Access Control:** Implementing robust access control checks on API endpoints to ensure users can only access resources they are authorized to.
- **Rate Limiting and Request Slow Down:** Protecting against brute-force attacks and denial-of-service by limiting and slowing down requests.
- **Security Headers:** Utilizing Helmet to set various HTTP headers that enhance application security.
- **Dependency Management:** Regularly updating dependencies to avoid known vulnerabilities.
- **Secure Configuration:** Managing sensitive information using environment variables and avoiding hardcoding secrets.
- **Error Handling:** Implementing proper error handling to avoid leaking sensitive information in responses.
- **Security Linting:** Using ESLint plugins like `eslint-plugin-security` to identify potential security issues during development.

## Installation and Usage

(Provide instructions on how to set up and run the backend project locally. This section will need to be filled in with specific steps for your backend's setup.)

```bash
# Clone the repository
git clone https://github.com/LinuxHari/MERN-tour-backend

# Navigate to the backend directory
cd mern-tours-backend # Or whatever your backend folder is named

# Install dependencies
npm install # Or yarn install

# Set up environment variables
# Create a .env file in the backend directory and add necessary environment variables (e.g., MongoDB connection string, JWT secret, Stripe keys, email credentials, Redis configuration)

# Run the development server
npm start # Or yarn start
```
