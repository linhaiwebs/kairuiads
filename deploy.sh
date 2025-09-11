#!/bin/bash

# 恺瑞投流管理系统 - 生产环境部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署恺瑞投流管理系统..."

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
node_version=$(node -v)
echo "当前 Node.js 版本: $node_version"

if [[ ! "$node_version" =~ ^v1[6-9]\.|^v[2-9][0-9]\. ]]; then
    echo "❌ 需要 Node.js 16+ 版本"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，从示例文件创建..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件配置您的环境变量"
    echo "🔑 特别注意设置 JWT_SECRET 和 API_KEY"
fi

# 安装依赖
echo "📦 安装生产依赖..."
npm ci --only=production

# 构建前端
echo "🏗️  构建前端应用..."
npm run build:production

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p database logs

# 检查数据库
if [ ! -f "database/flows.db" ]; then
    echo "🗄️  初始化数据库..."
    NODE_ENV=production node -e "
        const { initializeDatabase } = require('./config/database.js');
        initializeDatabase();
        console.log('数据库初始化完成');
        process.exit(0);
    "
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 停止现有进程
echo "🛑 停止现有进程..."
pm2 stop kairui-flow-management 2>/dev/null || true

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save
pm2 startup

echo "✅ 部署完成！"
echo ""
echo "📊 应用状态:"
pm2 status

echo ""
echo "🌐 访问地址:"
echo "   本地: http://localhost:3001"
echo "   管理后台: http://localhost:3001/admin"
echo ""
echo "📝 默认管理员账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "📋 常用命令:"
echo "   查看日志: pm2 logs kairui-flow-management"
echo "   重启应用: pm2 restart kairui-flow-management"
echo "   停止应用: pm2 stop kairui-flow-management"
echo ""
echo "⚠️  生产环境注意事项:"
echo "   1. 修改默认管理员密码"
echo "   2. 设置强 JWT_SECRET"
echo "   3. 配置 HTTPS (推荐使用 Nginx)"
echo "   4. 定期备份数据库文件"