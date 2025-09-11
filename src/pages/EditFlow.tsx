import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import EnhancedMultiSelect from '../components/EnhancedMultiSelect';
import ToggleSwitch from '../components/ToggleSwitch';
import { ArrowLeft, Save, X } from 'lucide-react';

interface FlowFormData {
  name: string;
  url_white_page: string;
  url_offer_page: string;
  mode_white_page: string;
  mode_offer_page: string;
  status: string;
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
}

interface FilterOption {
  id: number;
  name: string;
}

const EditFlow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFlow, setLoadingFlow] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter options state - 与CreateFlow完全一致
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [devices, setDevices] = useState<FilterOption[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<FilterOption[]>([]);
  const [browsers, setBrowsers] = useState<FilterOption[]>([]);
  const [languages, setLanguages] = useState<FilterOption[]>([]);
  const [timezones, setTimezones] = useState<FilterOption[]>([]);
  const [connections, setConnections] = useState<FilterOption[]>([]);

  // Loading states - 与CreateFlow完全一致
  const [loadingFilters, setLoadingFilters] = useState({
    countries: false,
    devices: false,
    os: false,
    browsers: false,
    languages: false,
    timezones: false,
    connections: false
  });

  const [formData, setFormData] = useState<FlowFormData>({
    name: '',
    url_white_page: '',
    url_offer_page: '',
    mode_white_page: 'redirect',
    mode_offer_page: 'redirect',
    status: 'active',
    filter_countries: [],
    filter_devices: [],
    filter_os: [],
    filter_browsers: [],
    filter_langs: [],
    filter_time_zones: [],
    filter_connections: [],
    filter_cloaking_flag: 1,
    filter_vpn_proxy_flag: 1,
    filter_ip_v6_flag: 0,
    filter_referer_flag: 1,
    filter_isp_flag: 0,
    filter_black_ip_flag: 1,
    filter_ip_clicks_per_day: 0,
    filter_clicks_before_filtering: 0,
    mode_list_country: 1,
    mode_list_device: 1,
    mode_list_os: 1,
    mode_list_browser: 1,
    mode_list_lang: 1,
    mode_list_time_zone: 1,
    mode_list_connection: 1,
    filter_id: 0,
    allowed_ips: []
  });

  useEffect(() => {
    loadFilterData();
    loadFlow();
  }, [id]);

  // 与CreateFlow完全相同的数据加载逻辑
  const loadFilterData = async () => {
    // Load countries
    setLoadingFilters(prev => ({ ...prev, countries: true }));
    try {
      console.log('Loading countries...');
      const countriesResponse = await apiService.getCountries();
      console.log('Countries API response:', countriesResponse);
      if (countriesResponse.success) {
        const formattedCountries = countriesResponse.data.map(item => ({
          id: item.country_id || item.id,
          name: item.name
        }));
        setCountries(formattedCountries);
        console.log('Countries loaded:', countriesResponse.data.length, 'items');
      } else {
        console.error('Countries API error:', countriesResponse.message);
      }
    } catch (error) {
      console.error('Error loading countries:', error.message);
    } finally {
      setLoadingFilters(prev => ({ ...prev, countries: false }));
    }

    // Load devices
    setLoadingFilters(prev => ({ ...prev, devices: true }));
    try {
      console.log('Loading devices...');
      const devicesResponse = await apiService.getDevices();
      console.log('Devices response:', devicesResponse);
      if (devicesResponse.success) {
        const formattedDevices = devicesResponse.data.map(item => ({
          id: item.device_id || item.id,
          name: item.name
        }));
        setDevices(formattedDevices);
      } else {
        console.error('Devices API error:', devicesResponse.message);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, devices: false }));
    }

    // Load operating systems
    setLoadingFilters(prev => ({ ...prev, os: true }));
    try {
      console.log('Loading OS...');
      const osResponse = await apiService.getOperatingSystems();
      console.log('OS response:', osResponse);
      if (osResponse.success) {
        const formattedOS = osResponse.data.map(item => ({
          id: item.os_id || item.id,
          name: item.name
        }));
        setOperatingSystems(formattedOS);
      } else {
        console.error('OS API error:', osResponse.message);
      }
    } catch (error) {
      console.error('Error loading OS:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, os: false }));
    }

    // Load browsers
    setLoadingFilters(prev => ({ ...prev, browsers: true }));
    try {
      console.log('Loading browsers...');
      const browsersResponse = await apiService.getBrowsers();
      console.log('Browsers response:', browsersResponse);
      if (browsersResponse.success) {
        const formattedBrowsers = browsersResponse.data.map(item => ({
          id: item.browser_id || item.id,
          name: item.name
        }));
        setBrowsers(formattedBrowsers);
      } else {
        console.error('Browsers API error:', browsersResponse.message);
      }
    } catch (error) {
      console.error('Error loading browsers:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, browsers: false }));
    }

    // Load languages
    setLoadingFilters(prev => ({ ...prev, languages: true }));
    try {
      console.log('Loading languages...');
      const languagesResponse = await apiService.getLanguages();
      console.log('Languages response:', languagesResponse);
      if (languagesResponse.success) {
        const formattedLanguages = languagesResponse.data.map(item => ({
          id: item.lang_id || item.id,
          name: item.name
        }));
        setLanguages(formattedLanguages);
      } else {
        console.error('Languages API error:', languagesResponse.message);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, languages: false }));
    }

    // Load timezones
    setLoadingFilters(prev => ({ ...prev, timezones: true }));
    try {
      console.log('Loading timezones...');
      const timezonesResponse = await apiService.getTimezones();
      console.log('Timezones response:', timezonesResponse);
      if (timezonesResponse.success) {
        const formattedTimezones = timezonesResponse.data.map(item => ({
          id: item.zone_id || item.id,
          name: item.name
        }));
        setTimezones(formattedTimezones);
      } else {
        console.error('Timezones API error:', timezonesResponse.message);
      }
    } catch (error) {
      console.error('Error loading timezones:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, timezones: false }));
    }

    // Load connections
    setLoadingFilters(prev => ({ ...prev, connections: true }));
    try {
      console.log('Loading connections...');
      const connectionsResponse = await apiService.getConnections();
      console.log('Connections response:', connectionsResponse);
      if (connectionsResponse.success) {
        const formattedConnections = connectionsResponse.data.map(item => ({
          id: item.connection_id || item.id,
          name: item.name
        }));
        setConnections(formattedConnections);
      } else {
        console.error('Connections API error:', connectionsResponse.message);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoadingFilters(prev => ({ ...prev, connections: false }));
    }
  };

  const loadFlow = async () => {
    if (!id) return;
    
    setLoadingFlow(true);
    try {
      const response = await apiService.getFlowDetails(parseInt(id));
      if (response.success) {
        const flow = response.data;
        console.log('Flow data from API:', flow);
        
        // 确保数组字段的正确处理
        const parseArrayField = (field) => {
          console.log('Parsing array field:', field, typeof field);
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              console.log('Parsed JSON:', parsed);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              const split = field.split(',').map(item => parseInt(item.trim())).filter(item => !isNaN(item));
              console.log('Parsed CSV:', split);
              return split;
            }
          }
          if (typeof field === 'number') return [field];
          return [];
        };

        const parseStringArrayField = (field) => {
          console.log('Parsing string array field:', field, typeof field);
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              console.log('Parsed string JSON:', parsed);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              const split = field.split(',').map(item => item.trim()).filter(item => item.length > 0);
              console.log('Parsed string CSV:', split);
              return split;
            }
          }
          return [];
        };

        // 解析过滤器数据
        const parsedCountries = parseArrayField(flow.filter_countries);
        const parsedDevices = parseArrayField(flow.filter_devices);
        const parsedOs = parseArrayField(flow.filter_os);
        const parsedBrowsers = parseArrayField(flow.filter_browsers);
        const parsedLangs = parseArrayField(flow.filter_langs);
        const parsedTimeZones = parseArrayField(flow.filter_time_zones);
        const parsedConnections = parseArrayField(flow.filter_connections);
        const parsedAllowedIps = parseStringArrayField(flow.allowed_ips);

        console.log('Parsed filter data:', {
          countries: parsedCountries,
          devices: parsedDevices,
          os: parsedOs,
          browsers: parsedBrowsers,
          langs: parsedLangs,
          timeZones: parsedTimeZones,
          connections: parsedConnections,
          allowedIps: parsedAllowedIps
        });
        setFormData({
          name: flow.name || '',
          url_white_page: flow.url_white_page || '',
          url_offer_page: flow.url_offer_page || '',
          mode_white_page: flow.mode_white_page || 'redirect',
          mode_offer_page: flow.mode_offer_page || 'redirect',
          status: flow.status || 'active',
          filter_countries: parsedCountries,
          filter_devices: parsedDevices,
          filter_os: parsedOs,
          filter_browsers: parsedBrowsers,
          filter_langs: parsedLangs,
          filter_time_zones: parsedTimeZones,
          filter_connections: parsedConnections,
          filter_cloaking_flag: Number(flow.filter_cloaking_flag) || 0,
          filter_vpn_proxy_flag: Number(flow.filter_vpn_proxy_flag) || 0,
          filter_ip_v6_flag: Number(flow.filter_ip_v6_flag) || 0,
          filter_referer_flag: Number(flow.filter_referer_flag) || 0,
          filter_isp_flag: Number(flow.filter_isp_flag) || 0,
          filter_black_ip_flag: Number(flow.filter_black_ip_flag) || 0,
          filter_ip_clicks_per_day: Number(flow.filter_ip_clicks_per_day) || 0,
          filter_clicks_before_filtering: Number(flow.filter_clicks_before_filtering) || 0,
          mode_list_country: Number(flow.mode_list_country) || 1,
          mode_list_device: Number(flow.mode_list_device) || 1,
          mode_list_os: Number(flow.mode_list_os) || 1,
          mode_list_browser: Number(flow.mode_list_browser) || 1,
          mode_list_lang: Number(flow.mode_list_lang) || 1,
          mode_list_time_zone: Number(flow.mode_list_time_zone) || 1,
          mode_list_connection: Number(flow.mode_list_connection) || 1,
          filter_id: Number(flow.filter_id) || 0,
          allowed_ips: parsedAllowedIps
        });
        
        console.log('Final form data set:', {
          filter_countries: parsedCountries,
          filter_devices: parsedDevices,
          filter_os: parsedOs,
          filter_browsers: parsedBrowsers,
          filter_cloaking_flag: Number(flow.filter_cloaking_flag) || 0,
          filter_vpn_proxy_flag: Number(flow.filter_vpn_proxy_flag) || 0,
          filter_ip_v6_flag: Number(flow.filter_ip_v6_flag) || 0,
          filter_referer_flag: Number(flow.filter_referer_flag) || 0,
          filter_isp_flag: Number(flow.filter_isp_flag) || 0,
          filter_black_ip_flag: Number(flow.filter_black_ip_flag) || 0
        });
      } else {
        setError(response.message || '获取流程信息失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoadingFlow(false);
    }
  };

  // 与CreateFlow完全相同的事件处理函数
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 1 : 0
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMultiSelectChange = (name: string, values: number[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: values
    }));
  };

  const handleAllowedIpsChange = (value: string) => {
    const ips = value.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    setFormData(prev => ({
      ...prev,
      allowed_ips: ips
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // 验证必填字段 - 与CreateFlow完全相同
    if (formData.filter_countries.length === 0) {
      setError('请至少选择一个国家');
      setIsLoading(false);
      return;
    }
    if (formData.filter_devices.length === 0) {
      setError('请至少选择一个设备类型');
      setIsLoading(false);
      return;
    }
    if (formData.filter_os.length === 0) {
      setError('请至少选择一个操作系统');
      setIsLoading(false);
      return;
    }
    if (formData.filter_browsers.length === 0) {
      setError('请至少选择一个浏览器');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Submitting form data:', formData);
      
      const response = await apiService.updateFlow(parseInt(id!), formData);
      
      if (response.success) {
        setSuccess('流程更新成功！');
        setTimeout(() => {
          navigate('/admin/flows');
        }, 2000);
      } else {
        setError(response.message || '更新流程失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingFlow) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-500">加载流程信息中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/flows')}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑流程</h1>
            <p className="text-gray-600 mt-1">修改斗篷流程配置</p>
          </div>
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

      {/* Form - 与CreateFlow完全相同的结构 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                流程名称 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                minLength={3}
                maxLength={32}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="输入流程名称"
              />
            </div>
          </div>
        </div>

        {/* URLs */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">页面配置</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                白页面URL *
              </label>
              <input
                type="url"
                name="url_white_page"
                value={formData.url_white_page}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                落地页URL *
              </label>
              <input
                type="url"
                name="url_offer_page"
                value={formData.url_offer_page}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://offer.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  白页面显示模式 *
                </label>
                <select
                  name="mode_white_page"
                  value={formData.mode_white_page}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="loading">Loading</option>
                  <option value="redirect">Redirect</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  落地页显示模式 *
                </label>
                <select
                  name="mode_offer_page"
                  value={formData.mode_offer_page}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="loading">Loading</option>
                  <option value="redirect">Redirect</option>
                  <option value="iframe">Iframe</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">流程状态</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前状态 *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="active">活跃</option>
              <option value="pause">暂停</option>
            </select>
          </div>
        </div>

        {/* Filtering Options - 与CreateFlow完全相同 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">过滤设置</h3>
          
          {/* Filter Toggles */}
          <div className="space-y-4 mb-8">
            <h4 className="text-md font-medium text-gray-800 mb-4">过滤开关</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleSwitch
                label="机器人过滤"
                description="过滤机器人和爬虫访问"
                checked={formData.filter_cloaking_flag === 1}
                onChange={(checked) => setFormData(prev => ({ ...prev, filter_cloaking_flag: checked ? 1 : 0 }))}
              />
              <ToggleSwitch
                label="VPN/代理过滤"
                description="过滤VPN和代理服务器访问"
                checked={formData.filter_vpn_proxy_flag === 1}
                onChange={(checked) => setFormData(prev => ({ ...prev, filter_vpn_proxy_flag: checked ? 1 : 0 }))}
              />
              <ToggleSwitch
                label="IPv6过滤"
                description="过滤IPv6地址访问"
                checked={formData.filter_ip_v6_flag === 1}
                onChange={(checked) => setFormData(prev => ({ ...prev, filter_ip_v6_flag: checked ? 1 : 0 }))}
              />
              <ToggleSwitch
                label="来源过滤"
                description="过滤无效的来源页面"
                checked={formData.filter_referer_flag === 1}
                onChange={(checked) => setFormData(prev => ({ ...prev, filter_referer_flag: checked ? 1 : 0 }))}
              />
              <ToggleSwitch
                label="ISP过滤"
                description="过滤特定ISP提供商"
                checked={formData.filter_isp_flag === 1}
                onChange={(checked) => setFormData(prev => ({ ...prev, filter_isp_flag: checked ? 1 : 0 }))}
              />
              <ToggleSwitch
                label="IP黑名单过滤"
                description="过滤黑名单IP地址"
                checked={formData.filter_black_ip_flag === 1}
                onChange={(checked) => setFormData(prev => ({ ...prev, filter_black_ip_flag: checked ? 1 : 0 }))}
              />
            </div>
          </div>

          {/* Required Filter Lists */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-800 mb-4">必填过滤列表</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedMultiSelect
                label="国家列表"
                options={countries}
                selectedValues={formData.filter_countries}
                onChange={(values) => handleMultiSelectChange('filter_countries', values)}
                placeholder="选择国家..."
                loading={loadingFilters.countries}
                required={true}
              />

              <EnhancedMultiSelect
                label="设备列表"
                options={devices}
                selectedValues={formData.filter_devices}
                onChange={(values) => handleMultiSelectChange('filter_devices', values)}
                placeholder="选择设备..."
                loading={loadingFilters.devices}
                required={true}
              />

              <EnhancedMultiSelect
                label="操作系统列表"
                options={operatingSystems}
                selectedValues={formData.filter_os}
                onChange={(values) => handleMultiSelectChange('filter_os', values)}
                placeholder="选择操作系统..."
                loading={loadingFilters.os}
                required={true}
              />

              <EnhancedMultiSelect
                label="浏览器列表"
                options={browsers}
                selectedValues={formData.filter_browsers}
                onChange={(values) => handleMultiSelectChange('filter_browsers', values)}
                placeholder="选择浏览器..."
                loading={loadingFilters.browsers}
                required={true}
              />
            </div>
          </div>

          {/* Optional Filter Lists */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-800 mb-4">可选过滤列表</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EnhancedMultiSelect
                label="语言列表"
                options={languages}
                selectedValues={formData.filter_langs}
                onChange={(values) => handleMultiSelectChange('filter_langs', values)}
                placeholder="选择语言..."
                loading={loadingFilters.languages}
                required={false}
              />

              <EnhancedMultiSelect
                label="时区列表"
                options={timezones}
                selectedValues={formData.filter_time_zones}
                onChange={(values) => handleMultiSelectChange('filter_time_zones', values)}
                placeholder="选择时区..."
                loading={loadingFilters.timezones}
                required={false}
              />

              <EnhancedMultiSelect
                label="连接类型列表"
                options={connections}
                selectedValues={formData.filter_connections}
                onChange={(values) => handleMultiSelectChange('filter_connections', values)}
                placeholder="选择连接类型..."
                loading={loadingFilters.connections}
                required={false}
              />
            </div>
          </div>

          {/* Filter Mode Settings */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-800 mb-4">过滤模式设置</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  国家过滤模式
                </label>
                <select
                  name="mode_list_country"
                  value={formData.mode_list_country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>允许</option>
                  <option value={0}>阻止</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  设备过滤模式
                </label>
                <select
                  name="mode_list_device"
                  value={formData.mode_list_device}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>允许</option>
                  <option value={0}>阻止</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作系统过滤模式
                </label>
                <select
                  name="mode_list_os"
                  value={formData.mode_list_os}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>允许</option>
                  <option value={0}>阻止</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  浏览器过滤模式
                </label>
                <select
                  name="mode_list_browser"
                  value={formData.mode_list_browser}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>允许</option>
                  <option value={0}>阻止</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语言过滤模式
                </label>
                <select
                  name="mode_list_lang"
                  value={formData.mode_list_lang}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>允许</option>
                  <option value={0}>阻止</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时区过滤模式
                </label>
                <select
                  name="mode_list_time_zone"
                  value={formData.mode_list_time_zone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>允许</option>
                  <option value={0}>阻止</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  连接类型过滤模式
                </label>
                <select
                  name="mode_list_connection"
                  value={formData.mode_list_connection}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>允许</option>
                  <option value={0}>阻止</option>
                </select>
              </div>
            </div>
          </div>

          {/* Numeric Filters */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">数值限制</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每IP每日最大点击数
                </label>
                <input
                  type="number"
                  name="filter_ip_clicks_per_day"
                  value={formData.filter_ip_clicks_per_day}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  过滤前点击数
                </label>
                <input
                  type="number"
                  name="filter_clicks_before_filtering"
                  value={formData.filter_clicks_before_filtering}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">高级设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                允许的IP地址 (逗号分隔)
              </label>
              <input
                type="text"
                value={formData.allowed_ips.join(', ')}
                onChange={(e) => handleAllowedIpsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="192.168.1.1, 10.0.0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                过滤器列表ID
              </label>
              <input
                type="number"
                name="filter_id"
                value={formData.filter_id}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/flows')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>取消</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isLoading ? '更新中...' : '更新流程'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFlow;