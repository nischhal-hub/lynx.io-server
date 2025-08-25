import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Create Expo SDK client
const expo = new Expo();

export async function sendExpoNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid Expo push token: ${pushToken}`);
    return;
  }

  const messages: ExpoPushMessage[] = [
    {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    },
  ];

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    console.log('Expo push response:', tickets);
  } catch (error) {
    console.error('Error sending Expo notification:', error);
  }
}
