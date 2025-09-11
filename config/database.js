import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3Verbose = sqlite3.verbose();

// 在WebContainer环境中强制使用内存数据库
const isWebContainer = process.env.NODE_ENV === 'development' || !process.env.DB_PATH;
const dbPath = isWebContainer ? ':memory:' : (process.env.DB_PATH || path.join(process.cwd(), 'database', 'flows.db'));
const dbDir = path.dirname(dbPath);

let db;

// 创建数据库连接
const createDatabaseConnection = () => {
  return new Promise((resolve, reject) => {
    if (dbPath === ':memory:') {
      console.log('✅ 使用内存数据库（WebContainer环境）');
      const memoryDb = new sqlite3Verbose.Database(':memory:', (err) => {
        if (err) {
          console.error('❌ 无法创建内存数据库:', err);
          reject(err);
        } else {
          resolve(memoryDb);
        }
      });
    } else {
      // 尝试文件数据库
      const fileDb = new sqlite3Verbose.Database(dbPath, (err) => {
        if (err) {
          console.warn('⚠️  无法创建文件数据库，切换到内存数据库:', err.message);
          
          // 如果文件数据库失败，使用内存数据库
          const memoryDb = new sqlite3Verbose.Database(':memory:', (memErr) => {
            if (memErr) {
              console.error('❌ 无法创建内存数据库:', memErr);
              reject(memErr);
            } else {
              console.log('✅ 使用内存数据库连接');
              resolve(memoryDb);
            }
          });
        } else {
          console.log('✅ 使用文件数据库连接:', dbPath);
          resolve(fileDb);
        }
      });
    }
  });
};

// 确保数据库目录存在（仅在非内存数据库时）
if (dbPath !== ':memory:') {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created database directory:', dbDir);
    }
    
    // Remove any existing lock files
    const lockFiles = [dbPath + '.lock', dbPath + '-wal', dbPath + '-shm'];
    lockFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`Removed existing database file: ${path.basename(file)}`);
        } catch (err) {
          console.warn(`Could not remove file ${file}:`, err.message);
        }
      }
    });
    
    // Set directory permissions
    try {
      fs.chmodSync(dbDir, 0o755);
      console.log('Set database directory permissions: 755');
    } catch (err) {
      console.warn('Could not set directory permissions:', err.message);
    }
  } catch (err) {
    console.warn('Database directory setup failed, will use memory database:', err.message);
  }
}

// 初始化数据库连接
try {
  db = await createDatabaseConnection();
  
  // Configure database for better performance and reliability
  if (db) {
    db.configure('busyTimeout', 30000); // 30 second timeout
    
    // 只对文件数据库设置这些PRAGMA，内存数据库可能不支持
    if (dbPath !== ':memory:') {
      try {
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        db.run('PRAGMA cache_size = 1000');
        db.run('PRAGMA temp_store = MEMORY');
      } catch (err) {
        console.warn('Could not set PRAGMA settings:', err.message);
      }
    }
  }
} catch (err) {
  console.error('❌ 数据库连接失败:', err);
  // 作为最后的备选方案，创建一个内存数据库
  db = new sqlite3Verbose.Database(':memory:');
  console.log('✅ 使用内存数据库作为备选方案');
}

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error('❌ 数据库连接不存在');
      reject(new Error('Database connection not available'));
      return;
    }

    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `, (err) => {
        if (err) console.warn('Warning creating users table:', err.message);
      });

      // Create sessions table for tracking user sessions
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) console.warn('Warning creating sessions table:', err.message);
      });

      // Create flows cache table for better performance
      db.run(`
        CREATE TABLE IF NOT EXISTS flows_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          flow_id INTEGER UNIQUE NOT NULL,
          data TEXT NOT NULL,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.warn('Warning creating flows_cache table:', err.message);
      });

      // Create account categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS account_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          color TEXT DEFAULT 'bg-blue-500',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.warn('Warning creating account_categories table:', err.message);
      });

      // Create conversions table for Google Ads conversion tracking
      db.run(`
        CREATE TABLE IF NOT EXISTS conversions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          gclid TEXT NOT NULL,
          conversion_name TEXT NOT NULL,
          conversion_time TEXT NOT NULL,
          stock_code TEXT NOT NULL,
          user_agent TEXT,
          referrer_url TEXT,
          client_ip TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.warn('Warning creating conversions table:', err.message);
      });

      // Create API request logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS api_request_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          status_code INTEGER NOT NULL,
          success BOOLEAN NOT NULL,
          request_body TEXT,
          response_body TEXT,
          error_message TEXT,
          client_ip TEXT,
          user_agent TEXT,
          user_id INTEGER,
          request_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          response_time INTEGER,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) console.warn('Warning creating api_request_logs table:', err.message);
      });

      // Add columns to users table if not exists
      db.run(`
        ALTER TABLE users ADD COLUMN category_id INTEGER DEFAULT 1 REFERENCES account_categories(id)
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('Warning adding category_id column:', err.message);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN phone TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('Warning adding phone column:', err.message);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN notes TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('Warning adding notes column:', err.message);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('Warning adding status column:', err.message);
        }
      });

      // Create default categories if not exists
      db.get('SELECT COUNT(*) as count FROM account_categories', [], (err, row) => {
        if (err) {
          console.warn('Warning checking categories:', err.message);
          resolve();
          return;
        }

        if (row && row.count === 0) {
          console.log('Creating default account categories...');
          const defaultCategories = [
            { name: '管理员', description: '系统管理员权限，拥有所有功能的访问权限', color: 'bg-red-500' },
            { name: '操作员', description: '流程操作权限，可以创建和管理流程', color: 'bg-blue-500' },
            { name: '观察者', description: '只读权限，只能查看数据和统计', color: 'bg-green-500' },
            { name: '客服', description: '客户服务权限，处理用户问题和反馈', color: 'bg-purple-500' }
          ];

          let categoriesCreated = 0;
          defaultCategories.forEach((category, index) => {
            db.run('INSERT INTO account_categories (name, description, color) VALUES (?, ?, ?)',
              [category.name, category.description, category.color], function(err) {
              categoriesCreated++;
              if (err) {
                console.warn('Warning creating default category:', err.message);
              } else {
                console.log(`Created category: ${category.name}`);
              }
              
              if (categoriesCreated === defaultCategories.length) {
                createAdminUser();
              }
            });
          });
        } else {
          createAdminUser();
        }
      });

      function createAdminUser() {
        // Create default admin user if not exists
        db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
          if (err) {
            console.warn('Warning checking for admin user:', err.message);
            resolve();
            return;
          }

          if (!row) {
            console.log('Creating default admin user...');
            bcrypt.hash('admin123', 10, (hashErr, hashedPassword) => {
              if (hashErr) {
                console.warn('Warning hashing password for admin user:', hashErr.message);
                resolve();
                return;
              }
              
              db.run('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'admin@kairui.com', 'admin'], function(err) {
                if (err) {
                  console.warn('Warning creating default admin user:', err.message);
                } else {
                  console.log('✅ Default admin user created successfully');
                  console.log('Username: admin');
                  console.log('Password: admin123');
                  console.log('Email: admin@kairui.com');
                }
                resolve();
              });
            });
          } else {
            console.log('✅ Admin user already exists with ID:', row.id);
            resolve();
          }
        });
      }
    });
  });
};

export {
  db,
  initializeDatabase
};