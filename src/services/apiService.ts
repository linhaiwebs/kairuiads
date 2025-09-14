const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  console.log('🔍 [apiService] Auth token:', token ? 'Present' : 'Missing');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// 通用的响应处理函数
const handleResponse = async (response: Response, endpoint: string) => {
  console.log(`🔍 [apiService] Response for ${endpoint}:`, {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  });

  if (!response.ok) {
    console.error(`🔍 [apiService] HTTP Error for ${endpoint}:`, response.status, response.statusText);
    
    // 如果是认证错误，记录但不自动登出（根据您的需求）
    if (response.status === 401 || response.status === 403) {
      console.warn(`🔍 [apiService] Authentication error for ${endpoint}, but not logging out as requested`);
    }
  }

  const responseText = await response.text();
  console.log(`🔍 [apiService] Raw response text for ${endpoint}:`, responseText.substring(0, 200) + '...');
  
  try {
    const data = JSON.parse(responseText);
    console.log(`🔍 [apiService] Parsed response for ${endpoint}:`, data);
    return data;
  } catch (parseError) {
    console.error(`🔍 [apiService] JSON parse error for ${endpoint}:`, parseError);
    throw new Error(`JSON parse failed for ${endpoint}: ${parseError.message}`);
  }
};

const getCloakingApiKey = () => {
  const apiKey = import.meta.env.VITE_CLOAKING_API_KEY;
  if (!apiKey) {
    console.error('VITE_CLOAKING_API_KEY not found in environment variables');
    return 'YOUR_API_KEY_HERE';
  }
  return apiKey;
};

export const apiService = {
  async getFlows(page = 1, perPage = 10, status = '', search = '') {
    console.log('🔍 [apiService] getFlows called with params:', { page, perPage, status, search });
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(status && { status }),
      ...(search && { search })
    });

    const response = await fetch(`${API_BASE_URL}/flows?${params}`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getFlows');
  },

  async createFlow(flowData: any) {
    console.log('🔍 [apiService] createFlow called with data:', flowData);
    const response = await fetch(`${API_BASE_URL}/flows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(flowData),
    });

    return await handleResponse(response, 'createFlow');
  },

  async getFlowDetails(flowId: number) {
    console.log('🔍 [apiService] getFlowDetails called for ID:', flowId);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getFlowDetails');
  },

  async updateFlow(flowId: number, flowData: any) {
    console.log('🔍 [apiService] updateFlow called for ID:', flowId, 'with data:', flowData);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(flowData),
    });

    return await handleResponse(response, 'updateFlow');
  },

  async deleteFlow(flowId: number) {
    console.log('🔍 [apiService] deleteFlow called for ID:', flowId);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'deleteFlow');
  },

  async restoreFlow(flowId: number) {
    console.log('🔍 [apiService] restoreFlow called for ID:', flowId);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'restoreFlow');
  },

  async activateFlow(flowId: number) {
    console.log('🔍 [apiService] activateFlow called for ID:', flowId);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'activateFlow');
  },

  async pauseFlow(flowId: number) {
    console.log('🔍 [apiService] pauseFlow called for ID:', flowId);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/pause`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'pauseFlow');
  },

  async downloadFlowIntegration(flowId: number) {
    console.log('🔍 [apiService] downloadFlowIntegration called for ID:', flowId);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/download`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'downloadFlowIntegration');
  },

  async createFlowLink(flowId: number, domainId: number) {
    console.log('🔍 [apiService] createFlowLink called for flow ID:', flowId, 'domain ID:', domainId);
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/link`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ domain_id: domainId }),
    });

    return await handleResponse(response, 'createFlowLink');
  },

  async getDashboardData() {
    console.log('🔍 [apiService] getDashboardData called');
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getDashboardData');
  },

  async getUsers() {
    console.log('🔍 [apiService] getUsers called');
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getUsers');
  },

  // Filter data endpoints
  async getCountries() {
    console.log('🔍 [apiService] getCountries called');
    
    const response = await fetch(`${API_BASE_URL}/countries`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response, 'getCountries');
  },

  async getDevices() {
    console.log('🔍 [apiService] getDevices called');
    const response = await fetch(`${API_BASE_URL}/devices`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response, 'getDevices');
  },

  async getOperatingSystems() {
    console.log('🔍 [apiService] getOperatingSystems called');
    const response = await fetch(`${API_BASE_URL}/operating_systems`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response, 'getOperatingSystems');
  },

  async getBrowsers() {
    console.log('🔍 [apiService] getBrowsers called');
    const response = await fetch(`${API_BASE_URL}/browsers`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response, 'getBrowsers');
  },

  async getLanguages() {
    console.log('🔍 [apiService] getLanguages called');
    const response = await fetch(`${API_BASE_URL}/languages`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response, 'getLanguages');
  },

  async getTimezones() {
    console.log('🔍 [apiService] getTimezones called');
    const response = await fetch(`${API_BASE_URL}/time_zones`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response, 'getTimezones');
  },

  async getConnections() {
    console.log('🔍 [apiService] getConnections called');
    const response = await fetch(`${API_BASE_URL}/connection_types`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response, 'getConnections');
  },

  async getStatistics(params: {
    group_by: string;
    date_ranges?: string;
    filter_countries?: number[];
    filter_flows?: number[];
    filter_devices?: number[];
    filter_os?: number[];
    filter_browsers?: number[];
    filter_langs?: number[];
  }) {
    console.log('🔍 [apiService] getStatistics called with params:', params);
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    
    return await handleResponse(response, 'getStatistics');
  },

  async getClicks(params: {
    page?: number;
    per_page?: number;
    date_ranges?: string;
    filter_countries?: number[];
    filter_flows?: number[];
    filter_devices?: number[];
    filter_os?: number[];
    filter_browsers?: number[];
    filter_langs?: number[];
    filter_filters?: string[];
    filter_pages?: string[];
  }) {
    console.log('🔍 [apiService] getClicks called with params:', params);
    const response = await fetch(`${API_BASE_URL}/clicks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    
    return await handleResponse(response, 'getClicks');
  },

  // Account management endpoints
  async getAccounts(page = 1, perPage = 10, search = '', status = '', categoryId = '') {
    console.log('🔍 [apiService] getAccounts called with params:', { page, perPage, search, status, categoryId });
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(categoryId && { category_id: categoryId })
    });

    const response = await fetch(`${API_BASE_URL}/admin/accounts?${params}`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getAccounts');
  },

  async getAccount(accountId: number) {
    console.log('🔍 [apiService] getAccount called for ID:', accountId);
    const response = await fetch(`${API_BASE_URL}/admin/accounts/${accountId}`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getAccount');
  },

  async createAccount(accountData: any) {
    console.log('🔍 [apiService] createAccount called with data:', accountData);
    const response = await fetch(`${API_BASE_URL}/admin/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData),
    });

    return await handleResponse(response, 'createAccount');
  },

  async updateAccount(accountId: number, accountData: any) {
    console.log('🔍 [apiService] updateAccount called for ID:', accountId, 'with data:', accountData);
    const response = await fetch(`${API_BASE_URL}/admin/accounts/${accountId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData),
    });

    return await handleResponse(response, 'updateAccount');
  },

  async deleteAccount(accountId: number) {
    console.log('🔍 [apiService] deleteAccount called for ID:', accountId);
    const response = await fetch(`${API_BASE_URL}/admin/accounts/${accountId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'deleteAccount');
  },

  // Category management endpoints
  async getCategories() {
    console.log('🔍 [apiService] getCategories called');
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getCategories');
  },

  async createCategory(categoryData: any) {
    console.log('🔍 [apiService] createCategory called with data:', categoryData);
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    return await handleResponse(response, 'createCategory');
  },

  async updateCategory(categoryId: number, categoryData: any) {
    console.log('🔍 [apiService] updateCategory called for ID:', categoryId, 'with data:', categoryData);
    const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    return await handleResponse(response, 'updateCategory');
  },

  async deleteCategory(categoryId: number) {
    console.log('🔍 [apiService] deleteCategory called for ID:', categoryId);
    const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'deleteCategory');
  },

  async getFilters(page = 1, perPage = 10, status = '', listType = '', search = '', dateRanges = '') {
    console.log('🔍 [apiService] getFilters called with params:', { page, perPage, status, listType, search, dateRanges });
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(status && { status }),
      ...(listType && { list_type: listType }),
      ...(search && { search }),
      ...(dateRanges && { date_ranges: dateRanges })
    });

    const response = await fetch(`${API_BASE_URL}/filters?${params}`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getFilters');
  },

  async createFilter(filterData: any) {
    console.log('🔍 [apiService] createFilter called with data:', filterData);
    const response = await fetch(`${API_BASE_URL}/filters`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(filterData),
    });

    return await handleResponse(response, 'createFilter');
  },

  async getFilterDetails(filterId: number) {
    console.log('🔍 [apiService] getFilterDetails called for ID:', filterId);
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}`, {
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'getFilterDetails');
  },

  async updateFilter(filterId: number, filterData: any) {
    console.log('🔍 [apiService] updateFilter called for ID:', filterId, 'with data:', filterData);
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(filterData),
    });

    return await handleResponse(response, 'updateFilter');
  },

  async deleteFilter(filterId: number) {
    console.log('🔍 [apiService] deleteFilter called for ID:', filterId);
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'deleteFilter');
  },

  async restoreFilter(filterId: number) {
    console.log('🔍 [apiService] restoreFilter called for ID:', filterId);
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'restoreFilter');
  },

  // Conversion management endpoints
  async deleteConversion(conversionId: number) {
    console.log('🔍 [apiService] deleteConversion called for ID:', conversionId);
    const response = await fetch(`${API_BASE_URL}/conversions/${conversionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, 'deleteConversion');
  },

  // File download with authentication
  async downloadFileBlob(url: string) {
    console.log('🔍 [apiService] downloadFileBlob called for URL:', url);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('未找到认证令牌，请重新登录');
    }
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 [apiService] Download failed:', response.status, response.statusText, errorText);
      
      if (response.status === 401) {
        throw new Error('认证失败，请重新登录');
      } else if (response.status === 404) {
        throw new Error('文件不存在或已被删除');
      } else {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }
    }

    return await response.blob();
  }
};