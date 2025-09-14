import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/landing-pages - 获取落地页列表
router.get('/landing-pages', authenticateToken, async (req, res) => {
  console.log('🔍 [LandingPages] GET /landing-pages called');
  try {
    const {
      page = 1,
      per_page = 10,
      search = '',
      region = '',
      start_date = '',
      end_date = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const db = getConnection();
    
    console.log('🔍 [LandingPages] Query params:', { page, per_page, search, region, start_date, end_date });
    
    let whereClause = 'WHERE 1=1';
    let params = [];

    // 搜索条件 (名称)
    if (search) {
      whereClause += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    // 地区筛选
    if (region) {
      whereClause += ' AND region = ?';
      params.push(region);
    }

    // 日期范围筛选
    if (start_date) {
      whereClause += ' AND DATE(date) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(date) <= ?';
      params.push(end_date);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM landing_pages ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);

    // 获取数据
    const dataQuery = `
      SELECT 
        id, date, name, ui_image, source_file, download_file,
        region, tech_framework, created_at, updated_at
      FROM landing_pages 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.execute(dataQuery, [...params, parseInt(per_page), offset]);

    console.log('🔍 [LandingPages] Found', rows.length, 'landing pages');
    
    res.json({
      success: true,
      data: rows,
      total: countResult[0].total,
      page: parseInt(page),
      per_page: parseInt(per_page),
      total_pages: Math.ceil(countResult[0].total / parseInt(per_page))
    });

  } catch (error) {
    console.error('🔍 [LandingPages] Error fetching landing pages:', error);
    res.status(500).json({
      success: false,
      message: '获取落地页列表失败'
    });
  }
});

// GET /api/landing-pages/:id - 获取单个落地页详情
router.get('/landing-pages/:id', authenticateToken, async (req, res) => {
  console.log('🔍 [LandingPages] GET /landing-pages/:id called for ID:', req.params.id);
  try {
    const { id } = req.params;
    const db = getConnection();
    
    const [rows] = await db.execute(
      'SELECT * FROM landing_pages WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '落地页不存在'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('🔍 [LandingPages] Error fetching landing page:', error);
    res.status(500).json({
      success: false,
      message: '获取落地页详情失败'
    });
  }
});

// POST /api/landing-pages - 创建新落地页
router.post('/landing-pages', authenticateToken, async (req, res) => {
  console.log('🔍 [LandingPages] POST /landing-pages called');
  console.log('🔍 [LandingPages] Request body:', req.body);
  try {
    const { date, name, region, tech_framework, ui_image, source_file, download_file } = req.body;
    const db = getConnection();

    // 验证必填字段
    if (!date || !name || !region || !tech_framework) {
      return res.status(400).json({
        success: false,
        message: '日期、名称、地区和技术框架为必填项'
      });
    }

    // 验证地区选项
    if (!['美国', '日本'].includes(region)) {
      return res.status(400).json({
        success: false,
        message: '地区只能选择美国或日本'
      });
    }

    // 验证技术框架选项
    if (!['python', 'node', 'html'].includes(tech_framework)) {
      return res.status(400).json({
        success: false,
        message: '技术框架只能选择python、node或html'
      });
    }

    // 插入数据
    const [result] = await db.execute(`
      INSERT INTO landing_pages (
        date, name, ui_image, source_file, download_file,
        region, tech_framework
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [date, name, ui_image, source_file, download_file, region, tech_framework]);

    res.json({
      success: true,
      message: '落地页创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('🔍 [LandingPages] Error creating landing page:', error);
    res.status(500).json({
      success: false,
      message: '创建落地页失败'
    });
  }
});

// PUT /api/landing-pages/:id - 更新落地页
router.put('/landing-pages/:id', authenticateToken, async (req, res) => {
  console.log('🔍 [LandingPages] PUT /landing-pages/:id called for ID:', req.params.id);
  try {
    const { id } = req.params;
    const { date, name, region, tech_framework, ui_image, source_file, download_file } = req.body;
    const db = getConnection();

    // 验证必填字段
    if (!date || !name || !region || !tech_framework) {
      return res.status(400).json({
        success: false,
        message: '日期、名称、地区和技术框架为必填项'
      });
    }

    // 验证地区选项
    if (!['美国', '日本'].includes(region)) {
      return res.status(400).json({
        success: false,
        message: '地区只能选择美国或日本'
      });
    }

    // 验证技术框架选项
    if (!['python', 'node', 'html'].includes(tech_framework)) {
      return res.status(400).json({
        success: false,
        message: '技术框架只能选择python、node或html'
      });
    }

    // 获取当前记录
    const [currentRows] = await db.execute('SELECT * FROM landing_pages WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '落地页不存在'
      });
    }

    const currentRecord = currentRows[0];

    // 使用新数据或保持原有数据
    const finalUiImage = ui_image || currentRecord.ui_image;
    const finalSourceFile = source_file || currentRecord.source_file;
    const finalDownloadFile = download_file || currentRecord.download_file;

    // 更新数据
    const [result] = await db.execute(`
      UPDATE landing_pages 
      SET date = ?, name = ?, ui_image = ?, source_file = ?, download_file = ?,
          region = ?, tech_framework = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [date, name, finalUiImage, finalSourceFile, finalDownloadFile, region, tech_framework, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '落地页不存在'
      });
    }

    res.json({
      success: true,
      message: '落地页更新成功'
    });

  } catch (error) {
    console.error('🔍 [LandingPages] Error updating landing page:', error);
    res.status(500).json({
      success: false,
      message: '更新落地页失败'
    });
  }
});

// DELETE /api/landing-pages/:id - 删除落地页
router.delete('/landing-pages/:id', authenticateToken, async (req, res) => {
  console.log('🔍 [LandingPages] DELETE /landing-pages/:id called for ID:', req.params.id);
  try {
    const { id } = req.params;
    const db = getConnection();
    
    // 删除数据库记录
    const [result] = await db.execute('DELETE FROM landing_pages WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '落地页不存在'
      });
    }
    
    res.json({
      success: true,
      message: '落地页删除成功'
    });

  } catch (error) {
    console.error('🔍 [LandingPages] Error deleting landing page:', error);
    res.status(500).json({
      success: false,
      message: '删除落地页失败'
    });
  }
});

// GET /api/landing-pages/download/:id/:type - 下载文件
router.get('/landing-pages/download/:id/:type', authenticateToken, async (req, res) => {
  console.log('🔍 [LandingPages] GET /landing-pages/download called for ID:', req.params.id, 'type:', req.params.type);
  try {
    const { id, type } = req.params;
    
    // 简化版本：返回文件信息而不是实际文件
    res.json({
      success: true,
      message: '文件下载功能暂未实现',
      data: { id, type }
    });

  } catch (error) {
    console.error('🔍 [LandingPages] Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: '下载文件失败'
    });
  }
});

export default router;