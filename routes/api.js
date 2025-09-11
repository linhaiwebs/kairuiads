import express from 'express';
import fetch from 'node-fetch';
import { authenticateToken } from '../middleware/auth.js';
import { getCache, setCache, warmupCache, startAutoRefresh } from '../config/cache.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// 启动缓存系统
let cacheInitialized = false;

// Helper function to make API requests to cloaking service
const makeApiRequest = async (endpoint, data, retries = 5) => {
  const apiBaseUrl = process.env.CLOAKING_API_BASE_URL || 'https://cloaking.house/api';
  const apiKey = process.env.API_KEY || process.env.CLOAKING_API_KEY;
  
  if (!apiKey) {
    console.error('🔍 Backend: API_KEY environment variable not found.');
    throw new Error('API key not configured');
  }

  const fullUrl = `${apiBaseUrl}${endpoint}`;
  console.log('Using API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'Missing');
  
  // Convert data to form-data format that matches PHP array structure
  const formData = new URLSearchParams();
  formData.append('api_key', apiKey);
  
  // Handle each field according to PHP format
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (Array.isArray(value)) {
      // For arrays, append each value with array notation like PHP
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item.toString());
      });
    } else {
      formData.append(key, value.toString());
    }
  });
  
  const requestBody = formData.toString();
  
  console.log('🔍 Backend: Request body:', requestBody);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Backend: API request attempt ${attempt}/${retries}`);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
        timeout: 30000 // 30 second timeout
      });

      console.log('🔍 Backend: Response status:', response.status);
      console.log('🔍 Backend: Response ok:', response.ok);
      console.log('🔍 Backend: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        
        // Retry on server errors (5xx) or timeout (408)
        if ((response.status >= 500 || response.status === 408) && attempt < retries) {
          console.log(`🔍 Backend: Server error ${response.status}, retrying in ${attempt * 2000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
        
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      console.log('🔍 Backend: Raw API response text:', responseText);
      
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('🔍 Backend: Parsed API response:', jsonResponse);
        return jsonResponse;
      } catch (parseError) {
        console.error('🔍 Backend: Failed to parse API response as JSON:', parseError);
        console.error('🔍 Backend: Response was:', responseText);
        throw new Error(`JSON parse failed: ${parseError.message}`);
      }
      
    } catch (networkError) {
      console.error(`🔍 Backend: Network error on attempt ${attempt}:`, networkError.message);
      
      // Retry on network errors (including socket hang up)
      if (attempt < retries && (
        networkError.code === 'ECONNRESET' ||
        networkError.code === 'ENOTFOUND' ||
        networkError.code === 'ETIMEDOUT' ||
        networkError.message.includes('socket hang up') ||
        networkError.message.includes('network timeout') ||
        networkError.message.includes('fetch failed')
      )) {
        console.log(`🔍 Backend: Network error, retrying in ${attempt * 2000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }
      
      // If it's the last attempt or not a retryable error, throw
      throw networkError;
    }
  }
};

// 初始化缓存系统
const initializeCache = async () => {
  if (!cacheInitialized) {
    console.log('📋 Initializing cache system...');
    
    // 预热缓存
    await warmupCache(makeApiRequest);
    
    // 启动自动刷新
    startAutoRefresh(makeApiRequest);
    
    cacheInitialized = true;
    console.log('📋 Cache system initialized');
  }
};

// 带缓存的API请求函数
const getCachedData = async (cacheKey, endpoint, fallbackData) => {
  // 检查缓存
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return {
      status: 'success',
      data: cachedData,
      msg: `Cached ${cacheKey} data`
    };
  }
  
  // 缓存未命中，尝试从API获取
  try {
    console.log(`📋 Cache miss, fetching from API: ${cacheKey}`);
    const apiData = await makeApiRequest(endpoint, {});
    
    if (apiData && apiData.data && apiData.data.length > 0) {
      // 缓存API数据
      setCache(cacheKey, apiData.data);
      return apiData;
    }
  } catch (error) {
    console.error(`📋 API request failed for ${cacheKey}:`, error);
  }
  
  // API失败，返回错误
  console.log(`📋 API failed for: ${cacheKey}, no fallback data`);
  
  return {
    status: 'error',
    data: [],
    msg: `Failed to fetch ${cacheKey} data`
  };
};

// Get flows
router.get('/flows', authenticateToken, async (req, res) => {
  try {
    const { page = 1, per_page = 10, status = '', search = '' } = req.query;

    const requestBody = {
      page: parseInt(page),
      per_page: parseInt(per_page)
    };

    if (status) requestBody.status = status;
    if (search) requestBody.search = search;

    const data = await makeApiRequest('/flows', requestBody);
    
    // Return the exact format from third-party API
    res.json({
      total: data.total || 0,
      success: data.status === 'success',
      data: data.data || [],
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error fetching flows:', error);
    res.status(500).json({
      success: false,
      message: '获取流程数据失败',
      error: error.message
    });
  }
});

// Get flow details
router.get('/flows/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const apiData = {
      flow_id: parseInt(id)
    };

    const data = await makeApiRequest('/flows/details', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error fetching flow details:', error);
    res.status(500).json({
      success: false,
      message: '获取流程详情失败',
      error: error.message
    });
  }
});

// Create flow
router.post('/flows', authenticateToken, async (req, res) => {
  try {
    console.log('Creating flow with data:', req.body);
    
    const formData = req.body;

    // 验证必填字段
    if (!formData.filter_countries || !Array.isArray(formData.filter_countries) || formData.filter_countries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Countries are required. Please provide at least one country to proceed.',
        error: 'Missing required field: filter_countries'
      });
    }
    
    if (!formData.filter_devices || !Array.isArray(formData.filter_devices) || formData.filter_devices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Devices are required. Please provide at least one device to proceed.',
        error: 'Missing required field: filter_devices'
      });
    }
    
    if (!formData.filter_os || !Array.isArray(formData.filter_os) || formData.filter_os.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Operating systems are required. Please provide at least one OS to proceed.',
        error: 'Missing required field: filter_os'
      });
    }
    
    if (!formData.filter_browsers || !Array.isArray(formData.filter_browsers) || formData.filter_browsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Browsers are required. Please provide at least one browser to proceed.',
        error: 'Missing required field: filter_browsers'
      });
    }
    // Prepare data for API request according to the exact specification
    const apiData = {
      name: formData.name,
      url_white_page: formData.url_white_page,
      url_offer_page: formData.url_offer_page,
      mode_white_page: formData.mode_white_page,
      mode_offer_page: formData.mode_offer_page,
      // Required arrays - ensure they are arrays even if empty
      filter_countries: formData.filter_countries,
      filter_devices: formData.filter_devices,
      filter_os: formData.filter_os,
      filter_browsers: formData.filter_browsers,
      // Optional arrays
      filter_langs: Array.isArray(formData.filter_langs) ? formData.filter_langs : [],
      filter_time_zones: Array.isArray(formData.filter_time_zones) ? formData.filter_time_zones : [],
      filter_connections: Array.isArray(formData.filter_connections) ? formData.filter_connections : [],
      // Required number flags - ensure they are numbers
      filter_cloaking_flag: Number(formData.filter_cloaking_flag) || 0,
      filter_vpn_proxy_flag: Number(formData.filter_vpn_proxy_flag) || 0,
      filter_ip_v6_flag: Number(formData.filter_ip_v6_flag) || 0,
      filter_referer_flag: Number(formData.filter_referer_flag) || 0,
      filter_isp_flag: Number(formData.filter_isp_flag) || 0,
      filter_black_ip_flag: Number(formData.filter_black_ip_flag) || 0,
      // Required number limits
      filter_ip_clicks_per_day: Number(formData.filter_ip_clicks_per_day) || 0,
      filter_clicks_before_filtering: Number(formData.filter_clicks_before_filtering) || 0,
      // Required mode settings
      mode_list_country: Number(formData.mode_list_country) || 1,
      mode_list_device: Number(formData.mode_list_device) || 1,
      mode_list_os: Number(formData.mode_list_os) || 1,
      mode_list_browser: Number(formData.mode_list_browser) || 1,
      mode_list_lang: Number(formData.mode_list_lang) || 1,
      mode_list_time_zone: Number(formData.mode_list_time_zone) || 1,
      mode_list_connection: Number(formData.mode_list_connection) || 1,
      // Required status parameter - missing in original code!
      status: formData.status || 'active',
      // Optional parameters
      filter_id: Number(formData.filter_id) || 0,
      allowed_ips: Array.isArray(formData.allowed_ips) ? formData.allowed_ips : []
    };

    console.log('Sending to API:', apiData);
    
    const data = await makeApiRequest('/flows/create', apiData);
    
    console.log('API response:', data);

    res.json({
      success: data.status === 'success',
      data: data.data || [],
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error creating flow:', error);
    res.status(500).json({
      success: false,
      message: '创建流程失败',
      error: error.message
    });
  }
});

// Update flow
router.put('/flows/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating flow with data:', req.body);
    
    const formData = req.body;

    // 验证必填字段
    if (!formData.filter_countries || !Array.isArray(formData.filter_countries) || formData.filter_countries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Countries are required. Please provide at least one country to proceed.',
        error: 'Missing required field: filter_countries'
      });
    }
    
    if (!formData.filter_devices || !Array.isArray(formData.filter_devices) || formData.filter_devices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Devices are required. Please provide at least one device to proceed.',
        error: 'Missing required field: filter_devices'
      });
    }
    
    if (!formData.filter_os || !Array.isArray(formData.filter_os) || formData.filter_os.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Operating systems are required. Please provide at least one OS to proceed.',
        error: 'Missing required field: filter_os'
      });
    }
    
    if (!formData.filter_browsers || !Array.isArray(formData.filter_browsers) || formData.filter_browsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Browsers are required. Please provide at least one browser to proceed.',
        error: 'Missing required field: filter_browsers'
      });
    }
    // Prepare data for API request according to the specification
    const apiData = {
      flow_id: parseInt(id),
      name: formData.name,
      url_white_page: formData.url_white_page,
      url_offer_page: formData.url_offer_page,
      mode_white_page: formData.mode_white_page,
      mode_offer_page: formData.mode_offer_page,
      status: formData.status || 'active',
      filter_countries: formData.filter_countries || [],
      filter_devices: formData.filter_devices || [],
      filter_os: formData.filter_os || [],
      filter_browsers: formData.filter_browsers || [],
      filter_langs: formData.filter_langs || [],
      filter_time_zones: formData.filter_time_zones || [],
      filter_connections: formData.filter_connections || [],
      filter_cloaking_flag: parseInt(formData.filter_cloaking_flag) || 0,
      filter_vpn_proxy_flag: parseInt(formData.filter_vpn_proxy_flag) || 0,
      filter_ip_v6_flag: parseInt(formData.filter_ip_v6_flag) || 0,
      filter_referer_flag: parseInt(formData.filter_referer_flag) || 0,
      filter_isp_flag: parseInt(formData.filter_isp_flag) || 0,
      filter_black_ip_flag: parseInt(formData.filter_black_ip_flag) || 0,
      filter_ip_clicks_per_day: parseInt(formData.filter_ip_clicks_per_day) || 0,
      filter_clicks_before_filtering: parseInt(formData.filter_clicks_before_filtering) || 0,
      mode_list_country: parseInt(formData.mode_list_country) || 1,
      mode_list_device: parseInt(formData.mode_list_device) || 1,
      mode_list_os: parseInt(formData.mode_list_os) || 1,
      mode_list_browser: parseInt(formData.mode_list_browser) || 1,
      mode_list_lang: parseInt(formData.mode_list_lang) || 1,
      mode_list_time_zone: parseInt(formData.mode_list_time_zone) || 1,
      mode_list_connection: parseInt(formData.mode_list_connection) || 1,
      filter_id: parseInt(formData.filter_id) || 0,
      allowed_ips: formData.allowed_ips || []
    };

    console.log('Sending to API:', apiData);
    
    const data = await makeApiRequest('/flows/update', apiData);
    
    console.log('API response:', data);

    res.json({
      success: data.status === 'success',
      data: data.data || [],
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error updating flow:', error);
    res.status(500).json({
      success: false,
      message: '更新流程失败',
      error: error.message
    });
  }
});

// Delete flow
router.delete('/flows/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'flow_id is required'
      });
    }
    
    const apiData = {
      flow_id: parseInt(id)
    };

    const data = await makeApiRequest('/flows/delete', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error deleting flow:', error);
    res.status(500).json({
      success: false,
      message: '删除流程失败',
      error: error.message
    });
  }
});

// Restore flow
router.post('/flows/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'flow_id is required'
      });
    }
    
    const apiData = {
      flow_id: parseInt(id)
    };

    const data = await makeApiRequest('/flows/restore', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error restoring flow:', error);
    res.status(500).json({
      success: false,
      message: '恢复流程失败',
      error: error.message
    });
  }
});

// Activate flow
router.post('/flows/:id/activate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'flow_id is required'
      });
    }
    
    const apiData = {
      flow_id: parseInt(id)
    };

    const data = await makeApiRequest('/flows/activate', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error activating flow:', error);
    res.status(500).json({
      success: false,
      message: '激活流程失败',
      error: error.message
    });
  }
});

// Pause flow
router.post('/flows/:id/pause', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'flow_id is required'
      });
    }
    
    const apiData = {
      flow_id: parseInt(id)
    };

    const data = await makeApiRequest('/flows/pause', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error pausing flow:', error);
    res.status(500).json({
      success: false,
      message: '暂停流程失败',
      error: error.message
    });
  }
});

// Download flow integration
router.post('/flows/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'flow_id is required'
      });
    }
    
    const apiData = {
      flow_id: parseInt(id)
    };

    const data = await makeApiRequest('/flows/download', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error downloading flow integration:', error);
    res.status(500).json({
      success: false,
      message: '下载集成文件失败',
      error: error.message
    });
  }
});

// Get statistics
router.post('/statistics', authenticateToken, async (req, res) => {
  try {
    console.log('Statistics request body:', req.body);
    
    const {
      group_by,
      date_ranges,
      filter_countries = [],
      filter_flows = [],
      filter_devices = [],
      filter_os = [],
      filter_browsers = [],
      filter_langs = []
    } = req.body;

    // Validate required parameters
    if (!group_by) {
      return res.status(400).json({
        success: false,
        message: 'group_by parameter is required'
      });
    }

    // Prepare data for API request
    const apiData = {
      group_by,
      ...(date_ranges && { date_ranges }),
      ...(filter_countries.length > 0 && { filter_countries }),
      ...(filter_flows.length > 0 && { filter_flows }),
      ...(filter_devices.length > 0 && { filter_devices }),
      ...(filter_os.length > 0 && { filter_os }),
      ...(filter_browsers.length > 0 && { filter_browsers }),
      ...(filter_langs.length > 0 && { filter_langs })
    };

    console.log('Sending statistics request to API:', apiData);
    
    const data = await makeApiRequest('/statistics', apiData);
    
    console.log('Statistics API response:', data);

    res.json({
      success: data.status === 'success',
      data: data.data || [],
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

// Get clicks data
router.post('/clicks', authenticateToken, async (req, res) => {
  try {
    console.log('Clicks request body:', req.body);
    
    const {
      page = 1,
      per_page = 10,
      date_ranges,
      filter_countries = [],
      filter_flows = [],
      filter_devices = [],
      filter_os = [],
      filter_browsers = [],
      filter_langs = [],
      filter_filters = [],
      filter_pages = []
    } = req.body;

    // Prepare data for API request
    const apiData = {
      page: parseInt(page),
      per_page: parseInt(per_page),
      ...(date_ranges && { date_ranges }),
      ...(filter_countries.length > 0 && { filter_countries }),
      ...(filter_flows.length > 0 && { filter_flows }),
      ...(filter_devices.length > 0 && { filter_devices }),
      ...(filter_os.length > 0 && { filter_os }),
      ...(filter_browsers.length > 0 && { filter_browsers }),
      ...(filter_langs.length > 0 && { filter_langs }),
      ...(filter_filters.length > 0 && { filter_filters }),
      ...(filter_pages.length > 0 && { filter_pages })
    };

    console.log('Sending clicks request to API:', apiData);
    
    const data = await makeApiRequest('/clicks', apiData);
    
    console.log('Clicks API response:', data);

    res.json({
      success: data.status === 'success',
      data: data.data || [],
      total: data.total || 0,
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error fetching clicks:', error);
    res.status(500).json({
      success: false,
      message: '获取点击数据失败',
      error: error.message
    });
  }
});

// Proxy routes for filter data
router.get('/countries', authenticateToken, async (req, res) => {
  try {
    // 初始化缓存系统
    await initializeCache();
    
    const data = await getCachedData('countries', '/countries', []);
    
    res.json({
      success: data.status === 'success',
      ...data
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      message: '获取国家数据失败',
      error: error.message
    });
  }
});

router.get('/devices', authenticateToken, async (req, res) => {
  try {
    await initializeCache();
    
    const data = await getCachedData('devices', '/devices', []);
    
    res.json({
      success: data.status === 'success',
      ...data
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: '获取设备数据失败',
      error: error.message
    });
  }
});

router.get('/operating_systems', authenticateToken, async (req, res) => {
  try {
    await initializeCache();
    
    const data = await getCachedData('operating_systems', '/operating_systems', []);
    
    res.json({
      success: data.status === 'success',
      ...data
    });
  } catch (error) {
    console.error('Error fetching operating systems:', error);
    res.status(500).json({
      success: false,
      message: '获取操作系统数据失败',
      error: error.message
    });
  }
});

router.get('/browsers', authenticateToken, async (req, res) => {
  try {
    await initializeCache();
    
    const data = await getCachedData('browsers', '/browsers', []);
    
    res.json({
      success: data.status === 'success',
      ...data
    });
  } catch (error) {
    console.error('Error fetching browsers:', error);
    res.status(500).json({
      success: false,
      message: '获取浏览器数据失败',
      error: error.message
    });
  }
});

router.get('/languages', authenticateToken, async (req, res) => {
  try {
    await initializeCache();
    
    const data = await getCachedData('languages', '/languages', []);
    
    res.json({
      success: data.status === 'success',
      ...data
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      success: false,
      message: '获取语言数据失败',
      error: error.message
    });
  }
});

router.get('/time_zones', authenticateToken, async (req, res) => {
  try {
    await initializeCache();
    
    const data = await getCachedData('time_zones', '/time_zones', []);
    
    res.json({
      success: data.status === 'success',
      ...data
    });
  } catch (error) {
    console.error('Error fetching time zones:', error);
    res.status(500).json({
      success: false,
      message: '获取时区数据失败',
      error: error.message
    });
  }
});

router.get('/connection_types', authenticateToken, async (req, res) => {
  try {
    await initializeCache();
    
    const data = await getCachedData('connection_types', '/connection_types', []);
    
    res.json({
      success: data.status === 'success',
      ...data
    });
  } catch (error) {
    console.error('Error fetching connection types:', error);
    res.status(500).json({
      success: false,
      message: '获取连接类型数据失败',
      error: error.message
    });
  }
});

// 缓存管理路由
router.get('/cache/stats', authenticateToken, async (req, res) => {
  try {
    const { getCacheStats } = await import('../config/cache.js');
    const stats = getCacheStats();
    res.json({
      success: true,
      data: stats,
      message: 'Cache statistics'
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

router.post('/cache/clear', authenticateToken, async (req, res) => {
  try {
    const { clearAllCache } = await import('../config/cache.js');
    clearAllCache();
    res.json({
      success: true,
      message: 'All cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

router.post('/cache/refresh', authenticateToken, async (req, res) => {
  try {
    const { warmupCache } = await import('../config/cache.js');
    await warmupCache(makeApiRequest);
    res.json({
      success: true,
      message: 'Cache refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh cache'
    });
  }
});

// Filter management routes

// Get filters
router.get('/filters', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      per_page = 10, 
      status = '', 
      list_type = '', 
      search = '',
      date_ranges = ''
    } = req.query;

    const requestBody = {
      page: parseInt(page),
      per_page: parseInt(per_page)
    };

    if (status) requestBody.status = status;
    if (list_type) requestBody.list_type = list_type;
    if (search) requestBody.search = search;
    if (date_ranges) requestBody.date_ranges = date_ranges;

    const data = await makeApiRequest('/filters', requestBody);
    
    res.json({
      total: data.total || 0,
      success: data.status === 'success',
      data: data.data || [],
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({
      success: false,
      message: '获取过滤器列表失败',
      error: error.message
    });
  }
});

// Create filter
router.post('/filters', authenticateToken, async (req, res) => {
  try {
    console.log('Creating filter with data:', req.body);
    
    const formData = req.body;

    const apiData = {
      name: formData.name,
      list_type: formData.list_type,
      list_ips: formData.list_ips || [],
      list_agents: formData.list_agents || [],
      list_providers: formData.list_providers || [],
      list_referers: formData.list_referers || []
    };

    console.log('Sending to API:', apiData);
    
    const data = await makeApiRequest('/filters/create', apiData);
    
    console.log('API response:', data);

    res.json({
      success: data.status === 'success',
      data: data.data || [],
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error creating filter:', error);
    res.status(500).json({
      success: false,
      message: '创建过滤器失败',
      error: error.message
    });
  }
});

// Update filter
router.put('/filters/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating filter with data:', req.body);
    
    const formData = req.body;

    const apiData = {
      filter_id: parseInt(id),
      name: formData.name,
      list_ips: formData.list_ips || [],
      list_agents: formData.list_agents || [],
      list_providers: formData.list_providers || [],
      list_referers: formData.list_referers || []
    };

    console.log('Sending to API:', apiData);
    
    const data = await makeApiRequest('/filters/update', apiData);
    
    console.log('API response:', data);

    res.json({
      success: data.status === 'success',
      data: data.data || [],
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error updating filter:', error);
    res.status(500).json({
      success: false,
      message: '更新过滤器失败',
      error: error.message
    });
  }
});

// Get filter details
router.get('/filters/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const apiData = {
      filter_id: parseInt(id)
    };

    const data = await makeApiRequest('/filters/details', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error fetching filter details:', error);
    res.status(500).json({
      success: false,
      message: '获取过滤器详情失败',
      error: error.message
    });
  }
});

// Delete filter
router.delete('/filters/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const apiData = {
      filter_id: parseInt(id)
    };

    const data = await makeApiRequest('/filters/delete', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error deleting filter:', error);
    res.status(500).json({
      success: false,
      message: '删除过滤器失败',
      error: error.message
    });
  }
});

// Restore filter
router.post('/filters/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const apiData = {
      filter_id: parseInt(id)
    };

    const data = await makeApiRequest('/filters/restore', apiData);
    
    res.json({
      success: data.status === 'success',
      data: data.data || {},
      message: data.msg || 'Success',
      status: data.status,
      code: data.code
    });

  } catch (error) {
    console.error('Error restoring filter:', error);
    res.status(500).json({
      success: false,
      message: '恢复过滤器失败',
      error: error.message
    });
  }
});

export default router;