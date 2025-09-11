import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import MultiSelect from '../components/MultiSelect';
import { 
  MousePointer, BarChart3, Calendar, Globe, Filter, 
  RefreshCw, Download, Eye, ExternalLink, Clock,
  Smartphone, Monitor, ChevronLeft, ChevronRight,
  Wifi, Shield, Server, Navigation
} from 'lucide-react';

interface ClickRecord {
  click_id: string;
  flow_id: number;
  time_created: number;
  date_created: string;
  country: string;
  country_code: string;
  ip_address: string;
  isp: string;
  referer: string;
  user_agent: string;
  device: string;
  brand: string;
  os: string;
  browser: string;
  filter_type: string;
  filter_page: string;
  [key: string]: any;
}

interface FilterOption {
  id: number;
  name: string;
}

const ClickData: React.FC = () => {
  const [clicksData, setClicksData] = useState<ClickRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(50);
  
  // Filter states
  const [dateRanges, setDateRanges] = useState('');
  const [filterCountries, setFilterCountries] = useState<number[]>([]);
  const [filterFlows, setFilterFlows] = useState<number[]>([]);
  const [filterDevices, setFilterDevices] = useState<number[]>([]);
  const [filterOs, setFilterOs] = useState<number[]>([]);
  const [filterBrowsers, setFilterBrowsers] = useState<number[]>([]);
  const [filterLangs, setFilterLangs] = useState<number[]>([]);
  const [filterFilters, setFilterFilters] = useState<string[]>([]);
  const [filterPages, setFilterPages] = useState<string[]>([]);

  // Filter options
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [flows, setFlows] = useState<FilterOption[]>([]);
  const [devices, setDevices] = useState<FilterOption[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<FilterOption[]>([]);
  const [browsers, setBrowsers] = useState<FilterOption[]>([]);
  const [languages, setLanguages] = useState<FilterOption[]>([]);

  // Filter types options
  const filterTypesOptions = [
    { id: 'success', name: '成功' },
    { id: 'status', name: '状态' },
    { id: 'ip_clicks_per_day', name: 'IP每日点击' },
    { id: 'clicks_before_filtering', name: '过滤前点击' },
    { id: 'bot', name: '机器人' },
    { id: 'ip_v6', name: 'IPv6' },
    { id: 'referer', name: '来源' },
    { id: 'isp', name: 'ISP' },
    { id: 'country', name: '国家' },
    { id: 'device', name: '设备' },
    { id: 'os', name: '操作系统' },
    { id: 'browser', name: '浏览器' },
    { id: 'black_ip', name: '黑名单IP' },
    { id: 'vpn_proxy', name: 'VPN/代理' },
    { id: 'black_list', name: '黑名单' },
    { id: 'white_list', name: '白名单' }
  ];

  const pageTypesOptions = [
    { id: 'white', name: '白页面' },
    { id: 'offer', name: '落地页' }
  ];

  // Loading states
  const [loadingFilters, setLoadingFilters] = useState({
    countries: false,
    flows: false,
    devices: false,
    os: false,
    browsers: false,
    languages: false
  });

  useEffect(() => {
    loadFilterOptions();
    loadClicks();
  }, []);

  useEffect(() => {
    loadClicks();
  }, [currentPage, perPage]);

  const loadFilterOptions = async () => {
    // Load countries
    setLoadingFilters(prev => ({ ...prev, countries: true }));
    try {
      const countriesResponse = await apiService.getCountries();
      if (countriesResponse.success) {
        // 确保数据格式正确
        const formattedCountries = countriesResponse.data.map(item => ({
          id: item.country_id || item.id,
          name: item.name
        }));
        setCountries(formattedCountries);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, countries: false }));
    }

    // Load flows
    setLoadingFilters(prev => ({ ...prev, flows: true }));
    try {
      const flowsResponse = await apiService.getFlows(1, 100);
      if (flowsResponse.success) {
        const flowOptions = flowsResponse.data.map((flow: any) => ({
          id: flow.flow_id,
          name: flow.name
        }));
        setFlows(flowOptions);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, flows: false }));
    }

    // Load other filter options
    try {
      const [devicesRes, osRes, browsersRes, langsRes] = await Promise.all([
        apiService.getDevices(),
        apiService.getOperatingSystems(),
        apiService.getBrowsers(),
        apiService.getLanguages()
      ]);

      if (devicesRes.success) {
        const formattedDevices = devicesRes.data.map(item => ({
          id: item.device_id || item.id,
          name: item.name
        }));
        setDevices(formattedDevices);
      }
      if (osRes.success) {
        const formattedOS = osRes.data.map(item => ({
          id: item.os_id || item.id,
          name: item.name
        }));
        setOperatingSystems(formattedOS);
      }
      if (browsersRes.success) {
        const formattedBrowsers = browsersRes.data.map(item => ({
          id: item.browser_id || item.id,
          name: item.name
        }));
        setBrowsers(formattedBrowsers);
      }
      if (langsRes.success) {
        const formattedLanguages = langsRes.data.map(item => ({
          id: item.lang_id || item.id,
          name: item.name
        }));
        setLanguages(formattedLanguages);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadClicks = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        ...(dateRanges && { date_ranges: dateRanges }),
        ...(filterCountries.length > 0 && { filter_countries: filterCountries }),
        ...(filterFlows.length > 0 && { filter_flows: filterFlows }),
        ...(filterDevices.length > 0 && { filter_devices: filterDevices }),
        ...(filterOs.length > 0 && { filter_os: filterOs }),
        ...(filterBrowsers.length > 0 && { filter_browsers: filterBrowsers }),
        ...(filterLangs.length > 0 && { filter_langs: filterLangs })
      };

      const response = await apiService.getClicks(params);
      
      if (response.success) {
        setClicksData(response.data);
        setTotalRecords(response.total);
        setTotalPages(Math.ceil(response.total / perPage));
      } else {
        setError(response.message || '获取点击数据失败');
      }
    } catch (err: any) {
      console.error('Clicks error:', err);
      setError(err.message || '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
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

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const getResultColor = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'white':
        return 'bg-blue-100 text-blue-800';
      case 'filtered':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultText = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'offer':
        return '落地页';
      case 'white':
        return '白页面';
      case 'filtered':
        return '已过滤';
      default:
        return result || '未知';
    }
  };

  const getPageTypeColor = (pageType: string) => {
    switch (pageType?.toLowerCase()) {
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'white':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPageTypeText = (pageType: string) => {
    switch (pageType?.toLowerCase()) {
      case 'offer':
        return '落地页';
      case 'white':
        return '白页面';
      default:
        return pageType || '未知';
    }
  };

  const getFilterTypeText = (filterType: string) => {
    switch (filterType?.toLowerCase()) {
      case 'success':
        return '成功';
      case 'black_ip':
        return '黑名单IP';
      case 'vpn_proxy':
        return 'VPN/代理';
      case 'bot':
        return '机器人';
      case 'ip_v6':
        return 'IPv6';
      case 'referer':
        return '来源过滤';
      case 'isp':
        return 'ISP过滤';
      case 'country':
        return '国家过滤';
      case 'device':
        return '设备过滤';
      case 'os':
        return '系统过滤';
      case 'browser':
        return '浏览器过滤';
      case 'white_list':
        return '白名单';
      case 'black_list':
        return '黑名单';
      case 'ip_clicks_per_day':
        return 'IP日点击限制';
      case 'clicks_before_filtering':
        return '过滤前点击';
      default:
        return filterType || '未知';
    }
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const maskIP = (ip: string) => {
    if (!ip) return '-';
    // 显示完整IP地址
    return ip;
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return '-';
    // 提取主要浏览器信息
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    return match ? match[0] : truncateText(userAgent, 40);
  };

  // 国家代码到中文名称的映射
  const getCountryName = (countryCode: string) => {
    const countryMap: { [key: string]: string } = {
      'US': '美国',
      'CN': '中国',
      'JP': '日本',
      'KR': '韩国',
      'SG': '新加坡',
      'HK': '香港',
      'TW': '台湾',
      'IN': '印度',
      'GB': '英国',
      'DE': '德国',
      'FR': '法国',
      'CA': '加拿大',
      'AU': '澳大利亚',
      'RU': '俄罗斯',
      'BR': '巴西',
      'MX': '墨西哥',
      'IT': '意大利',
      'ES': '西班牙',
      'NL': '荷兰',
      'SE': '瑞典',
      'NO': '挪威',
      'DK': '丹麦',
      'FI': '芬兰',
      'PL': '波兰',
      'TR': '土耳其',
      'TH': '泰国',
      'VN': '越南',
      'MY': '马来西亚',
      'ID': '印度尼西亚',
      'PH': '菲律宾'
    };
    return countryMap[countryCode] || countryCode;
  };

  // 过滤结果颜色映射
  const getFilterTypeColor = (filterType: string) => {
    switch (filterType?.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'black_ip':
        return 'bg-red-100 text-red-800';
      case 'vpn_proxy':
        return 'bg-orange-100 text-orange-800';
      case 'bot':
        return 'bg-purple-100 text-purple-800';
      case 'ip_v6':
        return 'bg-blue-100 text-blue-800';
      case 'referer':
        return 'bg-yellow-100 text-yellow-800';
      case 'isp':
        return 'bg-pink-100 text-pink-800';
      case 'country':
        return 'bg-indigo-100 text-indigo-800';
      case 'device':
        return 'bg-cyan-100 text-cyan-800';
      case 'os':
        return 'bg-teal-100 text-teal-800';
      case 'browser':
        return 'bg-lime-100 text-lime-800';
      case 'white_list':
        return 'bg-emerald-100 text-emerald-800';
      case 'black_list':
        return 'bg-rose-100 text-rose-800';
      case 'ip_clicks_per_day':
        return 'bg-amber-100 text-amber-800';
      case 'clicks_before_filtering':
        return 'bg-violet-100 text-violet-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">点击数据统计</h1>
        <p className="text-gray-600 mt-1">详细的点击分析和用户行为数据</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">总点击数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalRecords.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <MousePointer className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">当前页面</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {currentPage} / {totalPages}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">每页显示</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {perPage}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">筛选条件</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {[filterCountries, filterFlows, filterDevices, filterOs, filterBrowsers, filterLangs]
                  .reduce((sum, arr) => sum + arr.length, 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-pink-500">
              <Filter className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">筛选条件</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每页显示
            </label>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <MultiSelect
            label="国家筛选"
            options={countries}
            selectedValues={filterCountries}
            onChange={setFilterCountries}
            placeholder="选择国家..."
            loading={loadingFilters.countries}
          />

          <MultiSelect
            label="流程筛选"
            options={flows}
            selectedValues={filterFlows}
            onChange={setFilterFlows}
            placeholder="选择流程..."
            loading={loadingFilters.flows}
          />

          <MultiSelect
            label="设备筛选"
            options={devices}
            selectedValues={filterDevices}
            onChange={setFilterDevices}
            placeholder="选择设备..."
            loading={loadingFilters.devices}
          />

          <MultiSelect
            label="操作系统筛选"
            options={operatingSystems}
            selectedValues={filterOs}
            onChange={setFilterOs}
            placeholder="选择操作系统..."
            loading={loadingFilters.os}
          />

          <MultiSelect
            label="浏览器筛选"
            options={browsers}
            selectedValues={filterBrowsers}
            onChange={setFilterBrowsers}
            placeholder="选择浏览器..."
            loading={loadingFilters.browsers}
          />

          <MultiSelect
            label="语言筛选"
            options={languages}
            selectedValues={filterLangs}
            onChange={setFilterLangs}
            placeholder="选择语言..."
            loading={loadingFilters.languages}
          />
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={loadClicks}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <MousePointer className="h-4 w-4" />
            )}
            <span>{isLoading ? '加载中...' : '获取数据'}</span>
          </button>

          <button
            onClick={() => {
              setDateRanges('');
              setFilterCountries([]);
              setFilterFlows([]);
              setFilterDevices([]);
              setFilterOs([]);
              setFilterBrowsers([]);
              setFilterLangs([]);
              setFilterFilters([]);
              setFilterPages([]);
              setCurrentPage(1);
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重置</span>
          </button>

          <button
            onClick={() => {
              // 导出功能
              const csvContent = "data:text/csv;charset=utf-8," 
                + "点击ID,流程ID,创建日期,创建时间,IP地址,国家代码,语言代码,ISP,来源,User Agent,设备,品牌,操作系统,浏览器,过滤类型,过滤页面\n"
                + clicksData.map(row => 
                  `${row.click_id},${row.flow_id},${row.date_created},${formatTimestamp(row.time_created)},${row.ip_address},${row.country_code},${row.language_code},${row.isp},${row.referer},${row.user_agent},${row.device},${row.brand},${row.os},${row.browser},${row.filter_type},${row.filter_page}`
                ).join("\n");
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `clicks_data_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>导出CSV</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Clicks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">点击记录详情</h3>
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
                <span className="ml-2 text-gray-500">加载点击数据中...</span>
              </div>
            </div>
          ) : clicksData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MousePointer className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>暂无点击数据</p>
              <p className="text-sm mt-1">请调整筛选条件后重新获取</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">流程</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地理位置</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">语言</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备信息</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过滤结果</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">页面类型</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clicksData.map((click) => (
                  <tr key={click.click_id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {click.date_created}
                        </div>
                        <div className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(click.time_created)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">流程 {click.flow_id}</div>
                        <div className="text-xs text-gray-500">ID: {click.flow_id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {click.ip_address || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {getCountryName(click.country_code)} ({click.country_code})
                        </div>
                        <div className="text-xs">{click.brand || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {click.language_code || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Server className="h-3 w-3 mr-1" />
                        {truncateText(click.isp, 15)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {click.referer ? (
                        <div className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {truncateText(click.referer, 20)}
                        </div>
                      ) : (
                        <span className="text-gray-400">直接访问</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-32">
                        {formatUserAgent(click.user_agent)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="flex items-center">
                          {click.device?.toLowerCase().includes('mobile') ? 
                            <Smartphone className="h-3 w-3 mr-1" /> : 
                            <Monitor className="h-3 w-3 mr-1" />
                          }
                          {click.device}
                        </div>
                        <div className="text-xs">{click.os}</div>
                        <div className="text-xs">{click.browser}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFilterTypeColor(click.filter_type)}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {getFilterTypeText(click.filter_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPageTypeColor(click.filter_page)}`}>
                        {getPageTypeText(click.filter_page)}
                      </span>
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

export default ClickData;