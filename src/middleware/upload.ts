import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (jpeg, jpg, png, gif, webp) are allowed.', 400, 'VALIDATION_ERROR'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const csvFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new AppError('Only CSV files are allowed.', 400, 'VALIDATION_ERROR'));
  }
};

export const uploadCSV = multer({
  storage,
  fileFilter: csvFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
