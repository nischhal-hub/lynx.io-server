import { Server, Socket } from 'socket.io';
import Notification from '../database/model/Notification.Model';
import User from '../database/model/user.Model';
import { sendExpoNotification } from '../utils/ExpoNotification';
import ActivityLog from '../database/model/RecentActiviity.Model';

export default class SocketNotificationService {
  private static instance: SocketNotificationService;
  public io: Server;

  private constructor(io: Server) {
    this.io = io;
    this.initialize();
    console.log('[SocketNotificationService] Initialized.');
  }

  public static getInstance(io?: Server): SocketNotificationService {
    if (!SocketNotificationService.instance) {
      if (!io) throw new Error('Socket IO instance is required for initialization');
      SocketNotificationService.instance = new SocketNotificationService(io);
    }
    return SocketNotificationService.instance;
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log('[SocketNotificationService] Client connected:', socket.id);

      socket.on('joinUserRoom', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`[SocketNotificationService] User joined room: user_${userId}`);
      });

      this.handleCreateNotification(socket);
      this.handleReadNotifications(socket);
      this.handleMarkAsRead(socket);
      this.handleDeleteNotification(socket);
      this.handleMarkAllAsRead(socket);
      this.handleUpdateNotificationTitle(socket);

      socket.on('disconnect', () => {
        console.log('[SocketNotificationService] Client disconnected:', socket.id);
      });
    });
  }

  // ---------------------- Create Notification ----------------------
  private handleCreateNotification(socket: Socket) {
    socket.on('notification:create', async (payload, callback) => {
      try {
        if (typeof payload === 'string') payload = JSON.parse(payload);
        const { userId, title, message } = payload;
        if (!userId || !title || !message) throw new Error('Missing required fields');

        const notification = await Notification.create({ userId, title, message });

        if (notification) {
          await ActivityLog.create({
            userId,
            activityType: 'Notification',
            description: `Notification created: ${title} for user ${userId}`,
          });
        }

        this.io.to(`user_${userId}`).emit('notification:created', notification);

        const user = await User.findByPk(userId);
        if (user?.expoPushToken) {
          await sendExpoNotification(user.expoPushToken, title, message);
        }

        console.log(`[SocketNotificationService] Notification created for user ${userId}: ${title}`);
        callback?.({ status: 'success', data: notification });
      } catch (error: any) {
        console.error('[SocketNotificationService] Error creating notification:', error.message);
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
        console.log(`[SocketNotificationService] Retrieved notifications for user ${userId}`);
        callback?.({ status: 'success', data: notifications });
      } catch (error: any) {
        console.error('[SocketNotificationService] Error reading notifications:', error.message);
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Mark Notification as Read ----------------------
  private handleMarkAsRead(socket: Socket) {
    socket.on('notification:markAsRead', async (id: string, callback) => {
      try {
        const notification = await Notification.findByPk(id);
        if (!notification) return callback?.({ status: 'error', message: 'Not found' });

        notification.isRead = true;
        await notification.save();

        this.io.to(`user_${notification.userId}`).emit('notification:updated', notification);
        console.log(`[SocketNotificationService] Notification ${id} marked as read`);
        callback?.({ status: 'success', data: notification });
      } catch (error: any) {
        console.error('[SocketNotificationService] Error marking notification as read:', error.message);
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Delete Notification ----------------------
  private handleDeleteNotification(socket: Socket) {
    socket.on('notification:delete', async (id: number, callback) => {
      try {
        const notification = await Notification.findByPk(id);
        if (!notification) return callback?.({ status: 'error', message: 'Not found' });

        await notification.destroy();
        this.io.to(`user_${notification.userId}`).emit('notification:deleted', { id });
        console.log(`[SocketNotificationService] Notification ${id} deleted`);
        callback?.({ status: 'success' });
      } catch (error: any) {
        console.error('[SocketNotificationService] Error deleting notification:', error.message);
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Mark All Notifications as Read ----------------------
  private handleMarkAllAsRead(socket: Socket) {
    socket.on('notification:markAllAsRead', async (userId: number, callback) => {
      try {
        const notifications = await Notification.findAll({ where: { userId } });
        for (const notif of notifications) {
          notif.isRead = true;
          await notif.save();
        }
        this.io.to(`user_${userId}`).emit('notification:allRead');
        console.log(`[SocketNotificationService] All notifications marked as read for user ${userId}`);
        callback?.({ status: 'success' });
      } catch (error: any) {
        console.error('[SocketNotificationService] Error marking all notifications as read:', error.message);
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Update Notification Title ----------------------
  private handleUpdateNotificationTitle(socket: Socket) {
    socket.on('notification:updateTitle', async (payload, callback) => {
      try {
        const { id, newTitle } = payload;
        const notification = await Notification.findByPk(id);
        if (!notification) return callback?.({ status: 'error', message: 'Not found' });

        notification.title = newTitle;
        await notification.save();
        this.io.to(`user_${notification.userId}`).emit('notification:updated', notification);
        console.log(`[SocketNotificationService] Notification ${id} title updated to ${newTitle}`);
        callback?.({ status: 'success', data: notification });
      } catch (error: any) {
        console.error('[SocketNotificationService] Error updating notification title:', error.message);
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  // ---------------------- Public Helper to Create Notification ----------------------
  public async createNotification(userId: string, title: string, message: string) {
    const notification = await Notification.create({ userId, title, message });

    this.io.to(`user_${userId}`).emit('notification:created', notification);

    const user = await User.findByPk(userId);
    if (user?.expoPushToken) {
      await sendExpoNotification(user.expoPushToken, title, message);
    }

    console.log(`[SocketNotificationService] Notification created via helper for user ${userId}`);
    return notification;
  }

  // ---------------------- Dummy Helpers / Internal Logic ----------------------
  private async logNotificationActivity(userId: string, description: string) {
    await ActivityLog.create({ userId, activityType: 'Notification', description });
    console.log(`[SocketNotificationService] Logged activity for user ${userId}: ${description}`);
  }

  private async simulateBulkNotifications() {
    console.log('[SocketNotificationService] Simulating bulk notifications...');
    const users = await User.findAll({ limit: 5 });
    for (const user of users) {
      // await this.createNotification(user.id, 'System Update', 'This is a system-generated notification.');
    }
  }
}
