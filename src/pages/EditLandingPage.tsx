import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Calendar, FileText, Globe, Code, Image, Upload, Download } from 'lucide-react';

interface LandingPageFormData {
  date: string;
  name: string;
  region: '美国' | '日本' | '';
  tech_framework: 'python' | 'node' | 'html' | '';
}

interface LandingPageData extends LandingPageFormData {
  id: number;
  ui_image?: string;
  source_file?: string;
  download_file?: string;
  created_at: string;
  updated_at: string;
}

const EditLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<LandingPageFormData>({
    date: '',
    name: '',
    region: '',
    tech_framework: ''
  });

  const [currentData, setCurrentData] = useState<LandingPageData | null>(null);

  const [files, setFiles] = useState({
    ui_image: null as File | null,
    source_file: null as File | null,
    download_file: null as File | null
  });

  useEffect(() => {
    loadLandingPageData();
  }, [id]);

  const loadLandingPageData = async () => {
    if (!id) return;
    
    setLoadingData(true);
    try {
      const response = await fetch(`/api/landing-pages/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        const landingPage = data.data;
        setCurrentData(landingPage);
        setFormData({
          date: landingPage.date,
          name: landingPage.name,
          region: landingPage.region,
          tech_framework: landingPage.tech_framework
        });
      } else {
        setError(data.message || '获取落地页信息失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }));
    }
  };

  const validateForm = () => {
    if (!formData.date) {
      setError('请选择日期');
      return false;
    }
    if (!formData.name.trim()) {
      setError('请输入落地页名称');
      return false;
    }
    if (!formData.region) {
      setError('请选择地区');
      return false;
    }
    if (!formData.tech_framework) {
      setError('请选择技术框架');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('date', formData.date);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('region', formData.region);
      formDataToSend.append('tech_framework', formData.tech_framework);

      if (files.ui_image) {
        formDataToSend.append('ui_image', files.ui_image);
      }
      if (files.source_file) {
        formDataToSend.append('source_file', files.source_file);
      }
      if (files.download_file) {
        formDataToSend.append('download_file', files.download_file);
      }

      const response = await fetch(`/api/landing-pages/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('落地页更新成功！');
        setTimeout(() => {
          navigate('/admin/landing-pages');
        }, 2000);
      } else {
        setError(data.message || '更新落地页失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (type: 'ui' | 'source' | 'download') => {
    try {
      const response = await fetch(`/api/landing-pages/download/${id}/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `landing-page-${id}-${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError('文件下载失败');
      }
    } catch (err) {
      setError('下载失败，请重试');
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-500">加载落地页信息中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/landing-pages')}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑落地页</h1>
            <p className="text-gray-600 mt-1">修改落地页资源信息</p>
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

      {/* Current Files Info */}
      {currentData && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">当前文件</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">UI图片:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">
                  {currentData.ui_image ? '已上传' : '未上传'}
                </span>
                {currentData.ui_image && (
                  <button
                    onClick={() => handleDownload('ui')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">源文件:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">
                  {currentData.source_file ? '已上传' : '未上传'}
                </span>
                {currentData.source_file && (
                  <button
                    onClick={() => handleDownload('source')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">下载文件:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">
                  {currentData.download_file ? '已上传' : '未上传'}
                </span>
                {currentData.download_file && (
                  <button
                    onClick={() => handleDownload('download')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                日期 *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                名称 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="输入落地页名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                地区 *
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">请选择地区</option>
                <option value="美国">美国</option>
                <option value="日本">日本</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Code className="inline h-4 w-4 mr-1" />
                技术框架 *
              </label>
              <select
                name="tech_framework"
                value={formData.tech_framework}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">请选择技术框架</option>
                <option value="python">Python</option>
                <option value="node">Node.js</option>
                <option value="html">HTML</option>
              </select>
            </div>
          </div>
        </div>

        {/* File Uploads */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">文件上传 (可选更新)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="inline h-4 w-4 mr-1" />
                UI图片
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>更新图片</span>
                      <input
                        type="file"
                        name="ui_image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
                  {files.ui_image && (
                    <p className="text-xs text-green-600 mt-2">
                      新文件: {files.ui_image.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Code className="inline h-4 w-4 mr-1" />
                源文件
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>更新源文件</span>
                      <input
                        type="file"
                        name="source_file"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">任意格式 最大 10MB</p>
                  {files.source_file && (
                    <p className="text-xs text-green-600 mt-2">
                      新文件: {files.source_file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Download className="inline h-4 w-4 mr-1" />
                下载文件
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>更新下载文件</span>
                      <input
                        type="file"
                        name="download_file"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">任意格式 最大 10MB</p>
                  {files.download_file && (
                    <p className="text-xs text-green-600 mt-2">
                      新文件: {files.download_file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/landing-pages')}
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
            <span>{isLoading ? '更新中...' : '更新落地页'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditLandingPage;