import { Express } from 'express';

export const getDataUri = (file: Express.Multer.File) => {
  if (!file || !file.mimetype || !file.buffer) {
    throw new Error('Invalid file data');
  }

  // Extract file extension from MIME type
  const mimeTypeParts = file.mimetype.split('/');
  const extName = mimeTypeParts[1]; // e.g., "jpeg", "png"

  // Convert buffer to base64
  const fileBase64 = file.buffer.toString('base64');

  return {
    content: `data:${file.mimetype};base64,${fileBase64}`,
    extName,
  };
};
