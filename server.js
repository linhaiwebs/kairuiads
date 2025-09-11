import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('Starting server...');

// Set JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-secret-key-here-change-in-production';
  console.log('Using default JWT_SECRET');
}

// Check API key configuration
if (!process.env.API_KEY && !process.env.CLOAKING_API_KEY) {
  console.warn('⚠️  WARNING: API_KEY or CLOAKING_API_KEY not found in environment variables');
  console.warn('⚠️  Please set API_KEY=your_api_key_here in your .env file');
  console.warn('⚠️  Filter data endpoints will not work without a valid API key');
}

try {
  // Import routes
  const authRoutes = await import('./routes/auth.js');
  const adminRoutes = await import('./routes/admin.js');
  const apiRoutes = await import('./routes/api.js');
  const conversionsRoutes = await import('./routes/conversions.js');
  const apiLogsRoutes = await import('./routes/apiLogs.js');
  const { logApiRequest } = await import('./middleware/requestLogger.js');
  const { initializeDatabase } = await import('./config/database.js');

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Production optimizations
  if (process.env.NODE_ENV === 'production') {
    // Trust proxy for proper IP forwarding
    app.set('trust proxy', 1);
    
    // Security headers
    app.use((req, res, next) => {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    });
  }

  console.log('Initializing database...');
  // Initialize database
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (dbError) {
    console.warn('⚠️  数据库初始化警告:', dbError.message);
    console.log('✅ 继续启动服务器（使用内存数据库）...');
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'dist')));

  // Apply request logging middleware to ALL routes
  app.use(logApiRequest);

  // Routes
  app.use('/api/auth', authRoutes.default);
  app.use('/api/admin', adminRoutes.default);
  app.use('/api', apiRoutes.default);
  app.use('/api', conversionsRoutes.default);
  app.use('/api', apiLogsRoutes.default);

  // Debug: Log all registered routes
  console.log('📋 Registered API routes:');
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const basePath = middleware.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^', '');
          console.log(`  ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${basePath}${handler.route.path}`);
        }
      });
    }
  });

  // Catch-all route handler
  app.get('*', (req, res) => {
    // If it's an API request that wasn't handled by previous routes, return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other routes, serve the React SPA
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Admin dashboard: http://localhost:${PORT}/admin`);
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}