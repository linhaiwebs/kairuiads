import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, RefreshCw, Trash2, 
  Activity, Clock, Globe, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, Server, Database,
  TrendingUp, TrendingDown, Zap, Eye
} from 'lucide-react';

interface ApiLog {
  id: number;
  endpoint: string;
  method: string;
  status_code: number;
  success: boolean;
  request_body?: string;
  response_body?: string;
  error_message?: string;
  client_ip?: string;
  user_agent?: string;
  user_id?: number;
  request_time: string;
  response_time?: number;
}

interface ApiLogStats {
  total: number;
  today: number;
  success: number;
  failed: number;
  avgResponseTime: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  errorStats: Array<{ status_code: number; count: number }>;
}

const ApiRequestLogs: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [stats, setStats] = useState<ApiLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage] = useState(50);
  const [error, setError] = useState('');
  const [success, setSuccessMessage] = useState('');

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endpointFilter, setEndpointFilter] = useState('');

  // 详情查看状态
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  // 端点选项
  const endpointOptions = [
    { value: '', label: '所有端点' },
    { value: '/api/flows', label: '流程列表 - 获取所有流程' },
    { value: '/api/flows/create', label: '创建流程 - 新建流程配置' },
    { value: '/api/flows/update', label: '更新流程 - 修改流程设置' },
    { value: '/api/flows/details', label: '流程详情 - 获取单个流程信息' },
    { value: '/api/statistics', label: '统计数据 - 获取分析报告' },
    { value: '/api/clicks', label: '点击数据 - 获取点击记录' },
    { value: '/api/countries', label: '国家数据 - 获取国家列表' },
    { value: '/api/devices', label: '设备数据 - 获取设备类型' },
    { value: '/api/operating_systems', label: '系统数据 - 获取操作系统' },
    { value: '/api/browsers', label: '浏览器数据 - 获取浏览器列表' },
    { value: '/api/languages', label: '语言数据 - 获取语言列表' },
    { value: '/api/time_zones', label: '时区数据 - 获取时区信息' },
    { value: '/api/connection_types', label: '连接类型 - 获取网络连接类型' },
    { value: '/api/filters', label: '过滤器列表 - 获取过滤规则' },
    { value: '/api/filters/create', label: '创建过滤器 - 新建过滤规则' },
    { value: '/api/filters/update', label: '更新过滤器 - 修改过滤规则' },
    { value: '/api/filters/details', label: '过滤器详情 - 获取过滤器信息' },
    { value: '/api/conversions', label: '转化记录 - 获取转化数据' },
    { value: '/api/ggads/conversions', label: 'Google Ads转化 - 接收转化数据' },
    { value: '/api/admin/dashboard', label: '仪表板数据 - 获取概览统计' },
    { value: '/api/admin/accounts', label: '账号管理 - 用户账号操作' },
    { value: '/api/admin/categories', label: '分类管理 - 账号分类操作' },
    { value: '/api/auth/login', label: '用户登录 - 身份验证' },
    { value: '/api/auth/register', label: '用户注册 - 创建新账号' },
    { value: '/api/auth/verify', label: '令牌验证 - 验证登录状态' },
    { value: '/api/logs', label: 'API日志 - 获取请求日志' },
    { value: '/api/cache', label: '缓存管理 - 缓存操作' }
  ];

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [currentPage, searchTerm, statusFilter, methodFilter, startDate, endDate, endpointFilter]);

  useEffect(() => {
    // 默认显示最近7天的记录
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (!startDate && !endDate) {
      setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(methodFilter && { method: methodFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(endpointFilter && { endpoint: endpointFilter })
      });

      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setTotalRecords(data.total);
        setTotalPages(data.total_pages);
      } else {
        setError(data.message || '获取API日志失败');
      }
    } catch (err: any) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/logs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  };

  const handleClearOldLogs = async (days: number) => {
    if (confirm(`确定要清除超过 ${days} 天的日志记录吗？`)) {
      try {
        setError('');
        setSuccessMessage('');
        
        const response = await fetch(`/api/logs/clear?days=${days}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setSuccessMessage(data.message);
          // 重新加载数据
          loadLogs();
          loadStats();
          // 如果当前页没有数据了，回到第一页
          if (records.length === 0 && currentPage > 1) {
            setCurrentPage(1);
          }
        } else {
          setError(data.message || '清除日志失败');
        }
      } catch (err) {
        setError('清除日志失败，请重试');
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (success: boolean, statusCode: number) => {
    if (success) {
      return 'bg-green-100 text-green-800';
    } else if (statusCode >= 500) {
      return 'bg-red-100 text-red-800';
    } else if (statusCode >= 400) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800';
      case 'POST':
        return 'bg-green-100 text-green-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return '-';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatJSON = (jsonString?: string) => {
    if (!jsonString) return '';
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API请求日志</h1>
        <p className="text-gray-600 mt-1">监控和分析所有API请求的详细记录</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">总请求数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">今日请求</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.today.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">成功请求</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.success.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">失败请求</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.failed.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-500">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">平均响应</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.avgResponseTime}ms
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">筛选条件</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索端点或错误信息..."
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
              <option value="success">成功</option>
              <option value="error">失败</option>
            </select>
          </div>

          <div className="relative">
            <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">所有方法</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              {endpointOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={loadLogs}
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
            onClick={() => handleClearOldLogs(30)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>清除30天前</span>
          </button>

          <button
            onClick={() => handleClearOldLogs(7)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>清除7天前</span>
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* 数据表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">API请求日志</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                共 {totalRecords.toLocaleString()} 条记录
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-500">加载API日志中...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>暂无API请求日志</p>
              <p className="text-sm mt-1">请调整筛选条件后重新查询</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">端点</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">方法</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">响应时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户端IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户代理</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDateTime(log.request_time)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {log.endpoint}
                      </code>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.success, log.status_code)}`}>
                        {log.success ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {log.status_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        {formatResponseTime(log.response_time)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.client_ip || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                      <span title={log.user_agent}>
                        {truncateText(log.user_agent || '', 30)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                        title="查看详情"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
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

      {/* 详情模态框 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">API请求详情</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">请求信息</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>端点:</strong> {selectedLog.endpoint}</div>
                    <div><strong>方法:</strong> <span className={`px-2 py-1 rounded text-xs ${getMethodColor(selectedLog.method)}`}>{selectedLog.method}</span></div>
                    <div><strong>状态码:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedLog.success, selectedLog.status_code)}`}>{selectedLog.status_code}</span></div>
                    <div><strong>响应时间:</strong> {formatResponseTime(selectedLog.response_time)}</div>
                    <div><strong>请求时间:</strong> {formatDateTime(selectedLog.request_time)}</div>
                    <div><strong>客户端IP:</strong> {selectedLog.client_ip || '-'}</div>
                    <div><strong>用户ID:</strong> {selectedLog.user_id || '-'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">User Agent</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono break-all">
                    {selectedLog.user_agent || '-'}
                  </div>
                </div>

                {selectedLog.request_body && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-3">请求体</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                      {formatJSON(selectedLog.request_body)}
                    </pre>
                  </div>
                )}

                {selectedLog.response_body && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-3">响应体</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto max-h-60">
                      {formatJSON(selectedLog.response_body)}
                    </pre>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-red-900 mb-3">错误信息</h4>
                    <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiRequestLogs;