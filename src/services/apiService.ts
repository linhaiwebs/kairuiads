const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  console.log('Auth token:', token ? 'Present' : 'Missing');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
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
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(status && { status }),
      ...(search && { search })
    });

    const response = await fetch(`${API_BASE_URL}/flows?${params}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async createFlow(flowData: any) {
    const response = await fetch(`${API_BASE_URL}/flows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(flowData),
    });

    const data = await response.json();
    return data;
  },

  async getFlowDetails(flowId: number) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async updateFlow(flowId: number, flowData: any) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(flowData),
    });

    const data = await response.json();
    return data;
  },

  async deleteFlow(flowId: number) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async restoreFlow(flowId: number) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async activateFlow(flowId: number) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async pauseFlow(flowId: number) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/pause`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async downloadFlowIntegration(flowId: number) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/download`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async createFlowLink(flowId: number, domainId: number) {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/link`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ domain_id: domainId }),
    });

    const data = await response.json();
    return data;
  },

  async getDashboardData() {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  // Filter data endpoints
  async getCountries() {
    console.log('🔍 Frontend: Starting getCountries request...');
    console.log('🔍 Frontend: Request URL:', `${API_BASE_URL}/countries`);
    console.log('🔍 Frontend: Request headers:', getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/countries`, {
      headers: getAuthHeaders(),
    });
    
    console.log('🔍 Frontend: Response status:', response.status);
    console.log('🔍 Frontend: Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('🔍 Frontend: Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Raw response text:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('🔍 Frontend: Parsed JSON data:', data);
      return data;
    } catch (parseError) {
      console.error('🔍 Frontend: JSON parse error:', parseError);
      console.error('🔍 Frontend: Response was not JSON:', responseText);
      throw new Error(`JSON parse failed: ${parseError.message}. Response: ${responseText.substring(0, 200)}`);
    }
  },

  async getDevices() {
    console.log('🔍 Frontend: Starting getDevices request...');
    const response = await fetch(`${API_BASE_URL}/devices`, {
      headers: getAuthHeaders(),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Devices raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: Devices JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
  },

  async getOperatingSystems() {
    console.log('🔍 Frontend: Starting getOperatingSystems request...');
    const response = await fetch(`${API_BASE_URL}/operating_systems`, {
      headers: getAuthHeaders(),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: OS raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: OS JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
  },

  async getBrowsers() {
    console.log('🔍 Frontend: Starting getBrowsers request...');
    const response = await fetch(`${API_BASE_URL}/browsers`, {
      headers: getAuthHeaders(),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Browsers raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: Browsers JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
  },

  async getLanguages() {
    console.log('🔍 Frontend: Starting getLanguages request...');
    const response = await fetch(`${API_BASE_URL}/languages`, {
      headers: getAuthHeaders(),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Languages raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: Languages JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
  },

  async getTimezones() {
    console.log('🔍 Frontend: Starting getTimezones request...');
    const response = await fetch(`${API_BASE_URL}/time_zones`, {
      headers: getAuthHeaders(),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Timezones raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: Timezones JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
  },

  async getConnections() {
    console.log('🔍 Frontend: Starting getConnections request...');
    const response = await fetch(`${API_BASE_URL}/connection_types`, {
      headers: getAuthHeaders(),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Connections raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: Connections JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
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
    console.log('🔍 Frontend: Starting getStatistics request...', params);
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Statistics raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: Statistics JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
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
    console.log('🔍 Frontend: Starting getClicks request...', params);
    const response = await fetch(`${API_BASE_URL}/clicks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    
    const responseText = await response.text();
    console.log('🔍 Frontend: Clicks raw response:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('🔍 Frontend: Clicks JSON parse error:', parseError);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }
  },

  // Account management endpoints
  async getAccounts(page = 1, perPage = 10, search = '', status = '', categoryId = '') {
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

    const data = await response.json();
    return data;
  },

  async getAccount(accountId: number) {
    const response = await fetch(`${API_BASE_URL}/admin/accounts/${accountId}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async createAccount(accountData: any) {
    const response = await fetch(`${API_BASE_URL}/admin/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData),
    });

    const data = await response.json();
    return data;
  },

  async updateAccount(accountId: number, accountData: any) {
    const response = await fetch(`${API_BASE_URL}/admin/accounts/${accountId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData),
    });

    const data = await response.json();
    return data;
  },

  async deleteAccount(accountId: number) {
    const response = await fetch(`${API_BASE_URL}/admin/accounts/${accountId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  // Category management endpoints
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async createCategory(categoryData: any) {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    const data = await response.json();
    return data;
  },

  async updateCategory(categoryId: number, categoryData: any) {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    const data = await response.json();
    return data;
  },

  async deleteCategory(categoryId: number) {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async getFilters(page = 1, perPage = 10, status = '', listType = '', search = '', dateRanges = '') {
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

    const data = await response.json();
    return data;
  },

  async createFilter(filterData: any) {
    const response = await fetch(`${API_BASE_URL}/filters`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(filterData),
    });

    const data = await response.json();
    return data;
  },

  async getFilterDetails(filterId: number) {
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async updateFilter(filterId: number, filterData: any) {
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(filterData),
    });

    const data = await response.json();
    return data;
  },

  async deleteFilter(filterId: number) {
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  async restoreFilter(filterId: number) {
    const response = await fetch(`${API_BASE_URL}/filters/${filterId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  },

  // Conversion management endpoints
  async deleteConversion(conversionId: number) {
    const response = await fetch(`${API_BASE_URL}/conversions/${conversionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  }
};