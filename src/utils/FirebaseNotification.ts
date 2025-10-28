// src/utils/FirebaseNotification.ts
import admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}
// console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaa",serviceAccount)

interface NotificationData {
  [key: string]: string;
}

export async function sendFirebaseNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: NotificationData = {}
): Promise<string | void> {
  const message: admin.messaging.Message = {
    token: fcmToken,
    notification: { title, body },
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ FCM notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
  }
}
