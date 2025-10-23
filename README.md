Telemetry Ingestor App

# Description

A NestJS-based IoT telemetry ingestor that:

    - Accepts JSON readings from devices

    - Stores data in MongoDB (Atlas)

    - Caches latest readings in Redis

    - Sends alerts to a webhook when thresholds are exceeded

    - Provides simple analytics endpoints

# Telemetry Flow Diagram
flowchart LR
    Device[IoT Device] -->|JSON payload| API[Telemetry API (NestJS)]
    API -->|Save| MongoDB[(MongoDB Atlas)]
    API -->|Cache latest| Redis[(Redis)]
    API -->|Alert if threshold exceeded| Webhook[Webhook.site / Alerts]
    Client[Client / Dashboard] -->|Get latest| API
    Client -->|Get site summary| API

# Setup

Clone the repository:

git clone https://github.com/kalpanakanagasabai/Telemetry-Ingestor-App.git
cd telemetry-ingestor_App


# Install dependencies:

npm install


# Environment variables:
Create a .env file in the project root with:

REDIS_URL=redis://localhost:6379
ALERT_WEBHOOK_URL=https://webhook.site/<your-request-id>
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/telemetry?retryWrites=true&w=majority


# Run the app:

npm run start:dev


# Run tests:

npm run test
npm run test:e2e

# Webhook Testing

I used webhook.site
 for alerts.

webhook URL: https://webhook.site/cd983fbb-1b49-473f-bc1e-05d63cc80cc7

**Screenshot of received alerts is available in /docs/webhook.png.**


# MongoDB Atlas

Connected using MONGODB_URI in .env.
**Screenshot of Atlas connection note is available in /docs/Atlas_connection_note.PNG

# MongoDB Atlas Connection Note

- This service uses MongoDB Atlas as the database if MONGO_URI is set in .env.

- Make sure your Atlas cluster allows connections from your IP address (IP whitelist).

- The database and collection are automatically used based on your connection string. For example:

MONGO_URI=mongodb+srv://kalpana20210560_db_user:FyCKCBzUu8aktX4A@cluster1.hfi5wgi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

The telemetry data is stored in the Telemetry collection.

Ensure your credentials are correct and the cluster is running before starting the server.


# AI Assistance
- Assisted with Jest unit & E2E test structure.
- Consulted AI for TypeScript/NestJS type issues and dependency injection solutions, then reviewed and adapted the suggestions manually.
- Used AI to optimize code structure and testing strategies, with human oversight.
- Leveraged AI to draft DTO validation logic and service method structures, modifying them to meet project requirements.
- Recommended best practices and code improvements, such as Redis caching, threshold alerts, and DTO validation enhancements.
