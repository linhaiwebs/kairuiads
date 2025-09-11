import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🚀 启动恺瑞投流管理系统...');

// Set JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-secret-key-here-change-in-production';
}

// Check API key configuration
if (!process.env.API_KEY && !process.env.CLOAKING_API_KEY) {
  console.warn('⚠️  WARNING: API_KEY or CLOAKING_API_KEY not found in environment variables');
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

  // Initialize database
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (dbError) {
    console.warn('⚠️ 数据库初始化警告:', dbError.message);
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
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}