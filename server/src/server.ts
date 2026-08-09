import dotenv from 'dotenv';
// Load environment variables before importing app
dotenv.config();

import app from './app';
import { prisma } from './config/prisma';

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('Database is connected');
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
