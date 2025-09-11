import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { 
  Search, Plus, Eye, Edit, Trash2, Play, Pause, 
  Download, RotateCcw, RefreshCw, Filter, X,
  ChevronLeft, ChevronRight, Globe, Shield, Clock
} from 'lucide-react';

interface Flow {
  flow_id: number;
  time_created: number;
  date_created: string;
  name: string;
  status: string;
  label: string;
  hosts: number;
  hits: number;
  filtered: number;
  ctr: number;
  url_white_page: string;
  url_offer_page: string;
}

interface FlowDetails {
  flow_id: number;
  name: string;
  url_white_page: string;
  url_offer_page: string;
  mode_white_page: string;
  mode_offer_page: string;
  filter_countries: number[];
  filter_devices: number[];
  filter_os: number[];
  filter_browsers: number[];
  filter_langs: number[];
  filter_time_zones: number[];
  filter_connections: number[];
  filter_cloaking_flag: number;
  filter_vpn_proxy_flag: number;
  filter_ip_v6_flag: number;
  filter_referer_flag: number;
  filter_isp_flag: number;
  filter_black_ip_flag: number;
  filter_ip_clicks_per_day: number;
  filter_clicks_before_filtering: number;
  mode_list_country: number;
  mode_list_device: number;
  mode_list_os: number;
  mode_list_browser: number;
  mode_list_lang: number;
  mode_list_time_zone: number;
  mode_list_connection: number;
  filter_id: number;
  allowed_ips: string[];
  status: string;
  created_at: string;
  [key: string]: any;
}

const FlowManagement: React.FC = () => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 详情模态窗口状态
  const [selectedFlow, setSelectedFlow] = useState<FlowDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const perPage = 10;

  useEffect(() => {
    loadFlows();
  }, [currentPage, searchTerm, statusFilter]);

  const loadFlows = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiService.getFlows(currentPage, perPage, statusFilter, searchTerm);
      if (response.success) {
        // 过滤掉已删除的流程
        const activeFlows = response.data.filter((flow: Flow) => 
          flow.status !== 'deleted' && flow.status !== 'inactive'
        );
        setFlows(activeFlows);
        setTotalRecords(response.total);
        setTotalPages(Math.ceil(response.total / perPage));
      } else {
        setError(response.message || '获取流程数据失败');
      }
    } catch (err: any) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFlowDetails = async (flowId: number) => {
    setLoadingDetails(true);
    try {
      const response = await apiService.getFlowDetails(flowId);
      if (response.success) {
        setSelectedFlow(response.data);
      } else {
        setError(response.message || '获取流程详情失败');
      }
    } catch (err: any) {
      setError('获取详情失败，请重试');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'inactive':
      case 'deleted':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '活跃';
      case 'paused':
        return '暂停';
      case 'inactive':
        return '停用';
      case 'deleted':
        return '已删除';
      default:
        return status;
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

  const maskLabel = (label: string) => {
    if (!label || label.length <= 8) return label || '-';
    return `${label.substring(0, 4)}${'*'.repeat(16)}${label.substring(label.length - 8)}`;
  };

  // 辅助函数：获取过滤列表数量
  const getFilterListCount = (filterList: any): number => {
    if (Array.isArray(filterList)) {
      return filterList.length;
    }
    if (typeof filterList === 'string' && filterList.length > 0) {
      return filterList.split(',').filter(item => item.trim().length > 0).length;
    }
    return 0;
  };

  // 辅助函数：格式化过滤列表显示
  const formatFilterList = (filterList: any): string => {
    if (Array.isArray(filterList)) {
      return filterList.join(', ');
    }
    if (typeof filterList === 'string') {
      return filterList;
    }
    return '';
  };
  const handleViewDetails = async (flowId: number) => {
    await loadFlowDetails(flowId);
  };

  const handleDeleteFlow = async (flowId: number) => {
    if (confirm('确定要删除这个流程吗？')) {
      try {
        setError('');
        setSuccess('');
        const response = await apiService.deleteFlow(flowId);
        if (response.success) {
          setSuccess('流程删除成功');
          loadFlows();
        } else {
          setError(response.message || '删除失败');
        }
      } catch (error: any) {
        setError('删除失败，请重试');
      }
    }
  };

  const handleRestoreFlow = async (flowId: number) => {
    try {
      setError('');
      setSuccess('');
      const response = await apiService.restoreFlow(flowId);
      if (response.success) {
        setSuccess('流程恢复成功');
        loadFlows();
      } else {
        setError(response.message || '恢复失败');
      }
    } catch (error: any) {
      setError('恢复失败，请重试');
    }
  };

  const handleActivateFlow = async (flowId: number) => {
    try {
      setError('');
      setSuccess('');
      const response = await apiService.activateFlow(flowId);
      if (response.success) {
        setSuccess('流程激活成功');
        loadFlows();
      } else {
        setError(response.message || '激活失败');
      }
    } catch (error: any) {
      setError('激活失败，请重试');
    }
  };

  const handlePauseFlow = async (flowId: number) => {
    try {
      setError('');
      setSuccess('');
      const response = await apiService.pauseFlow(flowId);
      if (response.success) {
        setSuccess('流程暂停成功');
        loadFlows();
      } else {
        setError(response.message || '暂停失败');
      }
    } catch (error: any) {
      setError('暂停失败，请重试');
    }
  };

  const handleDownloadIntegration = async (flowId: number) => {
    try {
      setError('');
      setSuccess('');
      console.log(`[FlowManagement] Attempting to download integration for flow ID: ${flowId}`);
      const response = await apiService.downloadFlowIntegration(flowId);
      console.log('[FlowManagement] Download integration API response:', response); // Add this log
      
      if (response.success) {
        if (response.download_url) { // 修正：直接从根级别获取 download_url
          const downloadUrl = response.download_url;
          console.log(`[FlowManagement] Download URL received: ${downloadUrl}`);
          
          try {
            // 方法1: 直接使用window.open
            window.open(downloadUrl, '_blank');
            setSuccess('集成文件下载已开始');
            console.log(`[FlowManagement] Download initiated via window.open: ${downloadUrl}`);
          } catch (openError) {
            console.error('[FlowManagement] window.open failed, trying alternative method:', openError);
            
            // 方法2: 使用隐藏链接
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `flow_${flowId}_integration.zip`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setSuccess('集成文件下载已开始');
            console.log(`[FlowManagement] Download initiated via hidden link: ${downloadUrl}`);
          }
        } else {
          console.error('[FlowManagement] Download URL missing in response data:', response);
          setError('未获取到下载链接，请检查流程状态');
        }
      } else {
        console.error('[FlowManagement] Download integration failed:', response);
        setError(response.message || '下载失败');
      }
    } catch (error: any) {
      console.error('[FlowManagement] Error during download integration:', error);
      setError('下载失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">流程管理</h1>
          <p className="text-gray-600 mt-1">管理和监控所有斗篷流程</p>
        </div>
        <Link
          to="/admin/flows/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>创建流程</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">总流程数</p>
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
              <p className="text-gray-500 text-sm font-medium">活跃流程</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {flows.filter(f => f.status === 'active').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">暂停流程</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {flows.filter(f => f.status === 'paused').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500">
              <Pause className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">总点击量</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {flows.reduce((sum, f) => sum + f.hits, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索流程..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white"
            >
              <option value="">所有状态</option>
              <option value="active">活跃</option>
              <option value="paused">暂停</option>
            </select>
          </div>

          <button
            onClick={loadFlows}
            disabled={isLoading}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>刷新</span>
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

      {/* Flows Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">流程列表</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                共 {totalRecords.toLocaleString()} 个流程
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">主机</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">点击量</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已过滤</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">比率</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <span className="ml-2 text-gray-500">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    暂无流程数据
                  </td>
                </tr>
              ) : (
                flows.map((flow) => (
                  <tr key={flow.flow_id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {flow.flow_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(flow.time_created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {maskLabel(flow.label)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {flow.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.hosts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.hits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.filtered.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.ctr}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(flow.status)}`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          {getStatusText(flow.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(flow.flow_id)}
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/admin/flows/edit/${flow.flow_id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          title="编辑流程"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteFlow(flow.flow_id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                          title="删除流程"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRestoreFlow(flow.flow_id)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                          title="恢复流程"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        {flow.status === 'active' ? (
                          <button
                            onClick={() => handlePauseFlow(flow.flow_id)}
                            className="p-1 text-gray-400 hover:text-yellow-600 transition-colors duration-200"
                            title="暂停流程"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateFlow(flow.flow_id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                            title="激活流程"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadIntegration(flow.flow_id)}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                          title="下载集成文件"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {/* Flow Details Modal */}
      {selectedFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">流程详情 - {selectedFlow.name}</h3>
                <button
                  onClick={() => setSelectedFlow(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-500">加载详情中...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">基本信息</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>流程ID:</strong> {selectedFlow.flow_id}</div>
                      <div><strong>流程名称:</strong> {selectedFlow.name}</div>
                      <div><strong>状态:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedFlow.status)} text-white`}>
                          {getStatusText(selectedFlow.status)}
                        </span>
                      </div>
                      <div><strong>创建时间:</strong> {selectedFlow.created_at}</div>
                    </div>
                  </div>

                  {/* 页面配置 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">页面配置</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>白页面URL:</strong> 
                        <a href={selectedFlow.url_white_page} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:text-blue-800">
                          {selectedFlow.url_white_page}
                        </a>
                      </div>
                      <div><strong>落地页URL:</strong> 
                        <a href={selectedFlow.url_offer_page} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:text-blue-800">
                          {selectedFlow.url_offer_page}
                        </a>
                      </div>
                      <div><strong>白页面模式:</strong> {selectedFlow.mode_white_page}</div>
                      <div><strong>落地页模式:</strong> {selectedFlow.mode_offer_page}</div>
                    </div>
                  </div>

                  {/* 过滤设置 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">过滤设置</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-4 w-4 ${(selectedFlow.filter_cloaking_flag == 1) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span>机器人过滤: {(selectedFlow.filter_cloaking_flag == 1) ? '启用' : '禁用'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-4 w-4 ${(selectedFlow.filter_vpn_proxy_flag == 1) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span>VPN/代理过滤: {(selectedFlow.filter_vpn_proxy_flag == 1) ? '启用' : '禁用'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-4 w-4 ${(selectedFlow.filter_ip_v6_flag == 1) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span>IPv6过滤: {(selectedFlow.filter_ip_v6_flag == 1) ? '启用' : '禁用'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-4 w-4 ${(selectedFlow.filter_referer_flag == 1) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span>来源过滤: {(selectedFlow.filter_referer_flag == 1) ? '启用' : '禁用'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-4 w-4 ${(selectedFlow.filter_isp_flag == 1) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span>ISP过滤: {(selectedFlow.filter_isp_flag == 1) ? '启用' : '禁用'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-4 w-4 ${(selectedFlow.filter_black_ip_flag == 1) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span>IP黑名单: {(selectedFlow.filter_black_ip_flag == 1) ? '启用' : '禁用'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 数值限制 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">数值限制</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>每IP每日最大点击:</strong> {selectedFlow.filter_ip_clicks_per_day || 0}</div>
                      <div><strong>过滤前点击数:</strong> {selectedFlow.filter_clicks_before_filtering || 0}</div>
                      <div><strong>过滤器ID:</strong> {selectedFlow.filter_id || 0}</div>
                    </div>
                  </div>

                  {/* 过滤列表 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">过滤列表</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>国家列表:</strong> {getFilterListCount(selectedFlow.filter_countries)} 个</div>
                      <div><strong>设备列表:</strong> {getFilterListCount(selectedFlow.filter_devices)} 个</div>
                      <div><strong>操作系统列表:</strong> {getFilterListCount(selectedFlow.filter_os)} 个</div>
                      <div><strong>浏览器列表:</strong> {getFilterListCount(selectedFlow.filter_browsers)} 个</div>
                      <div><strong>语言列表:</strong> {getFilterListCount(selectedFlow.filter_langs)} 个</div>
                      <div><strong>时区列表:</strong> {getFilterListCount(selectedFlow.filter_time_zones)} 个</div>
                      <div><strong>连接类型列表:</strong> {getFilterListCount(selectedFlow.filter_connections)} 个</div>
                    </div>
                  </div>

                  {/* 允许的IP */}
                  {getFilterListCount(selectedFlow.allowed_ips) > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">允许的IP地址</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-mono">
                          {formatFilterList(selectedFlow.allowed_ips)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowManagement;