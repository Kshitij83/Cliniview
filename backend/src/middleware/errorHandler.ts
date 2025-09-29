import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface ExtendedError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, any>;
}

const errorHandler = (
  err: ExtendedError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', err);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors: Record<string, string> = {};
    
    if (err instanceof mongoose.Error.ValidationError) {
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
    }
    
    return res.status(statusCode).json({
      message: 'Validation Error',
      errors
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already exists`;
    
    return res.status(statusCode).json({
      message,
      field
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }

  // Handle file upload errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: err.message
    });
  }

  // Handle general errors
  return res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

export default errorHandler;