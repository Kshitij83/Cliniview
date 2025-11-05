import multer from 'multer';
import path from 'path';

/**
 * Configure Multer disk storage for file uploads
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.FILE_UPLOAD_PATH || './uploads');
  },
  filename: function (req, file, cb) {
    // Create unique file name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

/**
 * File filter to validate allowed file types
 */
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, Word documents, text files and Excel files are allowed.'));
  }
};

/**
 * Configure upload file size limits
 */
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB by default
};

/**
 * Multer upload instance for file uploads
 */
const upload = multer({
  storage,
  fileFilter,
  limits
});

export default upload;