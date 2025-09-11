import jwt from 'jsonwebtoken';
import { getConnection } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: '无效的访问令牌'
        });
      }

      try {
        // Verify user still exists in database
        const db = getConnection();
        const [users] = await db.execute(
          'SELECT id, username, role FROM users WHERE id = ?', 
          [decoded.userId]
        );

        if (users.length === 0) {
          return res.status(403).json({
            success: false,
            message: '用户不存在'
          });
        }

        req.user = users[0];
        next();
      } catch (dbError) {
        console.error('Database error in auth middleware:', dbError);
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};