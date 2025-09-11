import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 缓存配置
const CACHE_CONFIG = {
  // 缓存过期时间（毫秒）
  EXPIRY_TIME: {
    countries: 24 * 60 * 60 * 1000,      // 24小时
    devices: 7 * 24 * 60 * 60 * 1000,    // 7天
    operating_systems: 7 * 24 * 60 * 60 * 1000, // 7天
    browsers: 7 * 24 * 60 * 60 * 1000,   // 7天
    languages: 30 * 24 * 60 * 60 * 1000, // 30天
    time_zones: 30 * 24 * 60 * 60 * 1000, // 30天
    connection_types: 30 * 24 * 60 * 60 * 1000 // 30天
  },
  // 缓存文件路径
  CACHE_DIR: path.join(__dirname, '../cache'),
  // 自动刷新间隔（毫秒）
  AUTO_REFRESH_INTERVAL: 60 * 60 * 1000 // 1小时检查一次
};

// 确保缓存目录存在
if (!fs.existsSync(CACHE_CONFIG.CACHE_DIR)) {
  fs.mkdirSync(CACHE_CONFIG.CACHE_DIR, { recursive: true });
}

// 内存缓存
const memoryCache = new Map();

// 获取缓存文件路径
const getCacheFilePath = (key) => {
  return path.join(CACHE_CONFIG.CACHE_DIR, `${key}.json`);
};

// 从文件读取缓存
const readCacheFromFile = (key) => {
  try {
    const filePath = getCacheFilePath(key);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading cache file for ${key}:`, error);
  }
  return null;
};

// 写入缓存到文件
const writeCacheToFile = (key, data) => {
  try {
    const filePath = getCacheFilePath(key);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing cache file for ${key}:`, error);
  }
};

// 检查缓存是否过期
const isCacheExpired = (cacheData, key) => {
  if (!cacheData || !cacheData.timestamp) {
    return true;
  }
  
  const expiryTime = CACHE_CONFIG.EXPIRY_TIME[key] || 24 * 60 * 60 * 1000;
  const now = Date.now();
  return (now - cacheData.timestamp) > expiryTime;
};

// 获取缓存数据
export const getCache = (key) => {
  // 先检查内存缓存
  if (memoryCache.has(key)) {
    const cacheData = memoryCache.get(key);
    if (!isCacheExpired(cacheData, key)) {
      console.log(`📋 Cache hit (memory): ${key}`);
      return cacheData.data;
    } else {
      memoryCache.delete(key);
    }
  }
  
  // 检查文件缓存
  const fileCacheData = readCacheFromFile(key);
  if (fileCacheData && !isCacheExpired(fileCacheData, key)) {
    console.log(`📋 Cache hit (file): ${key}`);
    // 同时更新内存缓存
    memoryCache.set(key, fileCacheData);
    return fileCacheData.data;
  }
  
  console.log(`📋 Cache miss: ${key}`);
  return null;
};

// 设置缓存数据
export const setCache = (key, data) => {
  const cacheData = {
    data,
    timestamp: Date.now(),
    key
  };
  
  // 更新内存缓存
  memoryCache.set(key, cacheData);
  
  // 更新文件缓存
  writeCacheToFile(key, cacheData);
  
  console.log(`📋 Cache updated: ${key}`);
};

// 清除指定缓存
export const clearCache = (key) => {
  memoryCache.delete(key);
  
  try {
    const filePath = getCacheFilePath(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error clearing cache file for ${key}:`, error);
  }
  
  console.log(`📋 Cache cleared: ${key}`);
};

// 清除所有缓存
export const clearAllCache = () => {
  memoryCache.clear();
  
  try {
    if (fs.existsSync(CACHE_CONFIG.CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_CONFIG.CACHE_DIR);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(CACHE_CONFIG.CACHE_DIR, file));
        }
      });
    }
  } catch (error) {
    console.error('Error clearing all cache files:', error);
  }
  
  console.log('📋 All cache cleared');
};

// 获取缓存统计信息
export const getCacheStats = () => {
  const stats = {
    memoryCache: {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys())
    },
    fileCache: {
      files: []
    }
  };
  
  try {
    if (fs.existsSync(CACHE_CONFIG.CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_CONFIG.CACHE_DIR);
      stats.fileCache.files = files.filter(file => file.endsWith('.json'));
    }
  } catch (error) {
    console.error('Error reading cache directory:', error);
  }
  
  return stats;
};

// 预热缓存 - 在应用启动时调用
export const warmupCache = async (apiRequestFunction) => {
  console.log('📋 Starting cache warmup...');
  
  const cacheKeys = Object.keys(CACHE_CONFIG.EXPIRY_TIME);
  const endpoints = {
    countries: '/countries',
    devices: '/devices',
    operating_systems: '/operating_systems',
    browsers: '/browsers',
    languages: '/languages',
    time_zones: '/time_zones',
    connection_types: '/connection_types'
  };
  
  for (const key of cacheKeys) {
    try {
      // 检查是否已有有效缓存
      const cachedData = getCache(key);
      if (cachedData) {
        console.log(`📋 Cache already valid for: ${key}`);
        continue;
      }
      
      // 获取新数据
      console.log(`📋 Warming up cache for: ${key}`);
      const endpoint = endpoints[key];
      if (endpoint && apiRequestFunction) {
        const data = await apiRequestFunction(endpoint, {});
        if (data && data.data) {
          setCache(key, data.data);
        }
      }
    } catch (error) {
      console.error(`📋 Error warming up cache for ${key}:`, error);
    }
  }
  
  console.log('📋 Cache warmup completed');
};

// 自动刷新缓存
let autoRefreshTimer = null;

export const startAutoRefresh = (apiRequestFunction) => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  
  autoRefreshTimer = setInterval(async () => {
    console.log('📋 Starting automatic cache refresh...');
    
    const cacheKeys = Object.keys(CACHE_CONFIG.EXPIRY_TIME);
    const endpoints = {
      countries: '/countries',
      devices: '/devices',
      operating_systems: '/operating_systems',
      browsers: '/browsers',
      languages: '/languages',
      time_zones: '/time_zones',
      connection_types: '/connection_types'
    };
    
    for (const key of cacheKeys) {
      try {
        // 检查缓存是否即将过期（剩余时间少于1小时）
        const cacheData = memoryCache.get(key) || readCacheFromFile(key);
        if (cacheData) {
          const expiryTime = CACHE_CONFIG.EXPIRY_TIME[key];
          const timeLeft = expiryTime - (Date.now() - cacheData.timestamp);
          
          // 如果剩余时间少于1小时，则刷新缓存
          if (timeLeft < 60 * 60 * 1000) {
            console.log(`📋 Auto refreshing cache for: ${key}`);
            const endpoint = endpoints[key];
            if (endpoint && apiRequestFunction) {
              const data = await apiRequestFunction(endpoint, {});
              if (data && data.data) {
                setCache(key, data.data);
              }
            }
          }
        }
      } catch (error) {
        console.error(`📋 Error auto refreshing cache for ${key}:`, error);
      }
    }
  }, CACHE_CONFIG.AUTO_REFRESH_INTERVAL);
  
  console.log('📋 Auto refresh started');
};

export const stopAutoRefresh = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
    console.log('📋 Auto refresh stopped');
  }
};

export default {
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  getCacheStats,
  warmupCache,
  startAutoRefresh,
  stopAutoRefresh
};