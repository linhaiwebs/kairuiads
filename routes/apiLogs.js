import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/logs - 获取API请求日志
router.get('/logs', authenticateToken, (req, res) => {
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
      whereClause += ' AND request_time >= datetime("now", "-7 days")';
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM api_request_logs ${whereClause}`;
    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        console.error('Error counting API logs:', err);
        return res.status(500).json({
          success: false,
          message: '获取日志总数失败'
        });
      }

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

      db.all(dataQuery, [...params, parseInt(per_page), offset], (err, rows) => {
        if (err) {
          console.error('Error fetching API logs:', err);
          return res.status(500).json({
            success: false,
            message: '获取API日志失败'
          });
        }

        res.json({
          success: true,
          data: rows,
          total: countResult.total,
          page: parseInt(page),
          per_page: parseInt(per_page),
          total_pages: Math.ceil(countResult.total / parseInt(per_page))
        });
      });
    });

  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/logs/stats - 获取API日志统计
router.get('/logs/stats', authenticateToken, (req, res) => {
  try {
    const queries = [
      // 总请求数
      'SELECT COUNT(*) as total FROM api_request_logs',
      // 今日请求数
      'SELECT COUNT(*) as today FROM api_request_logs WHERE DATE(request_time) = DATE("now")',
      // 成功请求数
      'SELECT COUNT(*) as success FROM api_request_logs WHERE success = 1',
      // 失败请求数
      'SELECT COUNT(*) as failed FROM api_request_logs WHERE success = 0',
      // 平均响应时间
      'SELECT AVG(response_time) as avg_response_time FROM api_request_logs WHERE response_time IS NOT NULL',
      // 最常用的端点
      'SELECT endpoint, COUNT(*) as count FROM api_request_logs GROUP BY endpoint ORDER BY count DESC LIMIT 5',
      // 错误统计
      'SELECT status_code, COUNT(*) as count FROM api_request_logs WHERE success = 0 GROUP BY status_code ORDER BY count DESC LIMIT 5'
    ];

    Promise.all(queries.map(query => {
      return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    })).then(results => {
      res.json({
        success: true,
        data: {
          total: results[0][0].total,
          today: results[1][0].today,
          success: results[2][0].success,
          failed: results[3][0].failed,
          avgResponseTime: Math.round(results[4][0].avg_response_time || 0),
          topEndpoints: results[5],
          errorStats: results[6]
        }
      });
    }).catch(error => {
      console.error('Error fetching API log stats:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    });

  } catch (error) {
    console.error('Error fetching API log stats:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// DELETE /api/logs/clear - 清除旧日志
router.delete('/logs/clear', authenticateToken, (req, res) => {
  try {
    const { days = 30 } = req.query;

    db.run(
      'DELETE FROM api_request_logs WHERE request_time < datetime("now", "-" || ? || " days")',
      [parseInt(days)],
      function(err) {
        if (err) {
          console.error('Error clearing old logs:', err);
          return res.status(500).json({
            success: false,
            message: '清除日志失败'
          });
        }

        res.json({
          success: true,
          message: `成功清除 ${this.changes} 条超过 ${days} 天的日志记录`
        });
      }
    );

  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;