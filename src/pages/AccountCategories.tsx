import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Tag, Save, X, 
  Palette, FileText, Users
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  account_count: number;
  created_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

const AccountCategories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: 'bg-blue-500'
  });

  const colorOptions = [
    { value: 'bg-red-500', label: '红色', preview: 'bg-red-500' },
    { value: 'bg-blue-500', label: '蓝色', preview: 'bg-blue-500' },
    { value: 'bg-green-500', label: '绿色', preview: 'bg-green-500' },
    { value: 'bg-purple-500', label: '紫色', preview: 'bg-purple-500' },
    { value: 'bg-yellow-500', label: '黄色', preview: 'bg-yellow-500' },
    { value: 'bg-pink-500', label: '粉色', preview: 'bg-pink-500' },
    { value: 'bg-indigo-500', label: '靛蓝', preview: 'bg-indigo-500' },
    { value: 'bg-gray-500', label: '灰色', preview: 'bg-gray-500' }
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.message || '获取分类数据失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'bg-blue-500'
    });
    setShowCreateForm(false);
    setEditingCategory(null);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('分类名称不能为空');
      return;
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('分类创建成功！');
        resetForm();
        loadCategories(); // 重新加载列表
      } else {
        setError(data.message || '创建分类失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color
    });
    setShowCreateForm(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('分类名称不能为空');
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('分类更新成功！');
        resetForm();
        loadCategories(); // 重新加载列表
      } else {
        setError(data.message || '更新分类失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    if (category.account_count > 0) {
      setError(`无法删除分类"${category.name}"，该分类下还有 ${category.account_count} 个账号`);
      return;
    }

    if (confirm(`确定要删除分类"${category.name}"吗？`)) {
      try {
        const response = await fetch(`/api/admin/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('分类删除成功！');
          loadCategories(); // 重新加载列表
        } else {
          setError(data.message || '删除分类失败');
        }
      } catch (err) {
        setError('网络错误，请重试');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/accounts')}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">账号分类管理</h1>
            <p className="text-gray-600 mt-1">管理账号分类和权限设置</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>创建分类</span>
        </button>
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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCategory ? '编辑分类' : '创建分类'}
          </h3>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  分类名称 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="输入分类名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="inline h-4 w-4 mr-1" />
                  分类颜色
                </label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                分类描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="输入分类描述（可选）"
              />
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>取消</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingCategory ? '更新分类' : '创建分类'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-500">加载中...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>暂无分类数据</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    title="编辑分类"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    title="删除分类"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description || '暂无描述'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{category.account_count} 个账号</span>
                </div>
                <span>{formatDate(category.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountCategories;