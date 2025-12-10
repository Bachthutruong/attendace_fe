import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Bell,
  LogOut,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Filter,
  Eye,
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import AttendanceDetailModal from '@/components/AttendanceDetailModal';
import axios from '@/lib/axios';
import {
  User,
  Attendance,
  Notification,
  TodayAttendanceResponse,
  ApiResponse,
  PaginationResponse,
} from '@/types';
import { formatDate, formatTime, formatHours } from '@/lib/utils';
import toast from 'react-hot-toast';

type TabType = 'dashboard' | 'employees' | 'attendances' | 'notifications';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [todayData, setTodayData] = useState<TodayAttendanceResponse | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pagination for employees
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(10);
  const [employeeTotalPages, setEmployeeTotalPages] = useState(1);
  const [employeeTotalItems, setEmployeeTotalItems] = useState(0);

  // Pagination for attendances
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(20);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState(1);
  const [attendanceTotalItems, setAttendanceTotalItems] = useState(0);

  // Filters for attendances
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    month: '',
    year: new Date().getFullYear().toString(),
    hasAlert: '',
  });

  // Detail modal
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  // Employee form
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    employeeCode: '',
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
  });

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/attendance');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchTodayAttendances();
    fetchNotifications();
    fetchAllEmployeesForFilter();
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'attendances') {
      fetchAllAttendances();
    }
  }, [activeTab, employeePage, employeePageSize, attendancePage, attendancePageSize, filters]);

  const fetchTodayAttendances = async () => {
    try {
      const response = await axios.get<ApiResponse<TodayAttendanceResponse>>(
        '/admin/attendances/today'
      );
      setTodayData(response.data.data!);
    } catch (error: any) {
      console.error('Error fetching today attendances:', error);
    }
  };

  const fetchAllEmployeesForFilter = async () => {
    try {
      const response = await axios.get<PaginationResponse<User>>('/admin/users?limit=1000');
      setAllEmployees(response.data.data);
    } catch (error: any) {
      console.error('Error fetching employees for filter:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get<PaginationResponse<User>>(
        `/admin/users?page=${employeePage}&limit=${employeePageSize}`
      );
      setEmployees(response.data.data);
      setEmployeeTotalPages(response.data.pagination.pages);
      setEmployeeTotalItems(response.data.pagination.total);
    } catch (error: any) {
      toast.error('載入員工列表時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttendances = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: attendancePage.toString(),
        limit: attendancePageSize.toString(),
      });

      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.hasAlert) queryParams.append('hasAlert', filters.hasAlert);

      const response = await axios.get<PaginationResponse<Attendance>>(
        `/admin/attendances?${queryParams.toString()}`
      );
      setAttendances(response.data.data);
      setAttendanceTotalPages(response.data.pagination.pages);
      setAttendanceTotalItems(response.data.pagination.total);
    } catch (error: any) {
      toast.error('載入考勤列表時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceDetail = async (id: string) => {
    try {
      const response = await axios.get<ApiResponse<Attendance>>(`/admin/attendances/${id}`);
      setSelectedAttendance(response.data.data!);
    } catch (error: any) {
      toast.error('載入考勤詳情時發生錯誤');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get<any>('/admin/notifications?limit=20');
      setNotifications(response.data.data);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await axios.put(`/admin/users/${editingEmployee.id}`, {
          employeeCode: employeeForm.employeeCode,
          name: employeeForm.name,
          email: employeeForm.email,
          role: employeeForm.role,
        });
        toast.success('更新員工成功');
      } else {
        await axios.post('/admin/users', employeeForm);
        toast.success('建立員工成功');
      }
      setShowEmployeeForm(false);
      setEditingEmployee(null);
      setEmployeeForm({ employeeCode: '', name: '', email: '', password: '', role: 'employee' });
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '發生錯誤');
    }
  };

  const handleEditEmployee = (employee: User) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      employeeCode: employee.employeeCode,
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
    });
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('您確定要刪除此員工嗎？')) return;

    try {
      await axios.delete(`/admin/users/${id}`);
      toast.success('刪除員工成功');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '發生錯誤');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await axios.patch(`/admin/notifications/${id}/read`);
      fetchNotifications();
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch('/admin/notifications/read-all');
      fetchNotifications();
      toast.success('已標記所有通知為已讀');
    } catch (error: any) {
      toast.error('發生錯誤');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('已登出');
  };

  const handleResetFilters = () => {
    setFilters({
      userId: '',
      startDate: '',
      endDate: '',
      month: '',
      year: new Date().getFullYear().toString(),
      hasAlert: '',
    });
    setAttendancePage(1);
  };

  const months = [
    { value: '1', label: '1月' },
    { value: '2', label: '2月' },
    { value: '3', label: '3月' },
    { value: '4', label: '4月' },
    { value: '5', label: '5月' },
    { value: '6', label: '6月' },
    { value: '7', label: '7月' },
    { value: '8', label: '8月' },
    { value: '9', label: '9月' },
    { value: '10', label: '10月' },
    { value: '11', label: '11月' },
    { value: '12', label: '12月' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理員</h1>
              <p className="text-sm text-gray-600">你好，{currentUser?.name}!</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveTab('notifications');
                  fetchNotifications();
                }}
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard' as TabType, label: '總覽', icon: BarChart3 },
              { id: 'employees' as TabType, label: '員工', icon: Users },
              { id: 'attendances' as TabType, label: '考勤', icon: Calendar },
              { id: 'notifications' as TabType, label: '通知', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && todayData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">員工總數</p>
                      <p className="text-3xl font-bold text-gray-900">{todayData.stats.total}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">已打卡</p>
                      <p className="text-3xl font-bold text-green-600">{todayData.stats.present}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">缺勤</p>
                      <p className="text-3xl font-bold text-red-600">{todayData.stats.absent}</p>
                    </div>
                    <Clock className="w-12 h-12 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">警告</p>
                      <p className="text-3xl font-bold text-yellow-600">{todayData.stats.withAlerts}</p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-yellow-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Attendances */}
            <Card>
              <CardHeader>
                <CardTitle>今日考勤 - {formatDate(new Date())}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>員工編號</TableHead>
                      <TableHead>員工</TableHead>
                      <TableHead>上班打卡</TableHead>
                      <TableHead>下班打卡</TableHead>
                      <TableHead>工時</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayData.attendances.map((attendance) => (
                      <TableRow key={attendance._id}>
                        <TableCell className="font-mono font-semibold text-primary">
                          {typeof attendance.userId === 'object' ? attendance.userId.employeeCode : ''}
                        </TableCell>
                        <TableCell className="font-medium">
                          {typeof attendance.userId === 'object' ? attendance.userId.name : ''}
                        </TableCell>
                        <TableCell>
                          {attendance.checkIn ? formatTime(attendance.checkIn.time) : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance.checkOut ? formatTime(attendance.checkOut.time) : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance.workedHours ? formatHours(attendance.workedHours) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                attendance.status === 'completed'
                                  ? 'success'
                                  : attendance.status === 'pending'
                                  ? 'warning'
                                  : 'outline'
                              }
                            >
                              {attendance.status === 'completed'
                                ? '已完成'
                                : '工作中'}
                            </Badge>
                            {(attendance.hasDeviceAlert || attendance.hasIpAlert) && (
                              <span title={attendance.alertMessage} className="inline-flex">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(attendance.hasDeviceAlert || attendance.hasIpAlert) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchAttendanceDetail(attendance._id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {todayData.absentEmployees.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-900 mb-2">
                      未打卡員工 ({todayData.absentEmployees.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {todayData.absentEmployees.map((emp) => (
                        <Badge key={emp.id} variant="destructive">
                          {emp.employeeCode} - {emp.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">員工管理</h2>
              <Button onClick={() => setShowEmployeeForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                新增員工
              </Button>
            </div>

            {showEmployeeForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingEmployee ? '編輯員工' : '新增員工'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateEmployee} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">員工編號</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md uppercase"
                          placeholder="例如：NV001"
                          value={employeeForm.employeeCode}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, employeeCode: e.target.value.toUpperCase() })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">姓名</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          value={employeeForm.name}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">電子郵件</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border rounded-md"
                          value={employeeForm.email}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, email: e.target.value })
                          }
                          required
                        />
                      </div>
                      {!editingEmployee && (
                        <div>
                          <label className="block text-sm font-medium mb-2">密碼</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border rounded-md"
                            value={employeeForm.password}
                            onChange={(e) =>
                              setEmployeeForm({ ...employeeForm, password: e.target.value })
                            }
                            required={!editingEmployee}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-2">角色</label>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={employeeForm.role}
                          onChange={(e) =>
                            setEmployeeForm({
                              ...employeeForm,
                              role: e.target.value as 'admin' | 'employee',
                            })
                          }
                        >
                          <option value="employee">員工</option>
                          <option value="admin">管理員</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingEmployee ? '更新' : '新增'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEmployeeForm(false);
                          setEditingEmployee(null);
                          setEmployeeForm({ employeeCode: '', name: '', email: '', password: '', role: 'employee' });
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <p className="text-center py-8">載入中...</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>員工編號</TableHead>
                          <TableHead>姓名</TableHead>
                          <TableHead>電子郵件</TableHead>
                          <TableHead>角色</TableHead>
                          <TableHead>狀態</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-mono font-semibold text-primary">{emp.employeeCode}</TableCell>
                            <TableCell className="font-medium">{emp.name}</TableCell>
                            <TableCell>{emp.email}</TableCell>
                            <TableCell>
                              <Badge variant={emp.role === 'admin' ? 'default' : 'secondary'}>
                                {emp.role === 'admin' ? '管理員' : '員工'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={emp.isActive ? 'success' : 'destructive'}>
                                {emp.isActive ? '啟用' : '停用'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditEmployee(emp)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {employeeTotalPages > 1 && (
                      <Pagination
                        currentPage={employeePage}
                        totalPages={employeeTotalPages}
                        onPageChange={setEmployeePage}
                        pageSize={employeePageSize}
                        onPageSizeChange={(size) => {
                          setEmployeePageSize(size);
                          setEmployeePage(1);
                        }}
                        totalItems={employeeTotalItems}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendances Tab */}
        {activeTab === 'attendances' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">考勤記錄</h2>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  <CardTitle>篩選</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">員工</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={filters.userId}
                      onChange={(e) => {
                        setFilters({ ...filters, userId: e.target.value });
                        setAttendancePage(1);
                      }}
                    >
                      <option value="">全部</option>
                      {allEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeCode} - {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">月</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={filters.month}
                      onChange={(e) => {
                        setFilters({ ...filters, month: e.target.value });
                        setAttendancePage(1);
                      }}
                    >
                      <option value="">全部</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">年</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={filters.year}
                      onChange={(e) => {
                        setFilters({ ...filters, year: e.target.value });
                        setAttendancePage(1);
                      }}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">從</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={filters.startDate}
                      onChange={(e) => {
                        setFilters({ ...filters, startDate: e.target.value });
                        setAttendancePage(1);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">至</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={filters.endDate}
                      onChange={(e) => {
                        setFilters({ ...filters, endDate: e.target.value });
                        setAttendancePage(1);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">警告</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={filters.hasAlert}
                      onChange={(e) => {
                        setFilters({ ...filters, hasAlert: e.target.value });
                        setAttendancePage(1);
                      }}
                    >
                      <option value="">全部</option>
                      <option value="true">有警告</option>
                      <option value="false">無</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    重置篩選
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <p className="text-center py-8">載入中...</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>員工編號</TableHead>
                          <TableHead>員工</TableHead>
                          <TableHead>日期</TableHead>
                          <TableHead>上班打卡</TableHead>
                          <TableHead>下班打卡</TableHead>
                          <TableHead>工時</TableHead>
                          <TableHead>狀態</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendances.map((attendance) => (
                          <TableRow key={attendance._id}>
                            <TableCell className="font-mono font-semibold text-primary">
                              {typeof attendance.userId === 'object' ? attendance.userId.employeeCode : ''}
                            </TableCell>
                            <TableCell className="font-medium">
                              {typeof attendance.userId === 'object' ? attendance.userId.name : ''}
                            </TableCell>
                            <TableCell>{formatDate(attendance.date)}</TableCell>
                            <TableCell>
                              {attendance.checkIn ? formatTime(attendance.checkIn.time) : '-'}
                            </TableCell>
                            <TableCell>
                              {attendance.checkOut ? formatTime(attendance.checkOut.time) : '-'}
                            </TableCell>
                            <TableCell>
                              {attendance.workedHours ? formatHours(attendance.workedHours) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    attendance.status === 'completed'
                                      ? 'success'
                                      : attendance.status === 'pending'
                                      ? 'warning'
                                      : 'outline'
                                  }
                                >
                                  {attendance.status === 'completed'
                                    ? '已完成'
                                    : attendance.status === 'pending'
                                    ? '工作中'
                                    : '缺勤'}
                                </Badge>
                                {(attendance.hasDeviceAlert || attendance.hasIpAlert) && (
                                  <span title={attendance.alertMessage} className="inline-flex">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchAttendanceDetail(attendance._id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {attendanceTotalPages > 1 && (
                      <Pagination
                        currentPage={attendancePage}
                        totalPages={attendanceTotalPages}
                        onPageChange={setAttendancePage}
                        pageSize={attendancePageSize}
                        onPageSizeChange={(size) => {
                          setAttendancePageSize(size);
                          setAttendancePage(1);
                        }}
                        totalItems={attendanceTotalItems}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">通知</h2>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={handleMarkAllRead}>
                  全部標記為已讀
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-600">
                    無通知
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notif) => (
                  <Card
                    key={notif._id}
                    className={`cursor-pointer transition-all ${
                      !notif.isRead ? 'border-l-4 border-l-primary bg-blue-50' : ''
                    }`}
                    onClick={() => !notif.isRead && handleMarkNotificationRead(notif._id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {notif.type === 'alert' ? (
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                          ) : notif.type === 'check-in' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Clock className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notif.createdAt).toLocaleString('zh-TW')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Attendance Detail Modal */}
      {selectedAttendance && (
        <AttendanceDetailModal
          attendance={selectedAttendance}
          onClose={() => setSelectedAttendance(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;



