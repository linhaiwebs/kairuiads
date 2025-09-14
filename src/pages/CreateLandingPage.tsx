import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, X, Calendar, FileText, Image, 
  Upload, Globe, Code, Download
} from 'lucide-react';

interface LandingPageFormData {
  date: string;
  name: string;
  region: '美国' | '日本' | '';
  tech_framework: 'python' | 'node' | 'html' | '';
}

const CreateLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<LandingPageFormData>({
    date: new Date().toISOString().split('T')[0],
    name: '',
    region: '',
    tech_framework: ''
  });

  const [files, setFiles] = useState({
    ui_image: null as File | null,
    source_file: null as File | null,
    download_file: null as File | null
  });

  const [previews, setPreviews] = useState({
    ui_image: '' as string
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));

      // 为UI图片创建预览
      if (fieldName === 'ui_image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => ({
            ...prev,
            ui_image: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
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
    if (formData.name.length < 2 || formData.name.length > 100) {
      setError('落地页名称长度必须在2-100个字符之间');
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

      // 添加文件
      if (files.ui_image) {
        formDataToSend.append('ui_image', files.ui_image);
      }
      if (files.source_file) {
        formDataToSend.append('source_file', files.source_file);
      }
      if (files.download_file) {
        formDataToSend.append('download_file', files.download_file);
      }

      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('落地页创建成功！');
        setTimeout(() => {
          navigate('/admin/landing-pages');
        }, 2000);
      } else {
        setError(data.message || '创建落地页失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (fieldName: string) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: null
    }));
    if (fieldName === 'ui_image') {
      setPreviews(prev => ({
        ...prev,
        ui_image: ''
      }));
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">创建落地页</h1>
            <p className="text-gray-600 mt-1">添加新的落地页资源</p>
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
                minLength={2}
                maxLength={100}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">文件上传</h3>
          
          {/* UI Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="inline h-4 w-4 mr-1" />
              UI图片
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors duration-200">
              {previews.ui_image ? (
                <div className="flex items-center space-x-4">
                  <img
                    src={previews.ui_image}
                    alt="UI预览"
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{files.ui_image?.name}</p>
                    <p className="text-xs text-gray-500">
                      {files.ui_image && (files.ui_image.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('ui_image')}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        点击上传UI图片
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        支持 PNG, JPG, GIF 格式，最大 10MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'ui_image')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Source File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="inline h-4 w-4 mr-1" />
              源文件
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors duration-200">
              {files.source_file ? (
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{files.source_file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(files.source_file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('source_file')}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        点击上传源文件
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        支持所有文件格式，最大 10MB
                      </span>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'source_file')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Download className="inline h-4 w-4 mr-1" />
              下载文件
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors duration-200">
              {files.download_file ? (
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Download className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{files.download_file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(files.download_file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('download_file')}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Download className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        点击上传下载文件
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        支持所有文件格式，最大 10MB
                      </span>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'download_file')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
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
            <span>{isLoading ? '创建中...' : '创建落地页'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLandingPage;