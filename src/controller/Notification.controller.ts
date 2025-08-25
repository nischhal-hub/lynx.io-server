import { Server, Socket } from 'socket.io';
import Notification from '../database/model/Notification.Model';
import User from '../database/model/user.Model';
import { sendExpoNotification } from '../utils/ExpoNotification';

export default class SocketNotificationService {
  private static instance: SocketNotificationService;
  public io: Server;

  // Private constructor for singleton
  private constructor(io: Server) {
    this.io = io;
    this.initialize();
  }

  // Singleton access method
  public static getInstance(io?: Server): SocketNotificationService {
    if (!SocketNotificationService.instance) {
      if (!io)
        throw new Error('Socket IO instance is required for initialization');
      SocketNotificationService.instance = new SocketNotificationService(io);
    }
    return SocketNotificationService.instance;
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected for notifications:', socket.id);

      // Join user room
      socket.on('joinUserRoom', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`Client ${socket.id} joined user_${userId}`);
      });

      this.handleCreateNotification(socket);
      this.handleReadNotifications(socket);
      this.handleMarkAsRead(socket);
      this.handleDeleteNotification(socket);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // ---------------------- Create Notification ----------------------
  private handleCreateNotification(socket: Socket) {
    socket.on('notification:create', async (payload, callback) => {
      try {
        if (typeof payload === 'string') payload = JSON.parse(payload);
        const { userId, title, message } = payload;
        if (!userId || !title || !message)
          throw new Error('Missing required fields');

        const notification = await Notification.create({
          userId,
          title,
          message,
        });

        // Emit to user room
        this.io.to(`user_${userId}`).emit('notification:created', notification);

        // Send push if token exists
        const user = await User.findByPk(userId);
        if (user?.expoPushToken) {
          await sendExpoNotification(user.expoPushToken, title, message);
        }

        callback?.({ status: 'success', data: notification });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Read Notifications ----------------------
  private handleReadNotifications(socket: Socket) {
    socket.on('notification:readAll', async (userId: number, callback) => {
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

  // ---------------------- Mark as Read ----------------------
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

  // ---------------------- Delete Notification ----------------------
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

  // ---------------------- Public method to create notification from code ----------------------
  public async createNotification(
    userId: string,
    title: string,
    message: string
  ) {
    const notification = await Notification.create({ userId, title, message });
    this.io.to(`user_${userId}`).emit('notification:created', notification);

    const user = await User.findByPk(userId);
    if (user?.expoPushToken) {
      await sendExpoNotification(user.expoPushToken, title, message);
    }

    return notification;
  }
}
