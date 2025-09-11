import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

let db;

// 创建MySQL连接
const createConnection = async () => {
  try {
    console.log('🔄 正在连接到MySQL数据库...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'flow_management_db',
      charset: 'utf8mb4',
      timezone: '+00:00',
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true
    });

    console.log('✅ MySQL数据库连接成功');
    return connection;
  } catch (error) {
    console.error('❌ MySQL数据库连接失败:', error.message);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    db = await createConnection();
    
    console.log('🔄 开始初始化数据库表结构...');

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        role VARCHAR(50) DEFAULT 'admin',
        category_id INT DEFAULT 1,
        phone VARCHAR(20),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_category_id (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ users 表创建成功');

    // Create sessions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_token (token),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ sessions 表创建成功');

    // Create flows cache table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS flows_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flow_id INT UNIQUE NOT NULL,
        data TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_flow_id (flow_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ flows_cache 表创建成功');

    // Create account categories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS account_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT 'bg-blue-500',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ account_categories 表创建成功');

    // Create conversions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gclid VARCHAR(500) NOT NULL,
        conversion_name VARCHAR(255) NOT NULL,
        conversion_time DATETIME NOT NULL,
        stock_code VARCHAR(100) NOT NULL,
        user_agent TEXT,
        referrer_url TEXT,
        client_ip VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_gclid (gclid),
        INDEX idx_conversion_name (conversion_name),
        INDEX idx_conversion_time (conversion_time),
        INDEX idx_stock_code (stock_code),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ conversions 表创建成功');

    // Create API request logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS api_request_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(500) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INT NOT NULL,
        success TINYINT(1) NOT NULL,
        request_body LONGTEXT,
        response_body LONGTEXT,
        error_message TEXT,
        client_ip VARCHAR(45),
        user_agent TEXT,
        user_id INT,
        request_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        response_time INT,
        INDEX idx_endpoint (endpoint),
        INDEX idx_method (method),
        INDEX idx_status_code (status_code),
        INDEX idx_success (success),
        INDEX idx_user_id (user_id),
        INDEX idx_request_time (request_time),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ api_request_logs 表创建成功');

    // Create default categories if not exists
    const [categoryRows] = await db.execute('SELECT COUNT(*) as count FROM account_categories');
    if (categoryRows[0].count === 0) {
      console.log('🔄 创建默认账号分类...');
      const defaultCategories = [
        { name: '管理员', description: '系统管理员权限，拥有所有功能的访问权限', color: 'bg-red-500' },
        { name: '操作员', description: '流程操作权限，可以创建和管理流程', color: 'bg-blue-500' },
        { name: '观察者', description: '只读权限，只能查看数据和统计', color: 'bg-green-500' },
        { name: '客服', description: '客户服务权限，处理用户问题和反馈', color: 'bg-purple-500' }
      ];

      for (const category of defaultCategories) {
        await db.execute(
          'INSERT INTO account_categories (name, description, color) VALUES (?, ?, ?)',
          [category.name, category.description, category.color]
        );
        console.log(`✅ 创建分类: ${category.name}`);
      }
    }

    // Create default admin user if not exists
    const [userRows] = await db.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    if (userRows.length === 0) {
      console.log('🔄 创建默认管理员用户...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.execute(
        'INSERT INTO users (username, password, email, role, category_id) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@kairui.com', 'admin', 1]
      );
      
      console.log('✅ 默认管理员用户创建成功');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Email: admin@kairui.com');
    } else {
      console.log('✅ 管理员用户已存在，ID:', userRows[0].id);
    }

    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

// 获取数据库连接
const getConnection = () => {
  if (!db) {
    throw new Error('Database connection not initialized');
  }
  return db;
};

// 关闭数据库连接
const closeConnection = async () => {
  if (db) {
    await db.end();
    console.log('✅ MySQL数据库连接已关闭');
  }
};

export {
  db,
  initializeDatabase,
  getConnection,
  closeConnection
};