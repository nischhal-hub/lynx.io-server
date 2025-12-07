# Lynx.io Backend

Backend service for Lynx.io - A comprehensive vehicle tracking and management system built with Express.js and TypeScript.

## Overview

Lynx.io backend provides RESTful APIs and real-time communication capabilities for vehicle tracking, geofencing, route management, and notifications. The system integrates with IoT devices via MQTT and provides real-time updates through WebSocket connections.

## Related Repositories

- **Client Application**: [https://github.com/nischhal-hub/lynx.io-client]
- **IoT Device Firmware**: [https://github.com/nischhal-hub/lynx.io-client]

## Features

- 🚗 **Vehicle Management** - Track and manage vehicle fleet
- 📍 **Real-time Location Tracking** - Live GPS tracking with MQTT integration
- 🗺️ **Geofencing** - Create and manage virtual boundaries with entry/exit alerts
- 🛣️ **Route Management** - Plan and monitor vehicle routes
- 📊 **Dashboard Analytics** - Comprehensive fleet insights and statistics
- 🔔 **Push Notifications** - Firebase and Expo push notification support
- 🔐 **Authentication & Authorization** - Secure JWT-based authentication
- 📡 **WebSocket Support** - Real-time bidirectional communication
- 📱 **IoT Device Integration** - MQTT-based device communication

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: TigerDB (Timeseries postgres db)
- **Real-time Communication**:
  - Socket.io (WebSocket)
  - MQTT (IoT devices)
- **Cloud Storage**: Cloudinary
- **Push Notifications**: Firebase Cloud Messaging, Expo Push Notifications
- **Authentication**: JWT

## Project Structure

```
src/
├── app.ts                 # Application entry point
├── mqttService.ts         # MQTT service for IoT communication
├── Socket.ts              # WebSocket configuration
├── config/                # Configuration files
├── controller/            # Request handlers
├── database/
│   ├── connection.ts      # Database connection setup
│   └── model/             # Database models
├── middleware/            # Custom middleware (auth, rate limiting, file upload)
├── routes/                # API route definitions
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions and utilities
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Database instance (TigerDB preferred)
- MQTT Broker (for IoT communication)
- Firebase project (for push notifications)
- Cloudinary account (for media storage)

### Installation

1. Clone the repository

```bash
git clone [repository-url]
cd lynx-backend
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

4. Set up your `.env` file with required credentials:

```env
PORT=3000
CONNECTION_STRING = DB connection string
JWT_SCERET=JWT_SECRET_KEY
EMAIL=
EMAIL_PASSWORD=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FRONTEND_URL=
EMAIL_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAIL_MAILER=
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME=
HOST=

```

5. Start the development server

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For issues and questions, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Built with Express.js and TypeScript
- Real-time communication powered by Socket.io and MQTT
- Push notifications via Firebase and Expo

### Made with 💌 by:

- [Nischhal Bohara](https://github.com/nischhal-hub)
- [Bishal Timilsina](https://github.com/bisha21)
- [Basanta Pokhrel](https://github.com/basanta740255)
