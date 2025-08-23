import { Server, Socket } from 'socket.io';
import Notification from '../database/model/Notification.Model';

export default class SocketNotificationService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.initialize();
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected for notifications:', socket.id);

      // Join user room
      socket.on('joinUserRoom', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`Client ${socket.id} joined user_${userId}`);
      });

      // CRUD operations
      this.handleCreateNotification(socket);
      this.handleReadNotifications(socket);
      this.handleMarkAsRead(socket);
      this.handleDeleteNotification(socket);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private handleCreateNotification(socket: Socket) {
    console.log('handleCreateNotification');

    socket.on('notification:create', async (payload, callback) => {
      try {
        console.log('Received payload:', payload);
        console.log('Payload type:', typeof payload);

        // Parse string into object if needed
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }

        const { userId, title, message } = payload;

        if (
          userId === undefined ||
          title === undefined ||
          message === undefined
        ) {
          throw new Error('Missing required fields: userId, title, message');
        }

        const notification = await Notification.create({
          userId,
          title,
          message,
        });

        this.io.to(`user_${userId}`).emit('notification:created', notification);
        console.log(
          this.io
            .to(`user_${userId}`)
            .emit('notification:created', notification)
        );

        callback?.({ status: 'success', data: notification });
      } catch (error: any) {
        console.error('Notification creation error:', error);
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  private handleReadNotifications(socket: Socket) {
    socket.on('notification:readAll', async (userId: number, callback) => {
      console.log('notification:readAll', userId);
      try {
        const notifications = await Notification.findAll({
          where: { userId },
          order: [['createdAt', 'DESC']],
        });
        callback?.({ status: 'success', data: notifications });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  private handleMarkAsRead(socket: Socket) {
    socket.on('notification:markAsRead', async (id: string, callback) => {
      try {
        const notification = await Notification.findByPk(id);
        if (!notification)
          return callback?.({
            status: 'error',
            message: 'Notification not found',
          });

        notification.isRead = true;
        await notification.save();

        this.io
          .to(`user_${notification.userId}`)
          .emit('notification:updated', notification);

        callback?.({ status: 'success', data: notification });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  private handleDeleteNotification(socket: Socket) {
    socket.on('notification:delete', async (id: number, callback) => {
      try {
        const notification = await Notification.findByPk(id);
        if (!notification)
          return callback?.({
            status: 'error',
            message: 'Notification not found',
          });

        await notification.destroy();

        this.io
          .to(`user_${notification.userId}`)
          .emit('notification:deleted', { id });

        callback?.({ status: 'success', data: null });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }
}
