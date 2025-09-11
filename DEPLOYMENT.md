# 恺瑞投流管理系统 - 生产环境部署指南

## 📋 系统要求

- **Node.js**: 16.x 或更高版本
- **操作系统**: Linux (推荐 Ubuntu 20.04+) / Windows Server / macOS
- **内存**: 最少 1GB RAM
- **存储**: 最少 2GB 可用空间
- **网络**: 需要访问外部 API (cloaking.house)

## 🚀 快速部署

### 方法一：使用部署脚本 (推荐)

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd flow-management-system

# 2. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 方法二：手动部署

```bash
# 1. 安装依赖
npm ci --only=production

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 构建应用
npm run build:production

# 4. 启动应用
npm start
```

### 方法三：Docker 部署

```bash
# 1. 构建镜像
docker build -t kairui-flow-management .

# 2. 使用 Docker Compose
docker-compose up -d
```

## ⚙️ 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置
DB_PATH=./database/flows.db

# JWT密钥 (生产环境必须修改)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 邀请码
INVITATION_CODE=kairui2024

# 第三方API配置
API_KEY=your_cloaking_api_key_here
CLOAKING_API_KEY=your_cloaking_api_key_here
CLOAKING_API_BASE_URL=https://cloaking.house/api

# 服务器配置
PORT=3001
NODE_ENV=production
```

## 🔧 Nginx 反向代理配置

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置 Nginx

将提供的 `nginx.conf` 配置复制到 `/etc/nginx/sites-available/kairui`：

```bash
sudo cp nginx.conf /etc/nginx/sites-available/kairui
sudo ln -s /etc/nginx/sites-available/kairui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL 证书配置

推荐使用 Let's Encrypt：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 进程管理 (PM2)

### 安装 PM2

```bash
npm install -g pm2
```

### 常用命令

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs kairui-flow-management

# 重启应用
pm2 restart kairui-flow-management

# 停止应用
pm2 stop kairui-flow-management

# 开机自启
pm2 startup
pm2 save
```

## 🗄️ 数据库管理

### 备份数据库

```bash
# 创建备份
cp database/flows.db database/flows_backup_$(date +%Y%m%d_%H%M%S).db

# 定期备份脚本
echo "0 2 * * * cp /path/to/your/app/database/flows.db /path/to/backup/flows_backup_\$(date +\%Y\%m\%d_\%H\%M\%S).db" | crontab -
```

### 恢复数据库

```bash
# 停止应用
pm2 stop kairui-flow-management

# 恢复数据库
cp database/flows_backup_YYYYMMDD_HHMMSS.db database/flows.db

# 重启应用
pm2 start kairui-flow-management
```

## 🔒 安全配置

### 1. 修改默认密码

首次部署后立即登录管理后台修改默认管理员密码：
- 用户名: `admin`
- 默认密码: `admin123`

### 2. 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. 系统更新

```bash
# 定期更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
sudo yum update -y                      # CentOS/RHEL
```

## 📈 监控和日志

### 应用日志

```bash
# PM2 日志
pm2 logs kairui-flow-management

# 应用日志文件
tail -f logs/combined.log
tail -f logs/err.log
tail -f logs/out.log
```

### 系统监控

```bash
# 查看系统资源
pm2 monit

# 查看进程状态
pm2 status

# 查看详细信息
pm2 show kairui-flow-management
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

2. **数据库权限问题**
   ```bash
   chmod 755 database/
   chmod 644 database/flows.db
   ```

3. **Node.js 版本问题**
   ```bash
   # 使用 nvm 管理 Node.js 版本
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

### 性能优化

1. **启用 Gzip 压缩** (Nginx)
2. **设置静态文件缓存**
3. **使用 CDN** (可选)
4. **数据库优化** (定期清理日志)

## 📞 技术支持

如遇到部署问题，请检查：
1. 系统要求是否满足
2. 环境变量是否正确配置
3. 网络连接是否正常
4. 日志文件中的错误信息

---

**注意**: 生产环境部署前请务必修改默认密码和 JWT 密钥！