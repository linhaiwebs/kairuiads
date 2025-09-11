import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logConversionRequest } from '../middleware/requestLogger.js';

const router = express.Router();

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// Helper function to parse CSV line properly handling quoted fields
const detectDelimiter = (line) => {
  let commaCount = 0;
  let tabCount = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === ',') commaCount++;
      else if (char === '\t') tabCount++;
    }
  }

  return tabCount > commaCount ? '\t' : ',';
};

const parseCSVLine = (line, delimiter = ',') => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

// POST /api/ggads/conversions - 接收转化数据
router.post('/ggads/conversions', logConversionRequest, async (req, res) => {
  try {
    console.log(`[ConversionAPI] 🎯 Processing conversion request from IP: ${getClientIP(req)}`);
    console.log(`[ConversionAPI] 🎯 Request body:`, req.body);
    
    const {
      gclid,
      conversion_name,
      conversion_time,
      stock_code,
      user_agent,
      referrer_url
    } = req.body;

    // 验证必需字段
    if (!gclid || !conversion_name || !conversion_time || !stock_code) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: gclid, conversion_name, conversion_time, stock_code'
      });
    }

    // 验证转化时间格式
    const timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!timeRegex.test(conversion_time)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversion_time format. Expected ISO 8601 format.'
      });
    }

    const client_ip = getClientIP(req);
    const db = getConnection();

    // 插入数据到数据库
    const [result] = await db.execute(`
      INSERT INTO conversions (
        gclid, conversion_name, conversion_time, stock_code, 
        user_agent, referrer_url, client_ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      gclid,
      conversion_name,
      conversion_time,
      stock_code,
      user_agent || null,
      referrer_url || null,
      client_ip || null
    ]);

    console.log('Conversion data saved with ID:', result.insertId);
    res.status(200).json({
      status: 'success',
      message: 'Data received successfully.',
      id: result.insertId
    });

  } catch (error) {
    console.error(`[ConversionAPI] ❌ Error processing conversion request:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// GET /api/conversions - 获取转化数据列表
router.get('/conversions', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      per_page = 20,
      search = '',
      conversion_name = '',
      referrer_url = '',
      start_date = '',
      end_date = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const db = getConnection();
    
    let whereClause = 'WHERE 1=1';
    let params = [];

    // 搜索条件 (GCLID 或股票代码)
    if (search) {
      whereClause += ' AND (gclid LIKE ? OR stock_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 转化名称筛选
    if (conversion_name) {
      whereClause += ' AND conversion_name = ?';
      params.push(conversion_name);
    }

    // 落地页来源筛选
    if (referrer_url) {
      whereClause += ' AND referrer_url LIKE ?';
      params.push(`%${referrer_url}%`);
    }

    // 日期范围筛选
    if (start_date) {
      whereClause += ' AND DATE(conversion_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(conversion_time) <= ?';
      params.push(end_date);
    }

    // 如果没有指定日期范围，默认显示当天的记录
    if (!start_date && !end_date) {
      const today = new Date().toISOString().split('T')[0];
      whereClause += ' AND DATE(conversion_time) = ?';
      params.push(today);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM conversions ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);

    // 获取数据
    const dataQuery = `
      SELECT 
        id, gclid, conversion_name, conversion_time, stock_code,
        user_agent, referrer_url, client_ip, created_at
      FROM conversions 
      ${whereClause}
      ORDER BY conversion_time DESC 
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
    console.error('Error fetching conversions:', error);
    res.status(500).json({
      success: false,
      message: '获取转化数据失败'
    });
  }
});

// GET /api/conversions/export - 导出CSV
router.get('/conversions/export', authenticateToken, async (req, res) => {
  try {
    const {
      search = '',
      conversion_name = '',
      referrer_url = '',
      start_date = '',
      end_date = ''
    } = req.query;

    const db = getConnection();
    let whereClause = 'WHERE 1=1';
    let params = [];

    // 应用相同的筛选条件
    if (search) {
      whereClause += ' AND (gclid LIKE ? OR stock_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conversion_name) {
      whereClause += ' AND conversion_name = ?';
      params.push(conversion_name);
    }

    if (referrer_url) {
      whereClause += ' AND referrer_url LIKE ?';
      params.push(`%${referrer_url}%`);
    }

    if (start_date) {
      whereClause += ' AND DATE(conversion_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(conversion_time) <= ?';
      params.push(end_date);
    }

    // 如果没有指定日期范围，默认显示当天的记录
    if (!start_date && !end_date) {
      const today = new Date().toISOString().split('T')[0];
      whereClause += ' AND DATE(conversion_time) = ?';
      params.push(today);
    }

    const query = `
      SELECT 
        gclid, conversion_name, conversion_time, stock_code,
        user_agent, referrer_url, client_ip
      FROM conversions 
      ${whereClause}
      ORDER BY conversion_time DESC
    `;

    const [rows] = await db.execute(query, params);

    // 生成CSV内容
    const headers = ['gclid', 'conversion_name', 'conversion_time', 'stock_code', 'user_agent', 'referrer_url', 'client_ip'];
    let csvContent = headers.join(',') + '\n';

    rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });

    // 设置响应头
    const filename = `conversions_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting conversions:', error);
    res.status(500).json({
      success: false,
      message: '导出失败'
    });
  }
});

// POST /api/conversions/import - 导入CSV
router.post('/conversions/import', authenticateToken, async (req, res) => {
  try {
    const { csvData } = req.body;
    const db = getConnection();

    if (!csvData) {
      return res.status(400).json({
        success: false,
        message: 'CSV数据不能为空'
      });
    }

    // 解析CSV数据
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'CSV文件格式错误，至少需要包含标题行和一行数据'
      });
    }

    // 检测分隔符
    const delimiter = detectDelimiter(lines[0]);
    
    // 解析标题行
    const headers = parseCSVLine(lines[0], delimiter).map(h => h.replace(/^"|"$/g, ''));
    const requiredHeaders = ['gclid', 'conversion_name', 'conversion_time', 'stock_code'];
    
    // 验证必需的列是否存在
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必需的列: ${missingHeaders.join(', ')}`
      });
    }

    const dataRows = lines.slice(1);
    const validRows = [];
    const errors = [];

    // 验证每一行数据
    dataRows.forEach((line, index) => {
      const values = parseCSVLine(line, delimiter);
      
      if (values.length !== headers.length) {
        errors.push(`第${index + 2}行: 列数不匹配`);
        return;
      }

      const rowData = {};
      headers.forEach((header, i) => {
        let value = values[i] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        rowData[header] = value || null;
      });

      // 验证必需字段
      if (!rowData.gclid || !rowData.conversion_name || !rowData.conversion_time || !rowData.stock_code) {
        errors.push(`第${index + 2}行: 缺少必需字段`);
        return;
      }

      // 验证时间格式
      const timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (!timeRegex.test(rowData.conversion_time)) {
        errors.push(`第${index + 2}行: 转化时间格式错误`);
        return;
      }

      validRows.push(rowData);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: errors
      });
    }

    // 批量插入数据
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        await db.execute(`
          INSERT INTO conversions (
            gclid, conversion_name, conversion_time, stock_code,
            user_agent, referrer_url, client_ip
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          row.gclid,
          row.conversion_name,
          row.conversion_time,
          row.stock_code,
          row.user_agent,
          row.referrer_url,
          row.client_ip
        ]);
        successCount++;
      } catch (err) {
        console.error('Error inserting row:', err);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `导入完成: 成功${successCount}条，失败${errorCount}条`,
      imported: successCount,
      failed: errorCount
    });

  } catch (error) {
    console.error('Error importing conversions:', error);
    res.status(500).json({
      success: false,
      message: '导入失败'
    });
  }
});

// GET /api/conversions/stats - 获取统计信息
router.get('/conversions/stats', authenticateToken, async (req, res) => {
  try {
    const db = getConnection();

    const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM conversions');
    const [todayResult] = await db.execute('SELECT COUNT(*) as today FROM conversions WHERE DATE(conversion_time) = CURDATE()');
    const [conversionNames] = await db.execute('SELECT conversion_name, COUNT(*) as count FROM conversions GROUP BY conversion_name ORDER BY count DESC LIMIT 10');
    const [referrerUrls] = await db.execute('SELECT referrer_url, COUNT(*) as count FROM conversions WHERE referrer_url IS NOT NULL GROUP BY referrer_url ORDER BY count DESC LIMIT 10');

    res.json({
      success: true,
      data: {
        total: totalResult[0].total,
        today: todayResult[0].today,
        conversionNames: conversionNames,
        referrerUrls: referrerUrls
      }
    });

  } catch (error) {
    console.error('Error fetching conversion stats:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// DELETE /api/conversions/:id - 删除转化记录
router.delete('/conversions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();

    const [result] = await db.execute('DELETE FROM conversions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '转化记录不存在'
      });
    }

    res.json({
      success: true,
      message: '转化记录删除成功'
    });

  } catch (error) {
    console.error('Error deleting conversion:', error);
    res.status(500).json({
      success: false,
      message: '删除转化记录失败'
    });
  }
});

export default router;