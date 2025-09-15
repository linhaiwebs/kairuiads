import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

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

const startServer = async () => {
  try {
    // Import routes
    const authRoutes = await import('./routes/auth.js');
    const adminRoutes = await import('./routes/admin.js');
    const apiRoutes = await import('./routes/api.js');
    const conversionsRoutes = await import('./routes/conversions.js');
    const apiLogsRoutes = await import('./routes/apiLogs.js');
    const landingPagesRoutes = await import('./routes/landingPages.js');
    const { logApiRequest } = await import('./middleware/requestLogger.js');
    const { initializeDatabase, closeConnection } = await import('./config/database.js');

    const app = express();
    const PORT = process.env.PORT || 3001;

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
    app.use(express.static(path.join(__dirname, 'dist')));

    // Apply request logging middleware to ALL routes
    app.use(logApiRequest);

    // 基本认证中间件用于保护 /conver 路径
    const basicAuth = (req, res, next) => {
      const auth = req.headers.authorization;
      
      if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Conversion Files"');
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const credentials = Buffer.from(auth.substring(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      
      // 简单的用户名密码验证
      const validUsername = process.env.CONVER_USERNAME || 'conver_user';
      const validPassword = process.env.CONVER_PASSWORD || 'conver_pass_2024';
      
      if (username === validUsername && password === validPassword) {
        next();
      } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Conversion Files"');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    };

    // 静态文件服务 - 保护 /conver 路径
    app.use('/conver', basicAuth, express.static(path.join(__dirname, 'conver'), {
      setHeaders: (res, filePath) => {
        // 设置CSV文件的正确MIME类型
        if (filePath.endsWith('.csv')) {
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'inline');
        }
      }
    }));

    // Routes - 落地页路由放在最前面
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
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // For all other routes, serve the React SPA
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log('📋 Available API endpoints:');
      console.log('  - POST /api/landing-pages (创建落地页)');
      console.log('  - GET /api/landing-pages (获取落地页列表)');
      console.log('  - GET /api/landing-pages/:id (获取落地页详情)');
      console.log('  - PUT /api/landing-pages/:id (更新落地页)');
      console.log('  - DELETE /api/landing-pages/:id (删除落地页)');
      console.log('  - GET /api/landing-pages/download/:id/:type (下载文件)');
      console.log('  - POST /api/ggads/conversions (接收转化数据)');
      console.log('  - GET /api/conversions (获取转化记录)');
      console.log('  - POST /api/conversions/regenerate-files (重新生成CSV文件)');
      console.log('  - GET /api/conversions/file-stats (获取文件统计)');
      console.log('📁 Protected file access:');
      console.log(`  - GET /conver/{source}/zhuanhuan.csv (需要认证)`);
      console.log(`  - 用户名: ${process.env.CONVER_USERNAME || 'conver_user'}`);
      console.log(`  - 密码: ${process.env.CONVER_PASSWORD || 'conver_pass_2024'}`);
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
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();