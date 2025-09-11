import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, X, Home, Activity, BarChart3, MousePointer, 
  LogOut, Settings, Shield, ChevronDown, ChevronRight, Users, TrendingUp, Filter,
  Database
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flowMenuOpen, setFlowMenuOpen] = useState(true);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const navigationItems = [
    { path: '/admin', name: '仪表板', icon: Home },
    {
      name: '流管理',
      icon: Activity,
      isParent: true,
      isOpen: flowMenuOpen,
      toggle: () => setFlowMenuOpen(!flowMenuOpen),
      children: [
        { path: '/admin/flows', name: '流列表', icon: Activity },
        { path: '/admin/flows/create', name: '创建流程', icon: Activity },
      ]
    },
    { path: '/admin/statistics', name: '统计数据', icon: BarChart3 },
    { path: '/admin/clicks', name: '点击数据', icon: MousePointer },
    { path: '/admin/conversions', name: '转化记录', icon: TrendingUp },
    { path: '/admin/filters', name: '过滤列表', icon: Filter },
    { path: '/admin/logs', name: 'API日志', icon: Database },
    {
      name: '账号管理',
      icon: Users,
      isParent: true,
      isOpen: true,
      toggle: () => {},
      children: [
        { path: '/admin/accounts', name: '账号列表', icon: Users },
        { path: '/admin/accounts/create', name: '创建账号', icon: Users },
        { path: '/admin/accounts/categories', name: '账号分类', icon: Users },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-pink-400" />
            <span className="text-white font-bold text-lg">恺瑞斗篷</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white transition-colors duration-200 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navigationItems.map((item, index) => (
            <div key={index}>
              {item.isParent ? (
                <div>
                  <button
                    onClick={item.toggle}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {item.isOpen && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.children?.map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          to={child.path}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                            location.pathname === child.path
                              ? 'text-pink-400 bg-gray-800'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <child.icon className="h-4 w-4" />
                          <span>{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'text-pink-400 bg-gray-800'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-white text-sm font-medium">{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">退出登录</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm">欢迎，{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;