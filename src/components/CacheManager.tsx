import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Trash2, BarChart3, 
  Clock, HardDrive, Zap, CheckCircle 
} from 'lucide-react';

interface CacheStats {
  memoryCache: {
    size: number;
    keys: string[];
  };
  fileCache: {
    files: string[];
  };
}

const CacheManager: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const response = await fetch('/api/cache/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCacheStats(data.data);
      }
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  const handleRefreshCache = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/cache/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessage('缓存刷新成功！');
        await loadCacheStats();
      } else {
        setMessage('缓存刷新失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('确定要清除所有缓存吗？这将导致下次请求时重新获取数据。')) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessage('缓存清除成功！');
        await loadCacheStats();
      } else {
        setMessage('缓存清除失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">缓存管理</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshCache}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>刷新缓存</span>
          </button>
          <button
            onClick={handleClearCache}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>清除缓存</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.includes('成功') 
            ? 'bg-green-50 border border-green-200 text-green-600' 
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 内存缓存 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h4 className="font-medium text-gray-900">内存缓存</h4>
              </div>
              <span className="text-sm text-gray-500">
                {cacheStats.memoryCache.size} 项
              </span>
            </div>
            <div className="space-y-2">
              {cacheStats.memoryCache.keys.length > 0 ? (
                cacheStats.memoryCache.keys.map((key, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{key}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">暂无缓存数据</p>
              )}
            </div>
          </div>

          {/* 文件缓存 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium text-gray-900">文件缓存</h4>
              </div>
              <span className="text-sm text-gray-500">
                {cacheStats.fileCache.files.length} 文件
              </span>
            </div>
            <div className="space-y-2">
              {cacheStats.fileCache.files.length > 0 ? (
                cacheStats.fileCache.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{file.replace('.json', '')}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">暂无缓存文件</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 缓存说明 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">缓存机制说明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>内存缓存</strong>：快速访问，重启后清空</li>
              <li>• <strong>文件缓存</strong>：持久存储，重启后保留</li>
              <li>• <strong>自动刷新</strong>：系统会自动更新即将过期的缓存</li>
              <li>• <strong>过期时间</strong>：国家(24h)、设备/浏览器(7天)、语言/时区(30天)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManager;