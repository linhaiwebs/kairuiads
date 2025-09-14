import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Plus, Eye, Edit, Trash2, RefreshCw, Filter, 
  Calendar, Globe, Code, Image, Download, FileText,
  ChevronLeft, ChevronRight
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

const LandingPageManagement: React.FC = () => {
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

  const perPage = 10;

  useEffect(() => {
    loadLandingPages();
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
        setError(data.message || '获取落地页数据失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLandingPage = async (id: number) => {
    if (confirm('确定要删除这个落地页吗？相关文件也会被删除。')) {
      try {
        const response = await fetch(`/api/landing-pages/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('落地页删除成功！');
          loadLandingPages();
        } else {
          setError(data.message || '删除落地页失败');
        }
      } catch (error) {
        setError('删除失败，请重试');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleDownloadFile = (id: number, type: 'ui' | 'source' | 'download') => {
    const url = `/api/landing-pages/download/${id}/${type}`;
    window.open(url, '_blank');
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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

        <div className="flex items-center space-x-4 mt-4">
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UI预览</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地区</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">技术框架</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件</th>
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
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(landingPage.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {landingPage.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {landingPage.ui_image ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={`/uploads/${landingPage.ui_image}`}
                            alt="UI预览"
                            className="h-12 w-12 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => handleDownloadFile(landingPage.id, 'ui')}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                            title="下载UI图片"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">无图片</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRegionColor(landingPage.region)}`}>
                        <Globe className="h-3 w-3 mr-1" />
                        {landingPage.region}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTechFrameworkColor(landingPage.tech_framework)}`}>
                        <Code className="h-3 w-3 mr-1" />
                        {landingPage.tech_framework.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {landingPage.source_file && (
                          <button
                            onClick={() => handleDownloadFile(landingPage.id, 'source')}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                            title="下载源文件"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {landingPage.download_file && (
                          <button
                            onClick={() => handleDownloadFile(landingPage.id, 'download')}
                            className="p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                            title="下载文件"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        {!landingPage.source_file && !landingPage.download_file && (
                          <span className="text-gray-400 text-sm">无文件</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(landingPage.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/admin/landing-pages/edit/${landingPage.id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          title="编辑落地页"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteLandingPage(landingPage.id)}
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
    </div>
  );
};

export default LandingPageManagement;