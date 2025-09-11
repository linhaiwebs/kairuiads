import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: '无效的访问令牌'
        });
      }

      // Verify user still exists in database
      db.get('SELECT id, username, role FROM users WHERE id = ?', 
        [decoded.userId], (dbErr, user) => {
        if (dbErr || !user) {
          return res.status(403).json({
            success: false,
            message: '用户不存在'
          });
        }

        req.user = user;
        next();
      });
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};