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

const app = express();
const PORT = process.env.PORT || 3001;

try {
  // Import database and middleware
  const { initializeDatabase, closeConnection } = await import('./config/database.js');
  const { logApiRequest } = await import('./middleware/requestLogger.js');

  // Initialize database
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (dbError) {
    console.error('❌ 数据库初始化失败:', dbError.message);
    console.error('请确保MySQL/MariaDB服务器正在运行，并且.env文件中的数据库配置正确');
    process.exit(1);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(path.join(__dirname, 'dist')));

  // Apply request logging middleware to ALL routes
  app.use(logApiRequest);

  // Import and register routes
  const landingPagesRoutes = await import('./routes/landingPages.js');
  const authRoutes = await import('./routes/auth.js');
  const adminRoutes = await import('./routes/admin.js');
  const apiRoutes = await import('./routes/api.js');
  const conversionsRoutes = await import('./routes/conversions.js');
  const apiLogsRoutes = await import('./routes/apiLogs.js');

  // Register routes in specific order
  app.use('/api', landingPagesRoutes.default);
  app.use('/api/auth', authRoutes.default);
  app.use('/api/admin', adminRoutes.default);
  app.use('/api', apiRoutes.default);
  app.use('/api', conversionsRoutes.default);
  app.use('/api', apiLogsRoutes.default);

  // Catch-all route handler
  app.get('*', (req, res) => {
    // If it's an API request that wasn't handled by previous routes, return 404
    if (req.path.startsWith('/api/')) {
      console.log('🔍 [Server] Unhandled API request:', req.method, req.path);
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other routes, serve the React SPA
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   - GET  /api/landing-pages`);
    console.log(`   - POST /api/landing-pages`);
    console.log(`   - GET  /api/landing-pages/:id`);
    console.log(`   - PUT  /api/landing-pages/:id`);
    console.log(`   - DELETE /api/landing-pages/:id`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔄 正在关闭服务器...');
    try {
      await closeConnection();
      console.log('✅ 服务器已安全关闭');
      process.exit(0);
    } catch (error) {
      console.error('❌ 关闭服务器时出错:', error);
      process.exit(1);
    }
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}