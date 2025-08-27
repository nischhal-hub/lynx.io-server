import multer from "multer";

// Use memory storage to access the buffer
const storage = multer.memoryStorage();

// Middleware for profile picture uploads
export const singleUpload = multer({ storage }).single('profilePicture');
