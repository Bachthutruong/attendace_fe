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
  Check,
  X,
  Settings,
  XCircle,
  FileText,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import AttendanceDetailModal from '@/components/AttendanceDetailModal';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import axios from '@/lib/axios';
import {
  User,
  Attendance,
  Notification,
  TodayAttendanceResponse,
  ApiResponse,
  PaginationResponse,
  LeaveRequest,
} from '@/types';
import { formatDate, formatTime, formatHours } from '@/lib/utils';
import toast from 'react-hot-toast';

type TabType = 'dashboard' | 'employees' | 'attendances' | 'notifications' | 'settings' | 'leave-requests';

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
  
  // Settings
  const [settings, setSettings] = useState({
    defaultCheckInTime: '',
    defaultCheckOutTime: '',
    allowedIPs: [] as string[],
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [currentIP, setCurrentIP] = useState<string>('');

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
    status: '',
    hasAlert: '',
  });

  // Detail modal
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  // Leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveRequestLoading, setLeaveRequestLoading] = useState(false);
  const [leaveRequestActionLoading, setLeaveRequestActionLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [leaveRequestFilters, setLeaveRequestFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [leaveRequestPagination, setLeaveRequestPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Approval dialog
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<{
    id: string;
    status: 'completed' | 'rejected';
    employeeName: string;
    employeeCode: string;
  } | null>(null);

  // Employee form
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    employeeCode: '',
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
    customCheckInTime: '',
    customCheckOutTime: '',
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
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'attendances') {
      fetchAllAttendances();
    } else if (activeTab === 'settings') {
      fetchSettings();
      fetchCurrentIP();
    } else if (activeTab === 'leave-requests') {
      fetchLeaveRequests();
    }
  }, [activeTab, employeePage, employeePageSize, attendancePage, attendancePageSize, filters, leaveRequestPagination.page, leaveRequestFilters]);

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
      // Ensure all employees have id field
      const employeesWithId = response.data.data.map((emp: any) => ({
        ...emp,
        id: emp.id || emp._id || '',
      }));
      setAllEmployees(employeesWithId);
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

      // Append userId if selected (dropdown always provides valid ID)
      if (filters.userId && filters.userId.trim() !== '') {
        queryParams.append('userId', filters.userId);
      }
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.hasAlert) queryParams.append('hasAlert', filters.hasAlert);

      const url = `/admin/attendances?${queryParams.toString()}`;
      const response = await axios.get<PaginationResponse<Attendance>>(url);
      
      // Ensure attendances have proper userId structure
      const attendancesWithId = response.data.data.map((att: any) => {
        if (att.userId && typeof att.userId === 'object') {
          att.userId = {
            ...att.userId,
            id: att.userId.id || att.userId._id || '',
          };
        }
        return att;
      });
      
      setAttendances(attendancesWithId);
      setAttendanceTotalPages(response.data.pagination.pages);
      setAttendanceTotalItems(response.data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching attendances:', error);
      toast.error(error.response?.data?.message || '載入考勤列表時發生錯誤');
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

  const handleApproveRejectClick = (attendance: Attendance, status: 'completed' | 'rejected') => {
    const user = typeof attendance.userId === 'object' ? attendance.userId : null;
    setApprovalAction({
      id: attendance._id,
      status,
      employeeName: user?.name || '員工',
      employeeCode: user?.employeeCode || '',
    });
    setShowApprovalDialog(true);
  };

  const handleConfirmApproval = async () => {
    if (!approvalAction) return;

    try {
      await axios.patch(`/admin/attendances/${approvalAction.id}/status`, { status: approvalAction.status });
      toast.success(approvalAction.status === 'completed' ? '已批准考勤' : '已拒絕考勤');
      setShowApprovalDialog(false);
      setApprovalAction(null);
      fetchTodayAttendances();
      fetchAllAttendances();
      if (selectedAttendance && selectedAttendance._id === approvalAction.id) {
        fetchAttendanceDetail(approvalAction.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '發生錯誤');
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

  const fetchSettings = async () => {
    try {
      const response = await axios.get<ApiResponse<any>>('/admin/settings');
      if (response.data.data) {
        setSettings({
          defaultCheckInTime: response.data.data.defaultCheckInTime || '',
          defaultCheckOutTime: response.data.data.defaultCheckOutTime || '',
          allowedIPs: response.data.data.allowedIPs || [],
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchCurrentIP = async () => {
    try {
      const response = await axios.get<ApiResponse<{ currentIp: string }>>('/admin/current-ip');
      if (response.data.data) {
        setCurrentIP(response.data.data.currentIp);
      }
    } catch (error: any) {
      console.error('Error fetching current IP:', error);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      await axios.put('/admin/settings', {
        defaultCheckInTime: settings.defaultCheckInTime || undefined,
        defaultCheckOutTime: settings.defaultCheckOutTime || undefined,
        allowedIPs: settings.allowedIPs,
      });
      toast.success('設定更新成功');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '發生錯誤');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAddIP = () => {
    if (newIP.trim() && !settings.allowedIPs.includes(newIP.trim())) {
      setSettings({
        ...settings,
        allowedIPs: [...settings.allowedIPs, newIP.trim()],
      });
      setNewIP('');
    } else if (settings.allowedIPs.includes(newIP.trim())) {
      toast.error('此 IP 已在列表中');
    }
  };

  const handleAddCurrentIP = () => {
    if (currentIP && currentIP !== 'unknown' && !settings.allowedIPs.includes(currentIP)) {
      setSettings({
        ...settings,
        allowedIPs: [...settings.allowedIPs, currentIP],
      });
      toast.success(`已新增 IP ${currentIP} 到列表中`);
    } else if (settings.allowedIPs.includes(currentIP)) {
      toast.error('目前的 IP 已在列表中');
    } else if (!currentIP || currentIP === 'unknown') {
      toast.error('無法取得目前的 IP');
    }
  };

  const handleRemoveIP = (ip: string) => {
    setSettings({
      ...settings,
      allowedIPs: settings.allowedIPs.filter((i) => i !== ip),
    });
  };

  // Leave requests functions
  const fetchLeaveRequests = async () => {
    try {
      setLeaveRequestLoading(true);
      const params = new URLSearchParams({
        page: leaveRequestPagination.page.toString(),
        limit: leaveRequestPagination.limit.toString(),
      });
      if (leaveRequestFilters.status) params.append('status', leaveRequestFilters.status);
      if (leaveRequestFilters.startDate) params.append('startDate', leaveRequestFilters.startDate);
      if (leaveRequestFilters.endDate) params.append('endDate', leaveRequestFilters.endDate);

      const response = await axios.get<PaginationResponse<LeaveRequest>>(
        `/admin/leave-requests?${params.toString()}`
      );
      // Ensure all user objects have id field
      const requests = response.data.data.map((req: any) => {
        if (req.userId && typeof req.userId === 'object') {
          req.userId = { ...req.userId, id: req.userId.id || req.userId._id || '' };
        }
        if (req.supportingStaff) {
          req.supportingStaff = req.supportingStaff.map((staff: any) => {
            if (typeof staff === 'object') {
              return { ...staff, id: staff.id || staff._id || '' };
            }
            return staff;
          });
        }
        if (req.reviewedBy && typeof req.reviewedBy === 'object') {
          req.reviewedBy = { ...req.reviewedBy, id: req.reviewedBy.id || req.reviewedBy._id || '' };
        }
        return req;
      });
      setLeaveRequests(requests);
      setLeaveRequestPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
      toast.error(error.response?.data?.message || '載入請假單列表時發生錯誤');
    } finally {
      setLeaveRequestLoading(false);
    }
  };

  const handleViewLeaveRequestDetail = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setShowDetailDialog(true);
  };

  const handleApproveLeaveRequest = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setShowApproveDialog(true);
  };

  const handleRejectLeaveRequest = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedLeaveRequest) return;

    try {
      setLeaveRequestActionLoading(true);
      await axios.patch<ApiResponse<LeaveRequest>>(
        `/admin/leave-requests/${selectedLeaveRequest._id}/approve`
      );
      toast.success('批准請假單成功');
      setShowApproveDialog(false);
      setSelectedLeaveRequest(null);
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '批准請假單時發生錯誤');
    } finally {
      setLeaveRequestActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedLeaveRequest || !rejectionReason.trim()) {
      toast.error('請輸入拒絕理由');
      return;
    }

    try {
      setLeaveRequestActionLoading(true);
      await axios.patch<ApiResponse<LeaveRequest>>(
        `/admin/leave-requests/${selectedLeaveRequest._id}/reject`,
        { rejectionReason }
      );
      toast.success('拒絕請假單成功');
      setShowRejectDialog(false);
      setSelectedLeaveRequest(null);
      setRejectionReason('');
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '拒絕請假單時發生錯誤');
    } finally {
      setLeaveRequestActionLoading(false);
    }
  };

  const getLeaveRequestStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">待審核</Badge>;
      case 'approved':
        return <Badge variant="success">已批准</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒絕</Badge>;
      default:
        return null;
    }
  };

  const getLeaveTypeText = (type: LeaveRequest['leaveType']) => {
    switch (type) {
      case 'half-day-morning':
        return '上午半天';
      case 'half-day-afternoon':
        return '下午半天';
      case 'full-day':
        return '全天';
      default:
        return type;
    }
  };

  const getSupportingStaffNames = (request: LeaveRequest) => {
    if (!request.supportingStaff || request.supportingStaff.length === 0) return [];
    return request.supportingStaff
      .filter((staff): staff is User => typeof staff !== 'string')
      .map((staff) => staff.name);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData: any = {
        employeeCode: employeeForm.employeeCode,
        name: employeeForm.name,
        email: employeeForm.email,
        role: employeeForm.role,
        customCheckInTime: employeeForm.customCheckInTime || undefined,
        customCheckOutTime: employeeForm.customCheckOutTime || undefined,
      };
      
      if (!editingEmployee) {
        formData.password = employeeForm.password;
      }

      if (editingEmployee) {
        await axios.put(`/admin/users/${editingEmployee.id}`, formData);
        toast.success('更新員工成功');
      } else {
        await axios.post('/admin/users', formData);
        toast.success('建立員工成功');
      }
      setShowEmployeeForm(false);
      setEditingEmployee(null);
      setEmployeeForm({ 
        employeeCode: '', 
        name: '', 
        email: '', 
        password: '', 
        role: 'employee',
        customCheckInTime: '',
        customCheckOutTime: '',
      });
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
      customCheckInTime: employee.customCheckInTime || '',
      customCheckOutTime: employee.customCheckOutTime || '',
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
      status: '',
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
              { id: 'leave-requests' as TabType, label: '請假單', icon: FileText },
              { id: 'notifications' as TabType, label: '通知', icon: Bell },
              { id: 'settings' as TabType, label: '設定', icon: Settings },
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
                                  : attendance.status === 'rejected'
                                  ? 'destructive'
                                  : attendance.status === 'pending'
                                  ? 'warning'
                                  : 'outline'
                              }
                            >
                              {attendance.status === 'completed'
                                ? '已批准'
                                : attendance.status === 'rejected'
                                ? '已拒絕'
                                : attendance.status === 'pending'
                                ? '待審核'
                                : '缺勤'}
                            </Badge>
                            {(attendance.hasDeviceAlert || attendance.hasIpAlert || attendance.hasTimeAlert) && (
                              <span 
                                title={
                                  (attendance.hasTimeAlert 
                                    ? attendance.timeAlertMessage || '時間警告'
                                    : attendance.alertMessage || '有警告') +
                                  (attendance.fraudReason ? `\n\n理由：${attendance.fraudReason}` : '')
                                } 
                                className="inline-flex"
                              >
                                <AlertTriangle 
                                  className={`w-4 h-4 ${
                                    attendance.hasTimeAlert 
                                      ? 'text-red-600' 
                                      : 'text-yellow-600'
                                  }`} 
                                />
                              </span>
                            )}
                            {attendance.fraudReason && (
                              <span 
                                title={`理由：${attendance.fraudReason}`}
                                className="inline-flex"
                              >
                                <span className="text-xs text-blue-600" title={attendance.fraudReason}>
                                  📝
                                </span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchAttendanceDetail(attendance._id)}
                              title="查看詳情"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {attendance.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveRejectClick(attendance, 'completed')}
                                  title="批准"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApproveRejectClick(attendance, 'rejected')}
                                  title="拒絕"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
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
                    
                    {/* Custom Time Settings Section */}
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-semibold mb-4">設定個人考勤時間</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        若未設定，將使用系統預設時間。
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            個人上班時間 (HH:mm)
                          </label>
                          <input
                            type="time"
                            className="w-full px-3 py-2 border rounded-md"
                            value={employeeForm.customCheckInTime}
                            onChange={(e) =>
                              setEmployeeForm({ ...employeeForm, customCheckInTime: e.target.value })
                            }
                            placeholder="例如：09:00"
                          />
                          <p className="text-xs text-gray-500 mt-1">若使用預設時間請留空</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            個人下班時間 (HH:mm)
                          </label>
                          <input
                            type="time"
                            className="w-full px-3 py-2 border rounded-md"
                            value={employeeForm.customCheckOutTime}
                            onChange={(e) =>
                              setEmployeeForm({ ...employeeForm, customCheckOutTime: e.target.value })
                            }
                            placeholder="例如：18:00"
                          />
                          <p className="text-xs text-gray-500 mt-1">若使用預設時間請留空</p>
                        </div>
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
                          setEmployeeForm({ 
                            employeeCode: '', 
                            name: '', 
                            email: '', 
                            password: '', 
                            role: 'employee',
                            customCheckInTime: '',
                            customCheckOutTime: '',
                          });
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
                          <TableHead>名稱</TableHead>
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
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
                    <label className="block text-sm font-medium mb-2">狀態</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={filters.status}
                      onChange={(e) => {
                        setFilters({ ...filters, status: e.target.value });
                        setAttendancePage(1);
                      }}
                    >
                      <option value="">全部</option>
                      <option value="pending">待審核</option>
                      <option value="completed">已批准</option>
                      <option value="rejected">已拒絕</option>
                      <option value="absent">缺勤</option>
                    </select>
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
                                      : attendance.status === 'rejected'
                                      ? 'destructive'
                                      : attendance.status === 'pending'
                                      ? 'warning'
                                      : 'outline'
                                  }
                                >
                                  {attendance.status === 'completed'
                                    ? '已批准'
                                    : attendance.status === 'rejected'
                                    ? '已拒絕'
                                    : attendance.status === 'pending'
                                    ? '待審核'
                                    : '缺勤'}
                                </Badge>
                                {(attendance.hasDeviceAlert || attendance.hasIpAlert || attendance.hasTimeAlert) && (
                                  <span 
                                    title={
                                      (attendance.hasTimeAlert 
                                        ? attendance.timeAlertMessage || '時間警告'
                                        : attendance.alertMessage || '有警告') +
                                      (attendance.fraudReason ? `\n\n理由：${attendance.fraudReason}` : '')
                                    } 
                                    className="inline-flex"
                                  >
                                    <AlertTriangle 
                                      className={`w-4 h-4 ${
                                        attendance.hasTimeAlert 
                                          ? 'text-red-600' 
                                          : 'text-yellow-600'
                                      }`} 
                                    />
                                  </span>
                                )}
                                {attendance.fraudReason && (
                                  <span 
                                    title={`理由：${attendance.fraudReason}`}
                                    className="inline-flex"
                                  >
                                    <span className="text-xs text-blue-600" title={attendance.fraudReason}>
                                      📝
                                    </span>
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fetchAttendanceDetail(attendance._id)}
                                  title="查看詳情"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {attendance.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleApproveRejectClick(attendance, 'completed')}
                                      title="批准"
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleApproveRejectClick(attendance, 'rejected')}
                                      title="拒絕"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
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

        {/* Leave Requests Tab */}
        {activeTab === 'leave-requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">請假單管理</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">待審核</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {leaveRequests.filter((r) => r.status === 'pending').length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">已批准</p>
                      <p className="text-2xl font-bold text-green-600">
                        {leaveRequests.filter((r) => r.status === 'approved').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">已拒絕</p>
                      <p className="text-2xl font-bold text-red-600">
                        {leaveRequests.filter((r) => r.status === 'rejected').length}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  篩選
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      狀態
                    </label>
                    <select
                      value={leaveRequestFilters.status}
                      onChange={(e) => {
                        setLeaveRequestFilters({ ...leaveRequestFilters, status: e.target.value });
                        setLeaveRequestPagination({ ...leaveRequestPagination, page: 1 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">全部</option>
                      <option value="pending">待審核</option>
                      <option value="approved">已批准</option>
                      <option value="rejected">已拒絕</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      從
                    </label>
                    <Input
                      type="date"
                      value={leaveRequestFilters.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLeaveRequestFilters({ ...leaveRequestFilters, startDate: e.target.value });
                        setLeaveRequestPagination({ ...leaveRequestPagination, page: 1 });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      至
                    </label>
                    <Input
                      type="date"
                      value={leaveRequestFilters.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLeaveRequestFilters({ ...leaveRequestFilters, endDate: e.target.value });
                        setLeaveRequestPagination({ ...leaveRequestPagination, page: 1 });
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLeaveRequestFilters({ status: '', startDate: '', endDate: '' });
                        setLeaveRequestPagination({ ...leaveRequestPagination, page: 1 });
                      }}
                      className="w-full"
                    >
                      清除篩選
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Requests List */}
            {leaveRequestLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-600">載入中...</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">無請假單</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => {
                  const supportingStaff = getSupportingStaffNames(request);
                  const requestUser =
                    typeof request.userId === 'string' ? null : request.userId;

                  return (
                    <Card key={request._id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {requestUser ? requestUser.name : 'N/A'} -{' '}
                                {formatDate(new Date(request.leaveDate))}
                              </h3>
                              {getLeaveRequestStatusBadge(request.status)}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              {requestUser && (
                                <div className="flex items-center gap-2">
                                  <UserIcon className="w-4 h-4" />
                                  <span>
                                    {requestUser.employeeCode} - {requestUser.email}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{getLeaveTypeText(request.leaveType)}</span>
                              </div>
                              <div>
                                <strong>理由：</strong> {request.reason}
                              </div>
                              {supportingStaff.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <UserIcon className="w-4 h-4" />
                                  <span className="font-medium">代理人：</span>
                                  {supportingStaff.map((name, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {request.status === 'rejected' && request.rejectionReason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle className="w-4 h-4" />
                                    <strong>拒絕理由：</strong>
                                  </div>
                                  <p className="text-red-600 mt-1">{request.rejectionReason}</p>
                                </div>
                              )}
                              {request.reviewedBy &&
                                typeof request.reviewedBy !== 'string' && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    由 {request.reviewedBy.name} 於{' '}
                                    {request.reviewedAt
                                      ? formatDate(new Date(request.reviewedAt))
                                      : ''} {request.status === 'approved' ? '批准' : '拒絕'}
                                  </div>
                                )}
                              <div className="text-xs text-gray-400 mt-2">
                                建立時間：{formatDate(new Date(request.createdAt))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewLeaveRequestDetail(request)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              詳情
                            </Button>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApproveLeaveRequest(request)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  批准
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRejectLeaveRequest(request)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  拒絕
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {leaveRequestPagination.pages > 1 && (
              <Pagination
                currentPage={leaveRequestPagination.page}
                totalPages={leaveRequestPagination.pages}
                onPageChange={(page) =>
                  setLeaveRequestPagination({ ...leaveRequestPagination, page })
                }
                pageSize={leaveRequestPagination.limit}
                onPageSizeChange={(size) => {
                  setLeaveRequestPagination({
                    ...leaveRequestPagination,
                    limit: size,
                    page: 1,
                  });
                }}
                totalItems={leaveRequestPagination.total}
              />
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">系統設定</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>設定預設考勤時間</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>注意：</strong> 此設定將適用於所有未設定個人考勤時間的員工。
                      您可以在編輯員工時為個別員工設定專屬時間。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        預設上班時間 (HH:mm)
                      </label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border rounded-md"
                        value={settings.defaultCheckInTime}
                        onChange={(e) =>
                          setSettings({ ...settings, defaultCheckInTime: e.target.value })
                        }
                        placeholder="例如：08:00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        所有員工的預設上班時間
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        預設下班時間 (HH:mm)
                      </label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border rounded-md"
                        value={settings.defaultCheckOutTime}
                        onChange={(e) =>
                          setSettings({ ...settings, defaultCheckOutTime: e.target.value })
                        }
                        placeholder="例如：17:00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        所有員工的預設下班時間
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button type="submit" disabled={settingsLoading}>
                      {settingsLoading ? '儲存中...' : '儲存設定'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fetchSettings()}
                    >
                      取消
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* IP Whitelist Management */}
            <Card>
              <CardHeader>
                <CardTitle>IP 白名單管理</CardTitle>
                <CardDescription>
                  新增允許打卡的 IP 列表。若列表為空，系統將不檢查 IP 白名單。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>注意：</strong> 啟用 IP 白名單後，員工只能從列表中的 IP 進行打卡。
                      如果從其他 IP 打卡，系統將會偵測為異常並要求輸入理由。
                    </p>
                  </div>

                  {/* Current IP Display */}
                  {currentIP && currentIP !== 'unknown' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">您目前的 IP：</p>
                          <p className="font-mono text-lg text-gray-900">{currentIP}</p>
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleAddCurrentIP}
                          disabled={settings.allowedIPs.includes(currentIP)}
                          variant={settings.allowedIPs.includes(currentIP) ? "outline" : "default"}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {settings.allowedIPs.includes(currentIP) ? '已在列表中' : '新增 IP'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="輸入 IP (例如：192.168.1.1)"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddIP();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddIP}>
                      <Plus className="w-4 h-4 mr-2" />
                      新增 IP
                    </Button>
                  </div>

                  {settings.allowedIPs.length > 0 ? (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        IP 白名單 ({settings.allowedIPs.length}):
                      </p>
                      <div className="space-y-2">
                        {settings.allowedIPs.map((ip) => (
                          <div
                            key={ip}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                          >
                            <span className="font-mono text-sm">{ip}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveIP(ip)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500">列表中無 IP</p>
                      <p className="text-sm text-gray-400 mt-1">
                        新增 IP 以開始管理白名單
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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

      {/* Approval/Rejection Confirmation Dialog */}
      <Dialog
        open={showApprovalDialog}
        onClose={() => {
          setShowApprovalDialog(false);
          setApprovalAction(null);
        }}
        title={approvalAction?.status === 'completed' ? '確認批准' : '確認拒絕'}
        showActions={false}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            您確定要{' '}
            <span className="font-semibold">
              {approvalAction?.status === 'completed' ? '批准' : '拒絕'}
            </span>{' '}
            此員工的考勤嗎：
          </p>
          {approvalAction && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900">
                {approvalAction.employeeCode} - {approvalAction.employeeName}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false);
                setApprovalAction(null);
              }}
            >
              取消
            </Button>
            <Button
              variant={approvalAction?.status === 'completed' ? 'default' : 'destructive'}
              onClick={handleConfirmApproval}
              className={approvalAction?.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {approvalAction?.status === 'completed' ? '批准' : '拒絕'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Approve Leave Request Dialog */}
      <Dialog
        open={showApproveDialog}
        onClose={() => {
          setShowApproveDialog(false);
          setSelectedLeaveRequest(null);
        }}
        title="批准請假單"
        description="您確定要批准此請假單嗎？"
        variant="default"
        onConfirm={handleConfirmApprove}
        confirmText="批准"
        cancelText="取消"
      />

      {/* Reject Leave Request Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setSelectedLeaveRequest(null);
          setRejectionReason('');
        }}
        title="拒絕請假單"
        variant="danger"
        showActions={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              拒絕理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              required
              placeholder="輸入拒絕理由..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowRejectDialog(false);
              setSelectedLeaveRequest(null);
              setRejectionReason('');
            }}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmReject}
            disabled={leaveRequestActionLoading || !rejectionReason.trim()}
          >
            {leaveRequestActionLoading ? '處理中...' : '拒絕'}
          </Button>
        </div>
      </Dialog>

      {/* Leave Request Detail Dialog */}
      <Dialog
        open={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedLeaveRequest(null);
        }}
        title="請假單詳情"
        showActions={false}
      >
        {selectedLeaveRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">員工</label>
                <div className="p-2 bg-gray-50 rounded">
                  {typeof selectedLeaveRequest.userId === 'object' ? (
                    <>
                      <p className="font-semibold">{selectedLeaveRequest.userId.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedLeaveRequest.userId.employeeCode} - {selectedLeaveRequest.userId.email}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">N/A</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">請假日期</label>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-semibold">{formatDate(new Date(selectedLeaveRequest.leaveDate))}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">請假類型</label>
                <div className="p-2 bg-gray-50 rounded">
                  <p>{getLeaveTypeText(selectedLeaveRequest.leaveType)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <div className="p-2 bg-gray-50 rounded">
                  {getLeaveRequestStatusBadge(selectedLeaveRequest.status)}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">請假理由</label>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-gray-900">{selectedLeaveRequest.reason}</p>
              </div>
            </div>
            {selectedLeaveRequest.supportingStaff && selectedLeaveRequest.supportingStaff.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">代理人</label>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex flex-wrap gap-2">
                    {getSupportingStaffNames(selectedLeaveRequest).map((name, idx) => (
                      <Badge key={idx} variant="outline">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {selectedLeaveRequest.status === 'rejected' && selectedLeaveRequest.rejectionReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">拒絕理由</label>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-900">{selectedLeaveRequest.rejectionReason}</p>
                </div>
              </div>
            )}
            {selectedLeaveRequest.reviewedBy && typeof selectedLeaveRequest.reviewedBy === 'object' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedLeaveRequest.status === 'approved' ? '批准' : '拒絕'}者
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-semibold">{selectedLeaveRequest.reviewedBy.name}</p>
                  {selectedLeaveRequest.reviewedAt && (
                    <p className="text-sm text-gray-600">
                      於 {formatDate(new Date(selectedLeaveRequest.reviewedAt))}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">建立日期</label>
                <p className="text-sm text-gray-600">
                  {formatDate(new Date(selectedLeaveRequest.createdAt))}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最後更新</label>
                <p className="text-sm text-gray-600">
                  {formatDate(new Date(selectedLeaveRequest.updatedAt))}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailDialog(false);
                  setSelectedLeaveRequest(null);
                }}
              >
                關閉
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

