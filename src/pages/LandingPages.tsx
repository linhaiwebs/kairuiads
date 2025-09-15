import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { formatDate } from '../utils/dateUtils';
import { 
  Search, Plus, Eye, Edit, Trash2, Download, RefreshCw, 
  Filter, Calendar, Globe, Code, Image, FileText,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface LandingPage {
  id: number;
  date: string;
  name: string;
  ui_image?: string;
  source_file?: string;
  download_file?: string;
  region: '美国' | '日本';
  tech_framework: 'python' | 'node' | 'html';
  created_at: string;
  updated_at: string;
}

const LandingPages: React.FC = () => {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // 时区状态
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Shanghai');

  const perPage = 10;

  useEffect(() => {
    loadLandingPages();
    
    // 监听时区变化事件
    const handleTimezoneChange = (event: CustomEvent) => {
      setUserTimezone(event.detail.timezone);
    };
    
    window.addEventListener('timezoneChanged', handleTimezoneChange as EventListener);
    
    // 初始化时区
    const savedTimezone = localStorage.getItem('user_timezone') || 'Asia/Shanghai';
    setUserTimezone(savedTimezone);
    
    return () => {
      window.removeEventListener('timezoneChanged', handleTimezoneChange as EventListener);
    };
  }, [currentPage, searchTerm, regionFilter, startDate, endDate]);

  const loadLandingPages = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(regionFilter && { region: regionFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await fetch(`/api/landing-pages?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setLandingPages(data.data);
        setTotalRecords(data.total);
        setTotalPages(data.total_pages);
      } else {
        setError(data.message || '获取落地页列表失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个落地页吗？相关文件也会被删除。')) {
      try {
        const response = await fetch(`/api/landing-pages/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setSuccess('落地页删除成功！');
          loadLandingPages();
        } else {
          setError(data.message || '删除失败');
        }
      } catch (err) {
        setError('删除失败，请重试');
      }
    }
  };

  const handleDownload = async (id: number, type: 'ui' | 'source' | 'download') => {
    try {
      setError('');
      setSuccess('');
      
      console.log(`开始下载文件: ID=${id}, type=${type}`);
      
      // 显示下载开始提示
      setSuccess('正在准备下载文件...');
      
      const blob = await apiService.downloadFileBlob(`/api/landing-pages/download/${id}/${type}`);
      console.log(`文件下载成功，Blob大小: ${blob.size} bytes`);
      
      // 获取文件名
      const landingPage = landingPages.find(lp => lp.id === id);
      let filename = `landing-page-${id}-${type}`;
      
      if (landingPage) {
        switch (type) {
          case 'ui':
            filename = landingPage.original_ui_image_name || landingPage.ui_image || `ui-image-${id}`;
            break;
          case 'source':
            filename = landingPage.original_source_file_name || landingPage.source_file || `source-file-${id}`;
            break;
          case 'download':
            filename = landingPage.original_download_file_name || landingPage.download_file || `download-file-${id}`;
            break;
        }
      }
      
      console.log(`使用文件名: ${filename}`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess(`文件下载成功: ${filename}`);
      console.log(`文件下载成功: ${filename}`);
    } catch (err) {
      console.error('下载失败:', err);
      setError(`下载失败: ${err.message || '网络错误，请重试'}`);
    }
  };

  const handlePreviewImage = async (id: number) => {
    setPreviewLoading(true);
    setError('');
    
    try {
      console.log(`开始预览图片: ID=${id}`);
      const blob = await apiService.downloadFileBlob(`/api/landing-pages/download/${id}/ui`);
      const imageUrl = window.URL.createObjectURL(blob);
      setPreviewImage(imageUrl);
      console.log('图片预览成功');
    } catch (err) {
      console.error('图片预览失败:', err);
      setError(`图片预览失败: ${err.message || '请重试'}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getRegionColor = (region: string) => {
    switch (region) {
      case '美国':
        return 'bg-blue-100 text-blue-800';
      case '日本':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTechFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'python':
        return 'bg-green-100 text-green-800';
      case 'node':
        return 'bg-yellow-100 text-yellow-800';
      case 'html':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">落地页管理</h1>
          <p className="text-gray-600 mt-1">管理和维护所有落地页资源</p>
        </div>
        <Link
          to="/admin/landing-pages/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>创建落地页</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">总落地页</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalRecords.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <Globe className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">美国地区</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {landingPages.filter(lp => lp.region === '美国').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <Globe className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">日本地区</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {landingPages.filter(lp => lp.region === '日本').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <Globe className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">技术框架</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Set(landingPages.map(lp => lp.tech_framework)).size}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <Code className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">筛选条件</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索落地页名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">所有地区</option>
              <option value="美国">美国</option>
              <option value="日本">日本</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="开始日期"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="结束日期"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={loadLandingPages}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isLoading ? '加载中...' : '刷新数据'}</span>
          </button>

          <button
            onClick={() => {
              setSearchTerm('');
              setRegionFilter('');
              setStartDate('');
              setEndDate('');
              setCurrentPage(1);
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Landing Pages Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">落地页列表</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                共 {totalRecords.toLocaleString()} 个落地页
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-500">加载落地页数据中...</span>
              </div>
            </div>
          ) : landingPages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>暂无落地页数据</p>
              <p className="text-sm mt-1">请创建新的落地页或调整筛选条件</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地区</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">技术框架</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UI图片</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">源文件</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下载文件</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {landingPages.map((landingPage) => (
                  <tr key={landingPage.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {landingPage.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(landingPage.date, userTimezone)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {landingPage.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRegionColor(landingPage.region)}`}>
                        {landingPage.region}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTechFrameworkColor(landingPage.tech_framework)}`}>
                        {landingPage.tech_framework}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {landingPage.ui_image ? (
                        <button
                          onClick={() => handlePreviewImage(landingPage.id)}
                          disabled={previewLoading}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="预览UI图片"
                        >
                          {previewLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          ) : (
                            <Image className="h-5 w-5" />
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">未上传</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {landingPage.source_file ? (
                        <button
                          onClick={() => handleDownload(landingPage.id, 'source')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                          title="下载源文件"
                        >
                          <Code className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">未上传</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {landingPage.download_file ? (
                        <button
                          onClick={() => handleDownload(landingPage.id, 'download')}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
                          title="下载文件"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">未上传</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(landingPage.created_at, userTimezone)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/landing-pages/edit/${landingPage.id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          title="编辑落地页"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(landingPage.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                          title="删除落地页"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                显示第 {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalRecords)} 条，共 {totalRecords.toLocaleString()} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一页
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-6xl w-full max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">UI图片预览</h3>
              <button
                onClick={() => {
                  if (previewImage) {
                    window.URL.revokeObjectURL(previewImage);
                  }
                  setPreviewImage(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* 可滚动的图片容器 */}
            <div className="flex-grow overflow-auto bg-gray-100 p-4">
              <div className="flex items-start justify-center min-h-full">
                <img
                  src={previewImage}
                  alt="UI预览"
                  className="max-w-none shadow-lg rounded-lg"
                  onError={() => {
                    setError('图片加载失败');
                    if (previewImage) {
                      window.URL.revokeObjectURL(previewImage);
                    }
                    setPreviewImage(null);
                  }}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center flex-shrink-0">
              <p className="text-sm text-gray-600">
                图片可滚动查看 • 点击右上角关闭按钮或点击背景区域关闭预览
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPages;