import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/api.js';
import authRoutes from './routes/authRoutes.js';
import { connectDatabase } from './config/db.js';
import { seedIfEmpty } from './scripts/seedDatabase.js';
import { ensureUserProfiles } from './scripts/ensureUserProfiles.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { startCronJobs } from './services/cronService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...configuredOrigins,
  "http://localhost:5173", 
  "http://localhost:3000",
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'WorkForge Backend Service is running!',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dataSource: 'MongoDB Atlas',
    swagger: `${BASE_URL}/api-docs`,
    timestamp: new Date(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRouter);

let swaggerSpec;
try {
  const mod = await import('./config/swagger.js');
  swaggerSpec = mod.default;
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'WorkForge API Docs',
  }));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
} catch (err) {
  console.warn('⚠️  Swagger setup skipped:', err.message);
}

const startServer = async () => {
  try {
    await connectDatabase();
    await seedIfEmpty();
    await ensureUserProfiles();

    // Start background cron jobs
    startCronJobs();

    const server = httpServer.listen(PORT, () => {
      console.log(`🚀 WorkForge Server running on port ${PORT}`);
      console.log(`📚 Swagger UI: ${BASE_URL}/api-docs`);
      console.log(`🔐 Auth API:  ${BASE_URL}/api/auth/login`);
      console.log(`📡 Socket.io: Enabled and listening for events`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the other process or change PORT in backend/.env`);
      } else {
        console.error('❌ Failed to start server:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();





