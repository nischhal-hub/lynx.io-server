import { Server, Socket } from 'socket.io';

class SocketService {
  public io: Server;
  public static instance: SocketService;

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      },
    });

    this.initializeConnection();
  }

  public static initSocketService(server: any): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService(server);
    }
    return SocketService.instance;
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      throw new Error('SocketService not initialized');
    }
    return SocketService.instance;
  }

  private initializeConnection() {
    this.io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);

      socket.on('joinLocationRoom', (locationId: string) => {
        socket.join(`location_${locationId}`);
        console.log(`Client ${socket.id} joined location_${locationId}`);
      });

      socket.on('joinUserLocationRoom', (userId: string) => {
        socket.join(`userlocation_${userId}`);
        console.log(`Client ${socket.id} joined userlocation_${userId}`);
      });

      socket.on('leaveRoom', (room: string) => {
        socket.leave(room);
        console.log(`Client ${socket.id} left room ${room}`);
      });

      socket.on('sendMessageToRoom', (room: string, message: any) => {
        this.io.to(room).emit('roomMessage', message);
        console.log(`Message sent to ${room}:`, message);
      });

      socket.on('broadcastMessage', (message: any) => {
        socket.broadcast.emit('broadcastMessage', message);
        console.log(`Broadcast message from ${socket.id}:`, message);
      });

      socket.on('error', (err: any) => {
        console.error(`Error from client ${socket.id}:`, err);
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });
    });
  }

  // Location Events
  public emitLocationCreated(location: any) {
    this.io.emit('location_created', location);
  }

  public emitLocationUpdated(location: any) {
    this.io.to(`location_${location.id}`).emit('location_updated', location);
  }

  public emitLocationDeleted(locationId: string) {
    this.io.emit('location_deleted', locationId);
  }

  // UserLocation Events
  public emitUserLocationCreated(userLocation: any) {
    this.io.emit('userlocation_created', userLocation);
  }

  public emitUserLocationUpdated(userLocation: any) {
    this.io
      .to(`userlocation_${userLocation.userId}`)
      .emit('userlocation_updated', userLocation);
  }

  public emitUserLocationDeleted(userLocationId: string) {
    this.io.emit('userlocation_deleted', userLocationId);
  }

  // Custom Emitters
  public emitToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  public broadcastExcept(socket: Socket, event: string, data: any) {
    socket.broadcast.emit(event, data);
  }

  public getConnectedClients(room?: string): string[] {
    if (room) {
      const clients = this.io.sockets.adapter.rooms.get(room);
      return clients ? Array.from(clients) : [];
    }
    return Array.from(this.io.sockets.sockets.keys());
  }

  public disconnectClient(socketId: string) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
      console.log(`Disconnected client ${socketId}`);
    }
  }
}

export default SocketService;
