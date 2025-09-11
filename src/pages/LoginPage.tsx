import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { LogIn, Shield, Users } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    invitationCode: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    setError('');
  }, [isLogin]);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const success = await login(formData.username, formData.password);
        if (!success) {
          setError('用户名或密码错误');
        }
      } else {
        // 注册逻辑
        if (!formData.username || !formData.password || !formData.email || !formData.invitationCode) {
          setError('请填写所有必填字段');
          return;
        }
        
        if (formData.username.length < 3) {
          setError('用户名至少需要3个字符');
          return;
        }
        
        if (formData.password.length < 6) {
          setError('密码至少需要6个字符');
          return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('邮箱格式不正确');
          return;
        }
        
        try {
          const response = await authService.register(
            formData.username,
            formData.password,
            formData.email,
            formData.invitationCode
          );
          
          if (response.success) {
            // 注册成功，自动登录
            const loginSuccess = await login(formData.username, formData.password);
            if (!loginSuccess) {
              setError('注册成功但自动登录失败，请手动登录');
              setIsLogin(true); // 切换到登录模式
            }
          } else {
            setError(response.message || '注册失败');
          }
        } catch (registerError) {
          setError('注册失败，请重试');
        }
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-pink-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">恺瑞投流团队</h2>
            <p className="text-gray-300 mt-2">斗篷管理系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-gray-300/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                placeholder="请输入用户名"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-gray-300/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                placeholder="请输入密码"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    邮箱
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-gray-300/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    placeholder="请输入邮箱"
                  />
                </div>

                <div>
                  <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-300 mb-2">
                    邀请码
                  </label>
                  <input
                    id="invitationCode"
                    name="invitationCode"
                    type="text"
                    required
                    value={formData.invitationCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-gray-300/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    placeholder="请输入邀请码"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>{isLogin ? '登录' : '注册'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-400 hover:text-pink-300 text-sm transition-colors duration-200"
            >
              {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;