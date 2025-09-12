import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import CacheManager from '../components/CacheManager';
import { 
  Users, Activity, MousePointer, TrendingUp, 
  ArrowUpRight, ArrowDownRight, BarChart3, Settings
} from 'lucide-react';

interface DashboardData {
  totalUsers: number;
  totalFlows: number;
  totalClicks: number;
  activeFlows: number;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalFlows: 0,
    totalClicks: 0,
    activeFlows: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔍 [Dashboard] Component mounted, loading dashboard data');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔍 [Dashboard] Loading dashboard data...');
      const response = await apiService.getDashboardData();
      console.log('🔍 [Dashboard] Dashboard response:', response);
      if (response.success) {
        console.log('🔍 [Dashboard] Dashboard data loaded successfully:', response.data);
        setDashboardData(response.data);
      } else {
        console.error('🔍 [Dashboard] Dashboard API error:', response.message);
        setError(response.message || '获取仪表板数据失败');
      }
    } catch (error) {
      console.error('🔍 [Dashboard] Dashboard fetch error:', error);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      name: '总用户数',
      value: dashboardData.totalUsers,
      icon: Users,
      change: '+12%',
      changeType: 'positive',
      color: 'bg-blue-500'
    },
    {
      name: '总流程数',
      value: dashboardData.totalFlows,
      icon: Activity,
      change: '+8%',
      changeType: 'positive',
      color: 'bg-green-500'
    },
    {
      name: '总点击量',
      value: dashboardData.totalClicks,
      icon: MousePointer,
      change: '+24%',
      changeType: 'positive',
      color: 'bg-purple-500'
    },
    {
      name: '活跃流程',
      value: dashboardData.activeFlows,
      icon: TrendingUp,
      change: '-3%',
      changeType: 'negative',
      color: 'bg-pink-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        {console.log('🔍 [Dashboard] Showing loading state')}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  console.log('🔍 [Dashboard] Rendering dashboard with data:', dashboardData);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">欢迎来到恺瑞投流管理系统</h1>
        <p className="text-indigo-100 text-lg">
          专业的斗篷流量管理平台，助力您的业务增长
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              {stat.changeType === 'positive' ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ml-1 ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-gray-500 text-sm ml-2">vs 上月</span>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">流程状态分布</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">图表功能待开发</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">点击量趋势</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">图表功能待开发</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/flows"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group"
          >
            <Activity className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <h4 className="font-medium text-gray-900">管理流程</h4>
            <p className="text-gray-500 text-sm mt-1">查看和管理所有流程</p>
          </Link>

          <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 group cursor-pointer">
            <BarChart3 className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <h4 className="font-medium text-gray-900">查看统计</h4>
            <p className="text-gray-500 text-sm mt-1">分析流程性能数据</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group cursor-pointer">
            <Settings className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <h4 className="font-medium text-gray-900">系统设置</h4>
            <p className="text-gray-500 text-sm mt-1">配置系统参数</p>
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <CacheManager />
    </div>
  );
};

export default Dashboard;