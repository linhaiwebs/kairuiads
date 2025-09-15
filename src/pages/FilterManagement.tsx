import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { formatTimestamp } from '../utils/dateUtils';
import { 
  Search, Plus, Eye, Edit, Trash2, RotateCcw, 
  RefreshCw, Filter, Calendar, Shield, List,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface FilterItem {
  filter_id: number;
  name: string;
  list_type: string;
  status: string;
  date_created: string;
  time_created: number;
  total_ips: number;
  total_agents: number;
  total_providers: number;
  total_referers: number;
}

const FilterManagement: React.FC = () => {
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState('');
  const [dateRanges, setDateRanges] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 时区状态
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Shanghai');

  const perPage = 10;

  useEffect(() => {
    loadFilters();
    
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
  }, [currentPage, searchTerm, statusFilter, listTypeFilter, dateRanges]);

  const loadFilters = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiService.getFilters(
        currentPage, 
        perPage, 
        statusFilter, 
        listTypeFilter, 
        searchTerm, 
        dateRanges
      );
      
      if (response.success) {
        setFilters(response.data);
        setTotalRecords(response.total);
        setTotalPages(Math.ceil(response.total / perPage));
      } else {
        setError(response.message || '获取过滤器列表失败');
      }
    } catch (err: any) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFilter = async (filterId: number) => {
    if (confirm('确定要删除这个过滤器吗？')) {
      try {
        const response = await apiService.deleteFilter(filterId);
        if (response.success) {
          setSuccess('过滤器删除成功');
          loadFilters();
        } else {
          setError(response.message || '删除过滤器失败');
        }
      } catch (error) {
        setError('删除失败，请重试');
      }
    }
  };

  const handleRestoreFilter = async (filterId: number) => {
    try {
      const response = await apiService.restoreFilter(filterId);
      if (response.success) {
        setSuccess('过滤器恢复成功');
        loadFilters();
      } else {
        setError(response.message || '恢复过滤器失败');
      }
    } catch (error) {
      setError('恢复失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '活跃';
      case 'deleted':
        return '已删除';
      default:
        return status;
    }
  };

  const getListTypeColor = (listType: string) => {
    switch (listType.toLowerCase()) {
      case 'white':
        return 'bg-blue-100 text-blue-800';
      case 'black':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getListTypeText = (listType: string) => {
    switch (listType.toLowerCase()) {
      case 'white':
        return '白名单';
      case 'black':
        return '黑名单';
      default:
        return listType;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForAPI = (startDate: string, endDate: string) => {
    const formatSingle = (dateStr: string) => {
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
      }
      return dateStr;
    };

    if (startDate && endDate) {
      return `${formatSingle(startDate)} - ${formatSingle(endDate)}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">过滤器管理</h1>
          <p className="text-gray-600 mt-1">管理IP、User-Agent、ISP和Referer过滤列表</p>
        </div>
        <Link
          to="/admin/filters/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>创建过滤器</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">总过滤器</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalRecords.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <Filter className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">活跃过滤器</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filters.filter(f => f.status === 'active').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">白名单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filters.filter(f => f.list_type === 'white').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <List className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">黑名单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filters.filter(f => f.list_type === 'black').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <List className="h-6 w-6 text-white" />
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
              placeholder="搜索过滤器..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">所有状态</option>
              <option value="active">活跃</option>
              <option value="deleted">已删除</option>
            </select>
          </div>

          <div className="relative">
            <List className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={listTypeFilter}
              onChange={(e) => setListTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">所有类型</option>
              <option value="white">白名单</option>
              <option value="black">黑名单</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始日期
            </label>
            <input
              type="date"
              onChange={(e) => {
                const endDate = document.querySelector<HTMLInputElement>('input[type="date"]:nth-of-type(2)')?.value || '';
                const newDateRange = formatDateForAPI(e.target.value, endDate);
                setDateRanges(newDateRange);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束日期
            </label>
            <input
              type="date"
              onChange={(e) => {
                const startDate = document.querySelector<HTMLInputElement>('input[type="date"]:nth-of-type(1)')?.value || '';
                const newDateRange = formatDateForAPI(startDate, e.target.value);
                setDateRanges(newDateRange);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={loadFilters}
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
              setStatusFilter('');
              setListTypeFilter('');
              setDateRanges('');
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

      {/* Filters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">过滤器列表</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                共 {totalRecords.toLocaleString()} 个过滤器
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-500">加载过滤器数据中...</span>
              </div>
            </div>
          ) : filters.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>暂无过滤器数据</p>
              <p className="text-sm mt-1">请创建新的过滤器或调整筛选条件</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规则统计</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filters.map((filter) => (
                  <tr key={filter.filter_id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {filter.filter_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {filter.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getListTypeColor(filter.list_type)}`}>
                        {getListTypeText(filter.list_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(filter.status)}`}>
                        {getStatusText(filter.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatTimestamp(filter.time_created, userTimezone)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>IP: {filter.total_ips || 0}</div>
                        <div>UA: {filter.total_agents || 0}</div>
                        <div>ISP: {filter.total_providers || 0}</div>
                        <div>Ref: {filter.total_referers || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // 查看详情功能
                            alert(`查看过滤器 ${filter.filter_id} 详情功能待开发`);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/admin/filters/edit/${filter.filter_id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          title="编辑过滤器"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        {filter.status === 'active' ? (
                          <button
                            onClick={() => handleDeleteFilter(filter.filter_id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                            title="删除过滤器"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreFilter(filter.filter_id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                            title="恢复过滤器"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
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

export default FilterManagement;