import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 开始数据库环境设置...');

// 数据库目录和文件路径
const dbDir = path.join(__dirname, 'database');
const dbPath = path.join(dbDir, 'flows.db');

try {
  // 1. 确保数据库目录存在
  if (!fs.existsSync(dbDir)) {
    console.log('📁 创建数据库目录...');
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 2. 删除可能存在的SQLite锁定文件
  const lockFiles = [
    path.join(dbDir, 'flows.db-wal'),
    path.join(dbDir, 'flows.db-shm'),
    path.join(dbDir, 'flows.db.lock')
  ];

  lockFiles.forEach(lockFile => {
    if (fs.existsSync(lockFile)) {
      try {
        fs.unlinkSync(lockFile);
        console.log(`🗑️  删除锁定文件: ${path.basename(lockFile)}`);
      } catch (err) {
        console.warn(`⚠️  无法删除锁定文件 ${path.basename(lockFile)}:`, err.message);
      }
    }
  });

  // 3. 设置数据库目录权限
  try {
    fs.chmodSync(dbDir, 0o755);
    console.log('🔐 设置数据库目录权限: 755');
  } catch (err) {
    console.warn('⚠️  设置目录权限失败:', err.message);
  }

  // 4. 如果数据库文件存在，设置文件权限
  if (fs.existsSync(dbPath)) {
    try {
      fs.chmodSync(dbPath, 0o644);
      console.log('🔐 设置数据库文件权限: 644');
    } catch (err) {
      console.warn('⚠️  设置文件权限失败:', err.message);
    }
  }

  console.log('✅ 数据库环境设置完成');

} catch (error) {
  console.error('❌ 数据库环境设置失败:', error);
  process.exit(1);
}