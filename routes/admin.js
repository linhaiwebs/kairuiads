import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth.js';
import { getConnection } from '../config/database.js';

const router = express.Router();

// Get dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const db = getConnection();
    
    const [userStats] = await db.execute('SELECT COUNT(*) as user_count FROM users');

    res.json({
      success: true,
      data: {
        totalUsers: userStats[0]?.user_count || 0,
        totalFlows: 0, // Will be updated when flows are cached
        totalClicks: 0, // Placeholder
        activeFlows: 0  // Placeholder
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: '获取仪表板数据失败'
    });
  }
});

// Get user list
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = getConnection();
    
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// Get all accounts with categories
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const { page = 1, per_page = 10, search = '', status = '', category_id = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const db = getConnection();
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereClause += ' AND u.status = ?';
      params.push(status);
    }
    
    if (category_id) {
      whereClause += ' AND u.category_id = ?';
      params.push(parseInt(category_id));
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN account_categories ac ON u.category_id = ac.id 
      ${whereClause}
    `;
    
    const [countResult] = await db.execute(countQuery, params);

    // Get accounts with pagination
    const query = `
      SELECT 
        u.id, u.username, u.email, u.phone, u.status, u.notes,
        u.created_at, u.last_login, u.category_id,
        ac.name as category_name, ac.color as category_color
      FROM users u 
      LEFT JOIN account_categories ac ON u.category_id = ac.id 
      ${whereClause}
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [accounts] = await db.execute(query, [...params, parseInt(per_page), offset]);

    res.json({
      success: true,
      data: accounts,
      total: countResult[0].total,
      page: parseInt(page),
      per_page: parseInt(per_page),
      total_pages: Math.ceil(countResult[0].total / parseInt(per_page))
    });

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      message: '获取账号列表失败'
    });
  }
});

// Get account by ID
router.get('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();
    
    const query = `
      SELECT 
        u.id, u.username, u.email, u.phone, u.status, u.notes,
        u.created_at, u.last_login, u.category_id,
        ac.name as category_name, ac.color as category_color
      FROM users u 
      LEFT JOIN account_categories ac ON u.category_id = ac.id 
      WHERE u.id = ?
    `;
    
    const [accounts] = await db.execute(query, [id]);
    
    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      });
    }

    res.json({
      success: true,
      data: accounts[0]
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      success: false,
      message: '获取账号信息失败'
    });
  }
});

// Create new account
router.post('/accounts', authenticateToken, async (req, res) => {
  try {
    const { username, email, phone, password, category_id, status, notes } = req.body;
    const db = getConnection();

    // Validate required fields
    if (!username || !email || !password || !category_id) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱、密码和分类为必填项'
      });
    }

    // Check if username or email already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account
    const [result] = await db.execute(`
      INSERT INTO users (username, email, phone, password, category_id, status, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [username, email, phone, hashedPassword, category_id, status || 'active', notes]);

    res.json({
      success: true,
      message: '账号创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({
      success: false,
      message: '创建账号失败'
    });
  }
});

// Update account
router.put('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, category_id, status, notes, changePassword, newPassword } = req.body;
    const db = getConnection();

    // Validate required fields
    if (!username || !email || !category_id) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和分类为必填项'
      });
    }

    // Check if username or email already exists (excluding current user)
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', 
      [username, email, id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已被其他账号使用'
      });
    }

    let updateQuery = `
      UPDATE users 
      SET username = ?, email = ?, phone = ?, category_id = ?, status = ?, notes = ?
    `;
    let updateParams = [username, email, phone, category_id, status, notes];

    // If password needs to be changed
    if (changePassword && newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    const [result] = await db.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      });
    }

    res.json({
      success: true,
      message: '账号更新成功'
    });

  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: '更新账号失败'
    });
  }
});

// Delete account
router.delete('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();
    
    // Prevent deleting the current user
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除当前登录的账号'
      });
    }
    
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      });
    }
    
    res.json({
      success: true,
      message: '账号删除成功'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: '删除账号失败'
    });
  }
});

// Get all categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const db = getConnection();
    
    const query = `
      SELECT 
        ac.*,
        COUNT(u.id) as account_count
      FROM account_categories ac
      LEFT JOIN users u ON ac.id = u.category_id
      GROUP BY ac.id
      ORDER BY ac.created_at DESC
    `;
    
    const [categories] = await db.execute(query);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

// Create new category
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const db = getConnection();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO account_categories (name, description, color) VALUES (?, ?, ?)',
      [name, description, color || 'bg-blue-500']
    );

    res.json({
      success: true,
      message: '分类创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在'
      });
    }
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

// Update category
router.put('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const db = getConnection();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    const [result] = await db.execute(
      'UPDATE account_categories SET name = ?, description = ?, color = ? WHERE id = ?',
      [name, description, color, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    res.json({
      success: true,
      message: '分类更新成功'
    });

  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在'
      });
    }
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
});

// Delete category
router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();
    
    // Check if category has accounts
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE category_id = ?', 
      [id]
    );
    
    if (result[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `该分类下还有 ${result[0].count} 个账号，无法删除`
      });
    }
    
    const [deleteResult] = await db.execute(
      'DELETE FROM account_categories WHERE id = ?', 
      [id]
    );
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }
    
    res.json({
      success: true,
      message: '分类删除成功'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败'
    });
  }
});

export default router;