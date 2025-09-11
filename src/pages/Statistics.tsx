import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import MultiSelect from '../components/MultiSelect';
import { 
  BarChart3, TrendingUp, PieChart, Activity, Calendar, 
  Filter, RefreshCw, Download, Eye 
} from 'lucide-react';

interface StatisticsData {
  [key: string]: any;
}

interface FilterOption {
  id: number;
  name: string;
}

const Statistics: React.FC = () => {
  const [statisticsData, setStatisticsData] = useState<StatisticsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [groupBy, setGroupBy] = useState('date');
  const [dateRanges, setDateRanges] = useState('');
  const [filterCountries, setFilterCountries] = useState<number[]>([]);
  const [filterFlows, setFilterFlows] = useState<number[]>([]);
  const [filterDevices, setFilterDevices] = useState<number[]>([]);
  const [filterOs, setFilterOs] = useState<number[]>([]);
  const [filterBrowsers, setFilterBrowsers] = useState<number[]>([]);
  const [filterLangs, setFilterLangs] = useState<number[]>([]);

  // Filter options
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [flows, setFlows] = useState<FilterOption[]>([]);
  const [devices, setDevices] = useState<FilterOption[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<FilterOption[]>([]);
  const [browsers, setBrowsers] = useState<FilterOption[]>([]);
  const [languages, setLanguages] = useState<FilterOption[]>([]);

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
    loadStatistics();
  }, []);

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

  const loadStatistics = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = {
        group_by: groupBy,
        ...(dateRanges && { date_ranges: dateRanges }),
        ...(filterCountries.length > 0 && { filter_countries: filterCountries }),
        ...(filterFlows.length > 0 && { filter_flows: filterFlows }),
        ...(filterDevices.length > 0 && { filter_devices: filterDevices }),
        ...(filterOs.length > 0 && { filter_os: filterOs }),
        ...(filterBrowsers.length > 0 && { filter_browsers: filterBrowsers }),
        ...(filterLangs.length > 0 && { filter_langs: filterLangs })
      };

      const response = await apiService.getStatistics(params);
      
      if (response.success) {
        setStatisticsData(response.data);
      } else {
        setError(response.message || '获取统计数据失败');
      }
    } catch (err: any) {
      console.error('Statistics error:', err);
      setError(err.message || '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRanges(e.target.value);
  };

  const formatDateForInput = (dateStr: string) => {
    // Convert DD.MM.YYYY to YYYY-MM-DD for HTML date input
    if (dateStr.includes('.')) {
      const [day, month, year] = dateStr.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const formatDateForAPI = (startDate: string, endDate: string) => {
    // Convert YYYY-MM-DD to DD.MM.YYYY format for API
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

  const groupByOptions = [
    { value: 'date', label: '按日期' },
    { value: 'hour', label: '按小时' },
    { value: 'day_week', label: '按星期' },
    { value: 'flow', label: '按流程' },
    { value: 'country', label: '按国家' },
    { value: 'city', label: '按城市' },
    { value: 'device', label: '按设备' },
    { value: 'operating_system', label: '按操作系统' },
    { value: 'browser', label: '按浏览器' },
    { value: 'brand', label: '按品牌' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">统计数据</h1>
        <p className="text-gray-600 mt-1">流程性能和趋势分析</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">筛选条件</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分组方式
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {groupByOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
            onClick={loadStatistics}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            <span>{isLoading ? '加载中...' : '获取统计'}</span>
          </button>

          <button
            onClick={() => {
              setGroupBy('date');
              setDateRanges('');
              setFilterCountries([]);
              setFilterFlows([]);
              setFilterDevices([]);
              setFilterOs([]);
              setFilterBrowsers([]);
              setFilterLangs([]);
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">统计结果</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                共 {statisticsData.length} 条记录
              </span>
              {statisticsData.length > 0 && (
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-500">加载统计数据中...</span>
              </div>
            </div>
          ) : statisticsData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>暂无统计数据</p>
              <p className="text-sm mt-1">请调整筛选条件后重新获取</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {Object.keys(statisticsData[0] || {}).map((key) => (
                    <th key={key} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statisticsData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {statisticsData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">总记录数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {statisticsData.length.toLocaleString()}
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
                <p className="text-gray-500 text-sm font-medium">分组方式</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {groupByOptions.find(opt => opt.value === groupBy)?.label}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <PieChart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">日期范围</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {dateRanges || '全部'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500">
                <Calendar className="h-6 w-6 text-white" />
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
      )}
    </div>
  );
};

export default Statistics;