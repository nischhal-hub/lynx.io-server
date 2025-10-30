import { Server, Socket } from 'socket.io';
import Notification from '../database/model/Notification.Model';
import User from '../database/model/user.Model';
import { sendExpoNotification } from '../utils/ExpoNotification';
import ActivityLog from '../database/model/RecentActiviity.Model';
import { sendFirebaseNotification } from '../utils/FirebaseNotification';
import asyncHandler from '../utils/AsyncHandler';
import { Request, Response } from 'express';

export default class SocketNotificationService {
  private static instance: SocketNotificationService;
  public io: Server;

  private constructor(io: Server) {
    this.io = io;
    this.initialize();
  }

  public static getInstance(io?: Server): SocketNotificationService {
    if (!SocketNotificationService.instance) {
      if (!io)
        throw new Error('Socket IO instance is required for initialization');
      SocketNotificationService.instance = new SocketNotificationService(io);
    }
    return SocketNotificationService.instance;
  }

  public static getNotifications = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req?.user?.id;
      const notifications = await Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json({ status: 'success', data: notifications });
    }
  );

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Notification client connected:', socket?.id);

      socket.on('joinUserRoom', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`joined user_${userId}`);
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

        // Save notification in DB
        const notification = await Notification.create({
          userId,
          title,
          message,
        });

        // Log activity
        if (notification) {
          await ActivityLog.create({
            userId,
            activityType: 'Notification',
            description: `Notification "${title}" sent to user ${userId}`,
          });
        }

        // Emit real-time socket notification
        this.io.to(`user_${userId}`).emit('notification:created', notification);

        // Send push notification via Expo
        const user = await User.findByPk(userId);
        if (user?.expoPushToken) {
          try {
            console.log('Sending Expo notification...');
            await sendExpoNotification(user.expoPushToken, title, message);
            await sendFirebaseNotification(user.expoPushToken, title, message);
          } catch (err) {
            console.log(
              'Push failed (likely Android standalone without FCM):',
              err
            );
          }
        }

        callback?.({ status: 'success', data: notification });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Read ----------------------
  private handleReadNotifications(socket: Socket) {
    socket.on('notification:readAll', async (userId: number, callback) => {
      console.log('hahahah', userId);
      const user = Number(userId);
      try {
        const notifications = await Notification.findAll({
          where: { userId: user },
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
          return callback?.({ status: 'error', message: 'Not found' });

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

  // ---------------------- Delete ----------------------
  private handleDeleteNotification(socket: Socket) {
    socket.on('notification:delete', async (id: number, callback) => {
      try {
        const notification = await Notification.findByPk(id);
        if (!notification)
          return callback?.({ status: 'error', message: 'Not found' });

        await notification.destroy();
        this.io
          .to(`user_${notification.userId}`)
          .emit('notification:deleted', { id });
        callback?.({ status: 'success' });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Public helper ----------------------
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

//  private handleDeleteNotification(socket: Socket) {
//     socket.on('notification:delete', async (id: number, callback) => {
//       try {
//         const notification = await Notification.findByPk(id);
//         if (!notification)
//           return callback?.({ status: 'error', message: 'Not found' });

//         await notification.destroy();
//         this.io
//           .to(`user_${notification.userId}`)
//           .emit('notification:deleted', { id });
//         callback?.({ status: 'success' });
//       } catch (error: any) {
//         callback?.({ status: 'error', message: error.message });
//       }
//     });
//   }
