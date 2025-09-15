# 恺瑞投流管理系统

专业的斗篷流量管理平台，助力您的业务增长。

## 新增命令

`npm run start:all`：同时启动前端开发服务器和后端API服务器。

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发环境
```bash
# 启动前端开发服务器
npm run dev

# 在另一个终端启动后端服务器
npm run start:server
```

### 构建生产版本
```bash
npm run build
```

## 访问地址

- 前端开发服务器: http://localhost:5173
- 后端API服务器: http://localhost:3001
- 管理后台: http://localhost:3001/admin
- 转换文件访问: http://localhost:3001/conver/{来源名称}/zhuanhuan.csv

## 默认登录信息

- 用户名: `admin`
- 密码: `admin123`

## 转换文件访问认证

- 用户名: `conver_user` (可通过 CONVER_USERNAME 环境变量修改)
- 密码: `conver_pass_2024` (可通过 CONVER_PASSWORD 环境变量修改)

## 环境变量

创建 `.env` 文件并配置：

```env
# MySQL/MariaDB 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=flow_user
DB_PASSWORD=your_secure_password
DB_NAME=flow_management_db

# JWT密钥
JWT_SECRET=your-secret-key-here

# 邀请码
INVITATION_CODE=kairui2024

# API配置
API_KEY=your_api_key_here
CLOAKING_API_KEY=your_api_key_here
CLOAKING_API_BASE_URL=https://cloaking.house/api

# 服务器端口
PORT=3001

# 转换文件访问认证
CONVER_USERNAME=conver_user
CONVER_PASSWORD=conver_pass_2024
```

## 数据库设置

### MySQL/MariaDB 安装和配置

1. **安装 MySQL 或 MariaDB**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server
   
   # CentOS/RHEL
   sudo yum install mysql-server
   
   # macOS (使用 Homebrew)
   brew install mysql
   
   # Windows: 下载并安装 MySQL Installer
   ```

2. **启动数据库服务**:
   ```bash
   # Linux
   sudo systemctl start mysql
   sudo systemctl enable mysql
   
   # macOS
   brew services start mysql
   ```

3. **创建数据库和用户**:
   ```sql
   -- 登录到 MySQL
   mysql -u root -p
   
   -- 创建数据库
   CREATE DATABASE flow_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- 创建用户并授权
   CREATE USER 'flow_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON flow_management_db.* TO 'flow_user'@'localhost';
   FLUSH PRIVILEGES;
   
   -- 退出
   EXIT;
   ```

4. **更新 .env 文件**:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=flow_user
   DB_PASSWORD=your_secure_password
   DB_NAME=flow_management_db
   ```

## 功能特性

- 🎯 流程管理 - 创建和管理斗篷流程
- 📊 统计分析 - 详细的数据分析和报告
- 🔍 点击追踪 - 实时点击数据监控
- 🛡️ 过滤系统 - 智能流量过滤
- 👥 账号管理 - 用户权限管理
- 📈 转化追踪 - Google Ads转化数据
- 📁 文件管理 - 自动生成按来源分类的CSV文件
- 🔐 文件保护 - 基本认证保护转换文件访问

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express
- **数据库**: MySQL/MariaDB
- **构建工具**: Vite