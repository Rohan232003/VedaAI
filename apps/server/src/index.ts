import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { initializeQueue } from './config/queue';
import { setupWebSocket } from './ws/socketManager';
import { assignmentRouter } from './routes/assignments';
import { uploadRouter } from './routes/upload';
import path from 'path';

const app = express();
const server = http.createServer(app);

// Middleware — CORS with multiple origin support
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Automatically allow Vercel domains, localhost, or the exact FRONTEND_URL
    if (
      origin.startsWith('http://localhost') || 
      origin.includes('vercel.app') || 
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    
    console.warn(`[CORS] Rejected origin: ${origin}`);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/assignments', assignmentRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize services and start
const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    await connectRedis();
    console.log('✅ Redis connected');

    initializeQueue();
    console.log('✅ BullMQ queue initialized');

    setupWebSocket(server);
    console.log('✅ WebSocket server ready');

    server.listen(PORT, () => {
      console.log(`\n🚀 VedaAI Server running on http://localhost:${PORT}`);
      console.log(`   WebSocket on ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
