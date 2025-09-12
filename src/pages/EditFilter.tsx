import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { ArrowLeft, Save, X, Filter, List, Globe, Smartphone } from 'lucide-react';

interface FilterFormData {
  name: string;
  list_ips: string[];
  list_agents: string[];
  list_providers: string[];
  list_referers: string[];
}

const EditFilter: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFilter, setLoadingFilter] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FilterFormData>({
    name: '',
    list_ips: [],
    list_agents: [],
    list_providers: [],
    list_referers: []
  });

  const [textInputs, setTextInputs] = useState({
    ips: '',
    agents: '',
    providers: '',
    referers: ''
  });

  useEffect(() => {
    loadFilter();
  }, [id]);

  const loadFilter = async () => {
    if (!id) return;
    
    setLoadingFilter(true);
    try {
      const response = await apiService.getFilterDetails(parseInt(id));
      if (response.success) {
        const filter = response.data;
        setFormData({
          name: filter.name,
          list_ips: filter.list_ips || [],
          list_agents: filter.list_agents || [],
          list_providers: filter.list_providers || [],
          list_referers: filter.list_referers || []
        });

        setTextInputs({
          ips: (filter.list_ips || []).join('\n'),
          agents: (filter.list_agents || []).join('\n'),
          providers: (filter.list_providers || []).join('\n'),
          referers: (filter.list_referers || []).join('\n')
        });
      } else {
        setError(response.message || '获取过滤器信息失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoadingFilter(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTextAreaChange = (field: string, value: string) => {
    setTextInputs(prev => ({
      ...prev,
      [field]: value
    }));

    // 将文本转换为数组
    const items = value.split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    setFormData(prev => ({
      ...prev,
      [`list_${field}`]: items
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('过滤器名称不能为空');
      return false;
    }
    if (formData.name.length < 3 || formData.name.length > 32) {
      setError('过滤器名称长度必须在3-32个字符之间');
      return false;
    }

    // 检查数量限制
    if (formData.list_ips.length > 5000) {
      setError('IP地址列表不能超过5000个');
      return false;
    }
    if (formData.list_agents.length > 5000) {
      setError('User-Agent列表不能超过5000个');
      return false;
    }
    if (formData.list_providers.length > 5000) {
      setError('ISP提供商列表不能超过5000个');
      return false;
    }
    if (formData.list_referers.length > 5000) {
      setError('Referer列表不能超过5000个');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 [EditFilter] Form submitted');
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.updateFilter(parseInt(id!), formData);
      console.log('🔍 [EditFilter] Update filter response:', response);
      if (response.success) {
        setSuccess('过滤器更新成功！');
        console.log('🔍 [EditFilter] Filter updated successfully, navigating to /admin/filters in 2 seconds');
        setTimeout(() => {
          console.log('🔍 [EditFilter] Executing navigation to /admin/filters');
          navigate('/admin/filters');
        }, 2000);
      } else {
        console.log('🔍 [EditFilter] Filter update failed:', response.message);
        setError(response.message || '更新过滤器失败');
      }
    } catch (err: any) {
      console.error('🔍 [EditFilter] Error during filter update:', err);
      setError(err.message || '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingFilter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-500">加载过滤器信息中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/filters')}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑过滤器</h1>
            <p className="text-gray-600 mt-1">修改过滤规则列表</p>
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              过滤器名称 *
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
              placeholder="输入过滤器名称"
            />
          </div>
        </div>

        {/* Filter Rules */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">过滤规则</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                IP地址列表 (最多5000个)
              </label>
              <textarea
                value={textInputs.ips}
                onChange={(e) => handleTextAreaChange('ips', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="每行一个IP地址&#10;例如:&#10;192.168.1.1&#10;10.0.0.1&#10;203.0.113.0/24"
              />
              <p className="text-xs text-gray-500 mt-1">
                当前: {formData.list_ips.length} 个IP地址
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Smartphone className="inline h-4 w-4 mr-1" />
                User-Agent列表 (最多5000个)
              </label>
              <textarea
                value={textInputs.agents}
                onChange={(e) => handleTextAreaChange('agents', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="每行一个User-Agent&#10;例如:&#10;Mozilla/5.0 (Windows NT 10.0; Win64; x64)&#10;bot&#10;crawler"
              />
              <p className="text-xs text-gray-500 mt-1">
                当前: {formData.list_agents.length} 个User-Agent
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISP提供商列表 (最多5000个)
              </label>
              <textarea
                value={textInputs.providers}
                onChange={(e) => handleTextAreaChange('providers', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="每行一个ISP提供商&#10;例如:&#10;China Telecom&#10;China Unicom&#10;China Mobile"
              />
              <p className="text-xs text-gray-500 mt-1">
                当前: {formData.list_providers.length} 个ISP提供商
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referer列表 (最多5000个)
              </label>
              <textarea
                value={textInputs.referers}
                onChange={(e) => handleTextAreaChange('referers', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="每行一个Referer URL&#10;例如:&#10;https://www.google.com&#10;https://www.facebook.com&#10;https://www.baidu.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                当前: {formData.list_referers.length} 个Referer
              </p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/filters')}
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
            <span>{isLoading ? '更新中...' : '更新过滤器'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFilter;