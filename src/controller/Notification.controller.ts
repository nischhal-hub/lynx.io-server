import Notification from '../database/model/Notification.Model';
import User from '../database/model/user.Model';
import { sendExpoNotification } from '../utils/ExpoNotifaction';

class ExpoNotificationService {
  public async createNotification(
    userId: number,
    title: string,
    message: string
  ) {
    const notification = await Notification.create({ userId, title, message });

    const user = await User.findByPk(userId);
    if (user?.expoPushToken) {
      await sendExpoNotification(user.expoPushToken, title, message, {
        notificationId: notification.id,
      });
    }

    return notification;
  }

  public async readAllNotifications(userId: number) {
    return Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async markAsRead(id: string) {
    const notification = await Notification.findByPk(id);
    if (!notification) throw new Error('Notification not found');

    notification.isRead = true;
    await notification.save();

    const user = await User.findByPk(notification.userId);
    if (user?.expoPushToken) {
      await sendExpoNotification(
        user.expoPushToken,
        'Notification Read',
        `Notification "${notification.title}" marked as read.`
      );
    }

    return notification;
  }

  public async deleteNotification(id: string) {
    const notification = await Notification.findByPk(id);
    if (!notification) throw new Error('Notification not found');

    await notification.destroy();

    const user = await User.findByPk(notification.userId);
    if (user?.expoPushToken) {
      await sendExpoNotification(
        user.expoPushToken,
        'Notification Deleted',
        `Notification "${notification.title}" was deleted.`
      );
    }

    return true;
  }
}

export default new ExpoNotificationService();
