import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { login, register, clearError } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error, user } = useAppSelector((state) => state.auth);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    loginId: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/attendance');
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoginMode) {
      if (!formData.loginId) {
        toast.error('請輸入員工編號或電子郵件');
        return;
      }
      dispatch(login({ loginId: formData.loginId, password: formData.password }));
    } else {
      if (!formData.employeeCode) {
        toast.error('請輸入員工編號');
        return;
      }
      if (!formData.name) {
        toast.error('請輸入姓名');
        return;
      }
      dispatch(register({
        employeeCode: formData.employeeCode,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            {isLoginMode ? (
              <LogIn className="w-6 h-6 text-white" />
            ) : (
              <UserPlus className="w-6 h-6 text-white" />
            )}
          </div>
          <CardTitle className="text-3xl font-bold">
            {isLoginMode ? '登入' : '註冊'}
          </CardTitle>
          <CardDescription>
            {isLoginMode
              ? '登入以進行考勤和管理'
              : '建立新帳戶以開始使用'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <>
                <div className="space-y-2">
                  <label htmlFor="employeeCode" className="text-sm font-medium">
                    員工編號
                  </label>
                  <Input
                    id="employeeCode"
                    name="employeeCode"
                    type="text"
                    placeholder="NV001"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    required={!isLoginMode}
                    className="uppercase"
                  />
                  <p className="text-xs text-gray-500">例如: NV001, NV002, ...</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    姓名
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="陳大文"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLoginMode}
                  />
                </div>
              </>
            )}

            {isLoginMode ? (
              <div className="space-y-2">
                <label htmlFor="loginId" className="text-sm font-medium">
                  員工編號或電子郵件
                </label>
                <Input
                  id="loginId"
                  name="loginId"
                  type="text"
                  placeholder="NV001 或 email@company.com"
                  value={formData.loginId}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">輸入員工編號或電子郵件</p>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  電子郵件
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required={!isLoginMode}
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密碼
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '處理中...' : isLoginMode ? '登入' : '註冊'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-sm text-primary hover:underline"
            >
              {isLoginMode
                ? '還沒有帳戶？立即註冊'
                : '已有帳戶？登入'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

