import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/logs - 获取API请求日志
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      per_page = 50,
      search = '',
      status = '',
      method = '',
      start_date = '',
      end_date = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const db = getConnection();
    
    let whereClause = 'WHERE 1=1';
    let params = [];

    // 搜索条件 (端点或错误信息)
    if (search) {
      whereClause += ' AND (endpoint LIKE ? OR error_message LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 状态筛选
    if (status === 'success') {
      whereClause += ' AND success = 1';
    } else if (status === 'error') {
      whereClause += ' AND success = 0';
    }

    // 请求方法筛选
    if (method) {
      whereClause += ' AND method = ?';
      params.push(method);
    }

    // 端点筛选
    if (req.query.endpoint) {
      whereClause += ' AND endpoint LIKE ?';
      params.push(`%${req.query.endpoint}%`);
    }

    // 日期范围筛选
    if (start_date) {
      whereClause += ' AND DATE(request_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(request_time) <= ?';
      params.push(end_date);
    }

    // 如果没有指定日期范围，默认显示最近7天的记录
    if (!start_date && !end_date) {
      whereClause += ' AND request_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM api_request_logs ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);

    // 获取数据
    const dataQuery = `
      SELECT 
        id, endpoint, method, status_code, success, 
        request_body, response_body, error_message,
        client_ip, user_agent, user_id, request_time, response_time
      FROM api_request_logs 
      ${whereClause}
      ORDER BY request_time DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.execute(dataQuery, [...params, parseInt(per_page), offset]);

    res.json({
      success: true,
      data: rows,
      total: countResult[0].total,
      page: parseInt(page),
      per_page: parseInt(per_page),
      total_pages: Math.ceil(countResult[0].total / parseInt(per_page))
    });

  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({
      success: false,
      message: '获取API日志失败'
    });
  }
});

// GET /api/logs/stats - 获取API日志统计
router.get('/logs/stats', authenticateToken, async (req, res) => {
  try {
    const db = getConnection();

    const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM api_request_logs');
    const [todayResult] = await db.execute('SELECT COUNT(*) as today FROM api_request_logs WHERE DATE(request_time) = CURDATE()');
    const [successResult] = await db.execute('SELECT COUNT(*) as success FROM api_request_logs WHERE success = 1');
    const [failedResult] = await db.execute('SELECT COUNT(*) as failed FROM api_request_logs WHERE success = 0');
    const [avgTimeResult] = await db.execute('SELECT AVG(response_time) as avg_response_time FROM api_request_logs WHERE response_time IS NOT NULL');
    const [topEndpoints] = await db.execute('SELECT endpoint, COUNT(*) as count FROM api_request_logs GROUP BY endpoint ORDER BY count DESC LIMIT 5');
    const [errorStats] = await db.execute('SELECT status_code, COUNT(*) as count FROM api_request_logs WHERE success = 0 GROUP BY status_code ORDER BY count DESC LIMIT 5');

    res.json({
      success: true,
      data: {
        total: totalResult[0].total,
        today: todayResult[0].today,
        success: successResult[0].success,
        failed: failedResult[0].failed,
        avgResponseTime: Math.round(avgTimeResult[0].avg_response_time || 0),
        topEndpoints: topEndpoints,
        errorStats: errorStats
      }
    });

  } catch (error) {
    console.error('Error fetching API log stats:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// DELETE /api/logs/clear - 清除旧日志
router.delete('/logs/clear', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const db = getConnection();

    const [result] = await db.execute(
      'DELETE FROM api_request_logs WHERE request_time < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [parseInt(days)]
    );

    res.json({
      success: true,
      message: `成功清除 ${result.affectedRows} 条超过 ${days} 天的日志记录`
    });

  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({
      success: false,
      message: '清除日志失败'
    });
  }
});

export default router;