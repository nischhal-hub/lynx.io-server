import express from 'express';
import http from 'http';
import { envConfig } from './src/config/config';
import app from './src/app';
import SocketService from './src/Socket';
import SocketNotificationService from './src/controller/Notification.controller';

function startServer() {
  const port = envConfig.port || 5000;
  const host = '192.168.1.73';

  const server = http.createServer(app);

  // Initialize Socket.IO for locations
  const socketService = SocketService.initSocketService(server);

  // Initialize SocketNotificationService singleton
  SocketNotificationService.getInstance(socketService.io);

  server.listen({ port, host }, () => {
    console.log(`Server running at http://${host}:${port}`);
    console.log(`WebSocket running at ws://${host}:${port}`);
  });
}

startServer();
