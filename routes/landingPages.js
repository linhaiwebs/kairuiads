import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    fieldSize: 500 * 1024 * 1024 // 500MB field size limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'ui_image') {
      // UI图片只允许图片格式
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('UI字段只能上传图片文件'));
      }
    } else if (file.fieldname === 'source_file') {
      // 源文件只允许PSD等媒体素材格式
      const allowedMimes = [
        'image/vnd.adobe.photoshop', // PSD
        'application/x-photoshop', // PSD
        'image/photoshop', // PSD
        'image/x-photoshop', // PSD
        'application/photoshop', // PSD
        'application/psd', // PSD
        'image/psd', // PSD
        'application/octet-stream', // 通用二进制文件
        'image/tiff', // TIFF
        'image/x-tiff', // TIFF
        'application/postscript', // AI
        'application/illustrator', // AI
        'image/svg+xml', // SVG
        'application/x-indesign', // INDD
        'application/x-sketch' // Sketch
      ];
      
      const allowedExtensions = ['.psd', '.ai', '.eps', '.tiff', '.tif', '.svg', '.indd', '.sketch', '.fig'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('源文件只支持PSD、AI、EPS、TIFF、SVG、INDD、Sketch、Figma等媒体素材格式'));
      }
    } else if (file.fieldname === 'download_file') {
      // 下载文件只允许压缩文件格式
      const allowedMimes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/gzip',
        'application/x-tar',
        'application/x-bzip2',
        'application/octet-stream'
      ];
      
      const allowedExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.tar.gz', '.tar.bz2'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('下载文件只支持ZIP、RAR、7Z、TAR、GZ等压缩文件格式'));
      }
    } else {
      cb(new Error('未知的文件字段'));
    }
  }
});

// GET /api/landing-pages - 获取落地页列表
router.get('/landing-pages', authenticateToken, async (req, res) => {
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
        original_ui_image_name, original_source_file_name, original_download_file_name,
        region, tech_framework, created_at, updated_at
      FROM landing_pages 
      ${whereClause}
      ORDER BY created_at DESC 
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
    console.error('Error fetching landing pages:', error);
    res.status(500).json({
      success: false,
      message: '获取落地页列表失败'
    });
  }
});

// GET /api/landing-pages/:id - 获取单个落地页详情
router.get('/landing-pages/:id', authenticateToken, async (req, res) => {
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
    console.error('Error fetching landing page:', error);
    res.status(500).json({
      success: false,
      message: '获取落地页详情失败'
    });
  }
});

// POST /api/landing-pages - 创建新落地页
router.post('/landing-pages', authenticateToken, upload.fields([
  { name: 'ui_image', maxCount: 1 },
  { name: 'source_file', maxCount: 1 },
  { name: 'download_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { date, name, region, tech_framework } = req.body;
    const files = req.files;
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

    // 处理文件路径
    const ui_image = files && files.ui_image ? files.ui_image[0].filename : null;
    const source_file = files && files.source_file ? files.source_file[0].filename : null;
    const download_file = files && files.download_file ? files.download_file[0].filename : null;
    
    // 处理原始文件名
    const original_ui_image_name = files && files.ui_image ? files.ui_image[0].originalname : null;
    const original_source_file_name = files && files.source_file ? files.source_file[0].originalname : null;
    const original_download_file_name = files && files.download_file ? files.download_file[0].originalname : null;

    // 插入数据
    const [result] = await db.execute(`
      INSERT INTO landing_pages (
        date, name, ui_image, source_file, download_file,
        original_ui_image_name, original_source_file_name, original_download_file_name,
        region, tech_framework
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [date, name, ui_image, source_file, download_file, original_ui_image_name, original_source_file_name, original_download_file_name, region, tech_framework]);

    res.json({
      success: true,
      message: '落地页创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error creating landing page:', error);
    res.status(500).json({
      success: false,
      message: '创建落地页失败'
    });
  }
});

// PUT /api/landing-pages/:id - 更新落地页
router.put('/landing-pages/:id', authenticateToken, upload.fields([
  { name: 'ui_image', maxCount: 1 },
  { name: 'source_file', maxCount: 1 },
  { name: 'download_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { date, name, region, tech_framework } = req.body;
    const files = req.files;
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

    // 处理文件更新
    let ui_image = currentRecord.ui_image;
    let source_file = currentRecord.source_file;
    let download_file = currentRecord.download_file;
    let original_ui_image_name = currentRecord.original_ui_image_name;
    let original_source_file_name = currentRecord.original_source_file_name;
    let original_download_file_name = currentRecord.original_download_file_name;

    if (files && files.ui_image) {
      // 删除旧文件
      if (currentRecord.ui_image) {
        const oldPath = path.join(__dirname, '../uploads', currentRecord.ui_image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      ui_image = files.ui_image[0].filename;
      original_ui_image_name = files.ui_image[0].originalname;
      original_ui_image_name = files.ui_image[0].originalname;
    }

    if (files && files.source_file) {
      // 删除旧文件
      if (currentRecord.source_file) {
        const oldPath = path.join(__dirname, '../uploads', currentRecord.source_file);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      source_file = files.source_file[0].filename;
      original_source_file_name = files.source_file[0].originalname;
      original_source_file_name = files.source_file[0].originalname;
    }

    if (files && files.download_file) {
      // 删除旧文件
      if (currentRecord.download_file) {
        const oldPath = path.join(__dirname, '../uploads', currentRecord.download_file);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      download_file = files.download_file[0].filename;
      original_download_file_name = files.download_file[0].originalname;
      original_download_file_name = files.download_file[0].originalname;
    }

    // 更新数据
    const [result] = await db.execute(`
      UPDATE landing_pages 
      SET date = ?, name = ?, ui_image = ?, source_file = ?, download_file = ?,
          original_ui_image_name = ?, original_source_file_name = ?, original_download_file_name = ?,
          region = ?, tech_framework = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [date, name, ui_image, source_file, download_file, original_ui_image_name, original_source_file_name, original_download_file_name, region, tech_framework, id]);

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
    console.error('Error updating landing page:', error);
    res.status(500).json({
      success: false,
      message: '更新落地页失败'
    });
  }
});

// DELETE /api/landing-pages/:id - 删除落地页
router.delete('/landing-pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();
    
    // 获取记录以删除关联文件
    const [rows] = await db.execute('SELECT * FROM landing_pages WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '落地页不存在'
      });
    }

    const record = rows[0];

    // 删除关联文件
    const filesToDelete = [record.ui_image, record.source_file, record.download_file].filter(Boolean);
    filesToDelete.forEach(filename => {
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // 删除数据库记录
    const [result] = await db.execute('DELETE FROM landing_pages WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '落地页删除成功'
    });

  } catch (error) {
    console.error('Error deleting landing page:', error);
    res.status(500).json({
      success: false,
      message: '删除落地页失败'
    });
  }
});

// GET /api/landing-pages/download/:id/:type - 下载文件
router.get('/landing-pages/download/:id/:type', authenticateToken, async (req, res) => {
  try {
    const { id, type } = req.params;
    const db = getConnection();
    
    const [rows] = await db.execute('SELECT * FROM landing_pages WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '落地页不存在'
      });
    }

    const record = rows[0];
    let filename;
    let originalName;

    switch (type) {
      case 'ui':
        filename = record.ui_image;
        originalName = record.original_ui_image_name || filename;
        break;
      case 'source':
        filename = record.source_file;
        originalName = record.original_source_file_name || filename;
        break;
      case 'download':
        filename = record.download_file;
        originalName = record.original_download_file_name || filename;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '无效的文件类型'
        });
    }

    if (!filename) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    const filePath = path.join(__dirname, '../uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.download(filePath, originalName);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: '下载文件失败'
    });
  }
});

export default router;