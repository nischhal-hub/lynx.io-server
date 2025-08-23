import express from 'express';
import http from 'http';
import { envConfig } from './src/config/config';
import app from './src/app';
import SocketService from './src/Socket';

function startServer() {
  const port = envConfig.port || 5000;
  const host = '192.168.1.73';

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO
  SocketService.initSocketService(server);

  server.listen({ port, host }, () => {
    console.log(`Server is running on http://${host}:${port}`);
    console.log(`WebSocket server is running on ws://${host}:${port}`);
  });
}

startServer();
