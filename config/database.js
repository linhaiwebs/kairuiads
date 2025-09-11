import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3Verbose = sqlite3.verbose();

const dbPath = process.env.DB_PATH || './database/flows.db';
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Remove any existing lock files
const lockFile = dbPath + '.lock';
if (fs.existsSync(lockFile)) {
  try {
    fs.unlinkSync(lockFile);
    console.log('Removed existing database lock file');
  } catch (err) {
    console.warn('Could not remove lock file:', err.message);
  }
}

// Also check for other potential lock files
const walFile = dbPath + '-wal';
const shmFile = dbPath + '-shm';
[walFile, shmFile].forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`Removed existing database file: ${file}`);
    } catch (err) {
      console.warn(`Could not remove file ${file}:`, err.message);
    }
  }
});

// Create database directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3Verbose.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connection established');
  }
});

// Configure database for better performance and reliability
db.configure('busyTimeout', 30000); // 30 second timeout
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA synchronous = NORMAL');
db.run('PRAGMA cache_size = 1000');
db.run('PRAGMA temp_store = MEMORY');

const initializeDatabase = () => {
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
    `);

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
    `);

    // Create flows cache table for better performance
    db.run(`
      CREATE TABLE IF NOT EXISTS flows_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flow_id INTEGER UNIQUE NOT NULL,
        data TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create account categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS account_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT DEFAULT 'bg-blue-500',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
    `);

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
    `);

    // Add columns to users table if not exists
    db.run(`
      ALTER TABLE users ADD COLUMN category_id INTEGER DEFAULT 1 REFERENCES account_categories(id)
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding category_id column:', err);
      }
    });

    db.run(`
      ALTER TABLE users ADD COLUMN phone TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding phone column:', err);
      }
    });

    db.run(`
      ALTER TABLE users ADD COLUMN notes TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding notes column:', err);
      }
    });

    db.run(`
      ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding status column:', err);
      }
    });

    // Create default categories if not exists
    db.get('SELECT COUNT(*) as count FROM account_categories', [], (err, row) => {
      if (err) {
        console.error('Error checking categories:', err);
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

        defaultCategories.forEach(category => {
          db.run('INSERT INTO account_categories (name, description, color) VALUES (?, ?, ?)',
            [category.name, category.description, category.color], function(err) {
            if (err) {
              console.error('Error creating default category:', err);
            } else if (this && this.lastID) {
              console.log(`Created category: ${category.name}`);
            }
          });
        });
      }
    });

    // Create default admin user if not exists
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (err) {
        console.error('Error checking for admin user:', err);
        return;
      }

      if (!row) {
        console.log('Creating default admin user...');
        bcrypt.hash('admin123', 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error('Error hashing password for admin user:', hashErr);
            return;
          }
          
          db.run('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
            ['admin', hashedPassword, 'admin@kairui.com', 'admin'], function(err) {
            if (err) {
              console.error('Error creating default admin user:', err);
            } else if (this && this.lastID) {
              console.log('Default admin user created successfully');
              console.log('Username: admin');
              console.log('Password: admin123');
              console.log('Email: admin@kairui.com');
              console.log('User ID:', this.lastID);
            } else {
              console.log('Default admin user created successfully (ID not available)');
            }
          });
        });
      } else {
        console.log('Admin user already exists with ID:', row.id);
      }
    });
    
    console.log('Database initialized successfully');
  });
};

export {
  db,
  initializeDatabase
};