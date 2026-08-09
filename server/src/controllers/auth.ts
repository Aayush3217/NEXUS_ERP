import { Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { LoginSchema } from '../validators/auth';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../middleware/error';
import { AuthenticatedRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_should_be_long_and_secure_key_12345';

export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validationResult = LoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return next(new BadRequestError('Validation failed', validationResult.error.errors));
    }

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new UnauthorizedError('Invalid email or password'));
    }

    if (!user.isActive) {
      return next(new UnauthorizedError('Account has been deactivated'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new UnauthorizedError('Invalid email or password'));
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    if (!user.isActive) {
      return next(new UnauthorizedError('Account has been deactivated'));
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
