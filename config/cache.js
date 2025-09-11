
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
  // 自动刷新间隔（毫秒）
  AUTO_REFRESH_INTERVAL: 60 * 60 * 1000 // 1小时检查一次
};

// 内存缓存
const memoryCache = new Map();

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
  // 检查内存缓存
  if (memoryCache.has(key)) {
    const cacheData = memoryCache.get(key);
    if (!isCacheExpired(cacheData, key)) {
      console.log(`📋 Cache hit (memory): ${key}`);
      return cacheData.data;
    } else {
      memoryCache.delete(key);
    }
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
  
  console.log(`📋 Cache updated: ${key}`);
};

// 清除指定缓存
export const clearCache = (key) => {
  memoryCache.delete(key);
  console.log(`📋 Cache cleared: ${key}`);
};

// 清除所有缓存
export const clearAllCache = () => {
  memoryCache.clear();
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