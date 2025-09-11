import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Get dashboard data
router.get('/dashboard', authenticateToken, (req, res) => {
  db.all('SELECT COUNT(*) as user_count FROM users', [], (err, userStats) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取仪表板数据失败'
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers: userStats[0]?.user_count || 0,
        totalFlows: 0, // Will be updated when flows are cached
        totalClicks: 0, // Placeholder
        activeFlows: 0  // Placeholder
      }
    });
  });
});

// Get user list
router.get('/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC', 
    [], (err, users) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取用户列表失败'
      });
    }

    res.json({
      success: true,
      data: users
    });
  });
});

// Get all accounts with categories
router.get('/accounts', authenticateToken, (req, res) => {
  const { page = 1, per_page = 10, search = '', status = '', category_id = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(per_page);
  
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
  
  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取账号总数失败'
      });
    }

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
    
    db.all(query, [...params, parseInt(per_page), offset], (err, accounts) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '获取账号列表失败'
        });
      }

      res.json({
        success: true,
        data: accounts,
        total: countResult.total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        total_pages: Math.ceil(countResult.total / parseInt(per_page))
      });
    });
  });
});

// Get account by ID
router.get('/accounts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      u.id, u.username, u.email, u.phone, u.status, u.notes,
      u.created_at, u.last_login, u.category_id,
      ac.name as category_name, ac.color as category_color
    FROM users u 
    LEFT JOIN account_categories ac ON u.category_id = ac.id 
    WHERE u.id = ?
  `;
  
  db.get(query, [id], (err, account) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取账号信息失败'
      });
    }
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      });
    }

    res.json({
      success: true,
      data: account
    });
  });
});

// Create new account
router.post('/accounts', authenticateToken, async (req, res) => {
  try {
    const { username, email, phone, password, category_id, status, notes } = req.body;

    // Validate required fields
    if (!username || !email || !password || !category_id) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱、密码和分类为必填项'
      });
    }

    // Check if username or email already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create account
      db.run(`
        INSERT INTO users (username, email, phone, password, category_id, status, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [username, email, phone, hashedPassword, category_id, status || 'active', notes], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '创建账号失败'
          });
        }

        res.json({
          success: true,
          message: '账号创建成功',
          data: { id: this.lastID }
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

// Update account
router.put('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, category_id, status, notes, changePassword, newPassword } = req.body;

    // Validate required fields
    if (!username || !email || !category_id) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和分类为必填项'
      });
    }

    // Check if username or email already exists (excluding current user)
    db.get('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', 
      [username, email, id], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }

      if (existingUser) {
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

      db.run(updateQuery, updateParams, function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '更新账号失败'
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: '账号不存在'
          });
        }

        res.json({
          success: true,
          message: '账号更新成功'
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

// Delete account
router.delete('/accounts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Prevent deleting the current user
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      success: false,
      message: '不能删除当前登录的账号'
    });
  }
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '删除账号失败'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      });
    }
    
    res.json({
      success: true,
      message: '账号删除成功'
    });
  });
});

// Get all categories
router.get('/categories', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      ac.*,
      COUNT(u.id) as account_count
    FROM account_categories ac
    LEFT JOIN users u ON ac.id = u.category_id
    GROUP BY ac.id
    ORDER BY ac.created_at DESC
  `;
  
  db.all(query, [], (err, categories) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '获取分类列表失败'
      });
    }

    res.json({
      success: true,
      data: categories
    });
  });
});

// Create new category
router.post('/categories', authenticateToken, (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: '分类名称不能为空'
    });
  }

  db.run('INSERT INTO account_categories (name, description, color) VALUES (?, ?, ?)',
    [name, description, color || 'bg-blue-500'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          success: false,
          message: '分类名称已存在'
        });
      }
      return res.status(500).json({
        success: false,
        message: '创建分类失败'
      });
    }

    res.json({
      success: true,
      message: '分类创建成功',
      data: { id: this.lastID }
    });
  });
});

// Update category
router.put('/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: '分类名称不能为空'
    });
  }

  db.run('UPDATE account_categories SET name = ?, description = ?, color = ? WHERE id = ?',
    [name, description, color, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          success: false,
          message: '分类名称已存在'
        });
      }
      return res.status(500).json({
        success: false,
        message: '更新分类失败'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    res.json({
      success: true,
      message: '分类更新成功'
    });
  });
});

// Delete category
router.delete('/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Check if category has accounts
  db.get('SELECT COUNT(*) as count FROM users WHERE category_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '检查分类使用情况失败'
      });
    }
    
    if (result.count > 0) {
      return res.status(400).json({
        success: false,
        message: `该分类下还有 ${result.count} 个账号，无法删除`
      });
    }
    
    db.run('DELETE FROM account_categories WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '删除分类失败'
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }
      
      res.json({
        success: true,
        message: '分类删除成功'
      });
    });
  });
});

export default router;