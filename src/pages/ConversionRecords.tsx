import React, { useState, useEffect, useRef } from 'react';
import { formatDateTime, formatTimestamp } from '../utils/dateUtils';
import { 
  Search, Filter, Calendar, Download, Upload, RefreshCw,
  TrendingUp, MousePointer, Clock, Globe, Eye, FileText,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Trash2
} from 'lucide-react';

interface ConversionRecord {
  id: number;
  gclid: string;
  conversion_name: string;
  conversion_time: string;
  stock_code: string;
  user_agent?: string;
  referrer_url?: string;
  client_ip?: string;
  created_at: string;
}

interface ConversionStats {
  total: number;
  today: number;
  conversionNames: Array<{ conversion_name: string; count: number }>;
  referrerUrls: Array<{ referrer_url: string; count: number }>;
}

const ConversionRecords: React.FC = () => {
  const [records, setRecords] = useState<ConversionRecord[]>([]);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage] = useState(20);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [conversionNameFilter, setConversionNameFilter] = useState('');
  const [referrerUrlFilter, setReferrerUrlFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 导入状态
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 时区状态
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Shanghai');

  useEffect(() => {
    loadRecords();
    loadStats();
  }, [currentPage, searchTerm, conversionNameFilter, referrerUrlFilter, startDate, endDate]);

  useEffect(() => {
    // 监听时区变化事件
    const handleTimezoneChange = (event: CustomEvent) => {
      console.log('🕐 [ConversionRecords] Timezone changed to:', event.detail.timezone);
      setUserTimezone(event.detail.timezone);
    };
    
    window.addEventListener('timezoneChanged', handleTimezoneChange as EventListener);
    
    // 初始化时区
    const savedTimezone = localStorage.getItem('user_timezone') || 'Asia/Shanghai';
    console.log('🕐 [ConversionRecords] Initial timezone:', savedTimezone);
    setUserTimezone(savedTimezone);
    
    // 默认显示当天的记录
    const today = new Date().toISOString().split('T')[0];
    if (!startDate && !endDate) {
      setStartDate(today);
      setEndDate(today);
    }
    
    return () => {
      window.removeEventListener('timezoneChanged', handleTimezoneChange as EventListener);
    };
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(conversionNameFilter && { conversion_name: conversionNameFilter }),
        ...(referrerUrlFilter && { referrer_url: referrerUrlFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await fetch(`/api/conversions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
        setTotalRecords(data.total);
        setTotalPages(data.total_pages);
      } else {
        setError(data.message || '获取转化记录失败');
      }
    } catch (err: any) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/conversions/stats', {
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

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(conversionNameFilter && { conversion_name: conversionNameFilter }),
        ...(referrerUrlFilter && { referrer_url: referrerUrlFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await fetch(`/api/conversions/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setSuccess('数据导出成功！');
      } else {
        setError('导出失败，请重试');
      }
    } catch (err) {
      setError('导出失败，请重试');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
      setError('请选择 CSV 或 TSV 文件');
      return;
    }

    setIsImporting(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      
      const response = await fetch('/api/conversions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ csvData: text })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        loadRecords();
        loadStats();
      } else {
        setError(data.message || '导入失败');
        if (data.errors) {
          console.error('导入错误:', data.errors);
        }
      }
    } catch (err) {
      setError('导入失败，请检查文件格式');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const extractDomain = (url: string) => {
    if (!url) return '-';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (confirm('确定要删除这条转化记录吗？删除后将重新整理ID顺序。')) {
      try {
        const response = await fetch(`/api/conversions/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setSuccess('转化记录删除成功！');
          loadRecords();
          loadStats();
        } else {
          setError(data.message || '删除失败');
        }
      } catch (err) {
        setError('删除失败，请重试');
      }
    }
  };

  const maskGclid = (gclid: string) => {
    if (!gclid || gclid.length <= 8) return gclid;
    return `${gclid.substring(0, 4)}...${gclid.substring(gclid.length - 4)}`;
  };

  const getUniqueValues = (field: keyof ConversionRecord) => {
    const values = records.map(record => record[field]).filter(Boolean);
    return [...new Set(values)];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">转化记录</h1>
        <p className="text-gray-600 mt-1">管理和分析Google Ads转化数据</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">总转化数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">今日转化</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.today.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <MousePointer className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">转化类型</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.conversionNames.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">来源页面</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.referrerUrls.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-pink-500">
                <Globe className="h-6 w-6 text-white" />
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
              placeholder="搜索GCLID或股票代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={conversionNameFilter}
              onChange={(e) => setConversionNameFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">所有转化类型</option>
              {stats?.conversionNames.map(item => (
                <option key={item.conversion_name} value={item.conversion_name}>
                  {item.conversion_name} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={referrerUrlFilter}
              onChange={(e) => setReferrerUrlFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">所有来源页面</option>
              {stats?.referrerUrls.map(item => (
                <option key={item.referrer_url} value={item.referrer_url}>
                  {extractDomain(item.referrer_url)} ({item.count})
                </option>
              ))}
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
            onClick={loadRecords}
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
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>导出CSV</span>
          </button>

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {isImporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{isImporting ? '导入中...' : '导入CSV'}</span>
            </button>
          </div>
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
            <h3 className="text-lg font-semibold text-gray-900">转化记录详情</h3>
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
                <span className="ml-2 text-gray-500">加载转化记录中...</span>
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>暂无转化记录</p>
              <p className="text-sm mt-1">请调整筛选条件后重新查询</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GCLID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">转化名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">股票代码</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">转化时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户代理</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">落地页来源</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户端IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                      <span title={record.gclid}>
                        {maskGclid(record.gclid)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.conversion_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.stock_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDateTime(record.conversion_time, userTimezone)} ({userTimezone})
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                      <span title={record.user_agent}>
                        {truncateText(record.user_agent || '', 40)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                      {record.referrer_url ? (
                        <a
                          href={record.referrer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                          title={record.referrer_url}
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          {extractDomain(record.referrer_url)}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {record.client_ip || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="删除记录"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="删除记录"
                      >
                        <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

export default ConversionRecords;