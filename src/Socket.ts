import { Server } from 'socket.io';

class SocketService {
  public io: Server;
  public static instance: SocketService;

  public constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Adjust this for production
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
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('joinLocationRoom', (locationId: string) => {
        socket.join(`location_${locationId}`);
        console.log(`Client ${socket.id} joined location_${locationId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public emitLocationCreated(location: any) {
    this.io.emit('location_created', location);
  }

  public emitLocationUpdated(location: any) {
    this.io.to(`location_${location.id}`).emit('location_updated', location);
  }

  public emitLocationDeleted(locationId: string) {
    this.io.emit('location_deleted', locationId);
  }
}

export default SocketService;
