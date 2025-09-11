import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, invitationCode } = req.body;

    // Validate invitation code
    if (invitationCode !== process.env.INVITATION_CODE) {
      return res.status(400).json({ 
        success: false, 
        message: '邀请码无效' 
      });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email], async (err, row) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '数据库错误' 
        });
      }

      if (row) {
        return res.status(400).json({ 
          success: false, 
          message: '用户名或邮箱已存在' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email], function(err) {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: '注册失败' 
          });
        }

        // Check if this context and lastID are available
        if (!this || typeof this.lastID === 'undefined') {
          return res.status(500).json({ 
            success: false, 
            message: '注册失败：无法获取用户ID' 
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: this.lastID, username },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          message: '注册成功',
          token,
          user: { id: this.lastID, username, email }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          message: '数据库错误' 
        });
      }

      if (!user) {
        console.log('User not found:', username);
        return res.status(400).json({ 
          success: false, 
          message: '用户名或密码错误' 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', username);
        return res.status(400).json({ 
          success: false, 
          message: '用户名或密码错误' 
        });
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', username);
      res.json({
        success: true,
        message: '登录成功',
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

// Verify token
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供token' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    db.get('SELECT id, username, email, role FROM users WHERE id = ?', 
      [decoded.userId], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ 
          success: false, 
          message: '无效token' 
        });
      }

      res.json({
        success: true,
        user
      });
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token验证失败' 
    });
  }
});

export default router;