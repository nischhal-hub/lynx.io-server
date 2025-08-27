// import express from 'express';
// import expoService from '../controller/Notification.controller';
// import asyncHandler from '../utils/AsyncHandler';
// import User from '../database/model/user.Model';
// import protectedRoutes from '../middleware/protectedRoutes';

// const router = express.Router();

// // CREATE a new notification
// router.post('/', async (req, res, next) => {
//   try {
//     const { userId, title, message } = req.body;
//     const notification = await expoService.createNotification(
//       userId,
//       title,
//       message
//     );
//     res.status(201).json({ status: 'success', data: notification });
//   } catch (error) {
//     next(error);
//   }
// });

// // GET all notifications for a user
// router.get('/user/:userId', async (req, res, next) => {
//   try {
//     const userId = parseInt(req.params.userId);
//     const notifications = await expoService.readAllNotifications(userId);
//     res.status(200).json({
//       status: 'success',
//       results: notifications.length,
//       data: notifications,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // MARK a notification as read
// router.put('/:id/read', async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const notification = await expoService.markAsRead(id);
//     res.status(200).json({ status: 'success', data: notification });
//   } catch (error) {
//     next(error);
//   }
// });

// // DELETE a notification
// router.delete('/:id', async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     await expoService.deleteNotification(id);
//     res
//       .status(200)
//       .json({ status: 'success', message: 'Notification deleted' });
//   } catch (error) {
//     next(error);
//   }
// });

// router.post(
//   '/expo-token',
//   protectedRoutes.isUserLoggedIn,

//   asyncHandler(async (req, res) => {
//     console.log('hello');
//     const userId = req.user?.id;
//     const { expoPushToken } = req.body;

//     if (!expoPushToken)
//       return res.status(400).json({ message: 'Token required' });

//     const user = await User.findByPk(userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     user.expoPushToken = expoPushToken;
//     await user.save();

//     res.status(200).json({ status: 'success', message: 'Token saved' });
//   })
// );

// export default router;
