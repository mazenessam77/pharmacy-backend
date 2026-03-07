import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../utils/constants';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Not authenticated. Please log in.', 401, ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('User not found.', 401, ERROR_CODES.USER_NOT_FOUND);
    }

    if (user.isBanned) {
      throw new AppError('Your account has been banned.', 403, ERROR_CODES.USER_BANNED);
    }

    if (!user.isActive) {
      throw new AppError('Your account is deactivated.', 403, ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401, ERROR_CODES.AUTH_INVALID_TOKEN));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired.', 401, ERROR_CODES.AUTH_TOKEN_EXPIRED));
    }
    next(error);
  }
};
