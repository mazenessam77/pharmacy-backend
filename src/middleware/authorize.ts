import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../utils/constants';

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401, ERROR_CODES.AUTH_UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403, ERROR_CODES.FORBIDDEN)
      );
    }

    next();
  };
};
