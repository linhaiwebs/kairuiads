import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 转换记录文件管理器
class ConversionFileManager {
  constructor() {
    this.baseDir = path.join(__dirname, '../conver');
    this.ensureBaseDirectory();
  }

  // 确保基础目录存在
  ensureBaseDirectory() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      console.log('✅ Created conver directory:', this.baseDir);
    }
  }

  // 从URL中提取来源目录名称
  extractSourceFromUrl(referrerUrl) {
    if (!referrerUrl) return 'direct';
    
    try {
      const url = new URL(referrerUrl);
      let hostname = url.hostname;
      
      // 移除 www. 前缀
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      // 替换特殊字符为下划线，确保文件系统兼容
      return hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
    } catch (error) {
      console.error('Error parsing referrer URL:', error);
      return 'unknown';
    }
  }

  // 确保来源目录存在
  ensureSourceDirectory(sourceName) {
    const sourceDir = path.join(this.baseDir, sourceName);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
      console.log('✅ Created source directory:', sourceDir);
    }
    return sourceDir;
  }

  // 获取CSV文件路径
  getCsvFilePath(sourceName) {
    const sourceDir = this.ensureSourceDirectory(sourceName);
    return path.join(sourceDir, 'zhuanhuan.csv');
  }

  // 格式化转换记录为CSV行
  formatRecordToCsv(record) {
    const fields = [
      record.id || '',
      record.gclid || '',
      record.conversion_name || '',
      record.conversion_time || '',
      record.stock_code || '',
      record.user_agent || '',
      record.referrer_url || '',
      record.client_ip || '',
      record.created_at || ''
    ];

    // 处理包含逗号、引号或换行符的字段
    return fields.map(field => {
      const value = String(field);
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  }

  // 获取CSV头部
  getCsvHeader() {
    return 'id,gclid,conversion_name,conversion_time,stock_code,user_agent,referrer_url,client_ip,created_at';
  }

  // 添加新的转换记录到文件
  async addConversionRecord(record) {
    try {
      const sourceName = this.extractSourceFromUrl(record.referrer_url);
      const csvFilePath = this.getCsvFilePath(sourceName);
      
      console.log(`📝 Adding conversion record to: ${csvFilePath}`);
      
      // 检查文件是否存在，如果不存在则创建并添加头部
      let needsHeader = false;
      if (!fs.existsSync(csvFilePath)) {
        needsHeader = true;
      }

      // 准备CSV行数据
      const csvLine = this.formatRecordToCsv(record);
      
      // 写入文件
      if (needsHeader) {
        const content = this.getCsvHeader() + '\n' + csvLine + '\n';
        fs.writeFileSync(csvFilePath, content, 'utf8');
        console.log(`✅ Created new CSV file with header: ${csvFilePath}`);
      } else {
        fs.appendFileSync(csvFilePath, csvLine + '\n', 'utf8');
        console.log(`✅ Appended record to existing CSV file: ${csvFilePath}`);
      }

      return {
        success: true,
        sourceName,
        filePath: csvFilePath
      };
    } catch (error) {
      console.error('❌ Error adding conversion record to file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 重新生成所有CSV文件（用于初始化或修复）
  async regenerateAllCsvFiles(allRecords) {
    try {
      console.log('🔄 Regenerating all CSV files...');
      
      // 按来源分组记录
      const recordsBySource = {};
      
      allRecords.forEach(record => {
        const sourceName = this.extractSourceFromUrl(record.referrer_url);
        if (!recordsBySource[sourceName]) {
          recordsBySource[sourceName] = [];
        }
        recordsBySource[sourceName].push(record);
      });

      // 为每个来源创建CSV文件
      const results = [];
      for (const [sourceName, records] of Object.entries(recordsBySource)) {
        const csvFilePath = this.getCsvFilePath(sourceName);
        
        // 生成CSV内容
        let csvContent = this.getCsvHeader() + '\n';
        records.forEach(record => {
          csvContent += this.formatRecordToCsv(record) + '\n';
        });

        // 写入文件
        fs.writeFileSync(csvFilePath, csvContent, 'utf8');
        
        results.push({
          sourceName,
          filePath: csvFilePath,
          recordCount: records.length
        });
        
        console.log(`✅ Generated CSV for ${sourceName}: ${records.length} records`);
      }

      console.log('✅ All CSV files regenerated successfully');
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('❌ Error regenerating CSV files:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取所有来源目录列表
  getSourceDirectories() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        return [];
      }

      return fs.readdirSync(this.baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    } catch (error) {
      console.error('Error reading source directories:', error);
      return [];
    }
  }

  // 获取指定来源的CSV文件统计信息
  getSourceFileStats(sourceName) {
    try {
      const csvFilePath = this.getCsvFilePath(sourceName);
      if (!fs.existsSync(csvFilePath)) {
        return null;
      }

      const stats = fs.statSync(csvFilePath);
      const content = fs.readFileSync(csvFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const recordCount = Math.max(0, lines.length - 1); // 减去头部行

      return {
        sourceName,
        filePath: csvFilePath,
        fileSize: stats.size,
        recordCount,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error(`Error getting stats for ${sourceName}:`, error);
      return null;
    }
  }
}

// 创建单例实例
const conversionFileManager = new ConversionFileManager();

export default conversionFileManager;