import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customer';
import productRoutes from './routes/product';
import inventoryRoutes from './routes/inventory';
import challanRoutes from './routes/challan';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/user';
import { errorHandler, NotFoundError } from './middleware/error';

const app = express();

// Security Middlewares
app.use(helmet());

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: [clientUrl],
  credentials: true,
}));

// Body parser
app.use(express.json());

// Basic rate limiting on auth login endpoint
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// 404 Route Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`API route not found: ${req.method} ${req.originalUrl}`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
