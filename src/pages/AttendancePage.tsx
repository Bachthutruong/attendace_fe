import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  LogOut,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
  Edit,
  Trash2,
  User as UserIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Dialog from '@/components/ui/Dialog';
import FraudDetectionDialog from '@/components/FraudDetectionDialog';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import axios from '@/lib/axios';
import { Attendance, ApiResponse, PaginationResponse, LeaveRequest, User as UserType } from '@/types';
import { formatDate, formatTime, formatHours, formatDateTime, formatTimeDifference } from '@/lib/utils';
import toast from 'react-hot-toast';

type TabType = 'attendance' | 'leave-requests';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'check-in' | 'check-out' | null>(null);
  const [showFraudDialog, setShowFraudDialog] = useState(false);
  const [fraudInfo, setFraudInfo] = useState<{
    hasDeviceAlert: boolean;
    hasIpAlert: boolean;
    message: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<'check-in' | 'check-out' | null>(null);

  // Leave requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [leaveRequestLoading, setLeaveRequestLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);
  const [leaveRequestPagination, setLeaveRequestPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [formData, setFormData] = useState({
    leaveDate: '',
    leaveType: 'full-day' as 'half-day-morning' | 'half-day-afternoon' | 'full-day',
    reason: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchTodayAttendance();
      fetchHistory();
    } else if (activeTab === 'leave-requests') {
      fetchLeaveRequests();
      fetchEmployees();
    }
  }, [activeTab, leaveRequestPagination.page, leaveRequestPagination.limit]);

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get<ApiResponse<Attendance>>('/attendance/today');
      setTodayAttendance(response.data.data || null);
    } catch (error: any) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get<PaginationResponse<Attendance>>(
        '/attendance/history?limit=10'
      );
      setHistory(response.data.data);
    } catch (error: any) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Leave requests functions
  const fetchLeaveRequests = async () => {
    try {
      setLeaveRequestLoading(true);
      const response = await axios.get<PaginationResponse<LeaveRequest>>(
        `/leave-requests/my-requests?page=${leaveRequestPagination.page}&limit=${leaveRequestPagination.limit}`
      );
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
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách đơn nghỉ phép');
    } finally {
      setLeaveRequestLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get<ApiResponse<UserType[]>>('/leave-requests/employees');
      const employeesData = (response.data.data || []).map((emp: any) => ({
        ...emp,
        id: emp.id || emp._id || '',
      }));
      setEmployees(employeesData);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.employee-select-container')) {
        setShowEmployeeSelect(false);
      }
    };

    if (showEmployeeSelect) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmployeeSelect]);

  const handleCreate = () => {
    setFormData({
      leaveDate: '',
      leaveType: 'full-day',
      reason: '',
    });
    setSelectedEmployees([]);
    setShowCreateDialog(true);
  };

  const handleEdit = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setFormData({
      leaveDate: request.leaveDate.split('T')[0],
      leaveType: request.leaveType,
      reason: request.reason,
    });
    setSelectedEmployees(
      request.supportingStaff
        ?.filter((staff): staff is UserType => typeof staff !== 'string')
        .map((staff) => staff.id) || []
    );
    setShowEditDialog(true);
  };

  const handleDelete = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDeleteDialog(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.leaveDate || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setActionLoading(true);
      await axios.post<ApiResponse<LeaveRequest>>('/leave-requests', {
        ...formData,
        supportingStaff: selectedEmployees,
      });
      toast.success('Tạo đơn nghỉ phép thành công');
      setShowCreateDialog(false);
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo đơn nghỉ phép');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.leaveDate || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await axios.put<ApiResponse<LeaveRequest>>(`/leave-requests/${selectedRequest._id}`, {
        ...formData,
        supportingStaff: selectedEmployees,
      });
      toast.success('Cập nhật đơn nghỉ phép thành công');
      setShowEditDialog(false);
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật đơn nghỉ phép');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await axios.delete(`/leave-requests/${selectedRequest._id}`);
      toast.success('Xóa đơn nghỉ phép thành công');
      setShowDeleteDialog(false);
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa đơn nghỉ phép');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="success">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Đã từ chối</Badge>;
      default:
        return null;
    }
  };

  const getLeaveTypeText = (type: LeaveRequest['leaveType']) => {
    switch (type) {
      case 'half-day-morning':
        return 'Nửa buổi sáng';
      case 'half-day-afternoon':
        return 'Nửa buổi chiều';
      case 'full-day':
        return 'Cả ngày';
      default:
        return type;
    }
  };

  const getSupportingStaffNames = (request: LeaveRequest) => {
    if (!request.supportingStaff || request.supportingStaff.length === 0) return [];
    return request.supportingStaff
      .filter((staff): staff is UserType => typeof staff !== 'string')
      .map((staff) => staff.name);
  };

  const handleCheckInClick = () => {
    setConfirmAction('check-in');
    setShowConfirmDialog(true);
  };

  const handleCheckOutClick = () => {
    setConfirmAction('check-out');
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    // Close confirm dialog first
    setShowConfirmDialog(false);
    
    // Pre-check for fraud
    try {
      setActionLoading(true);
      const preCheckResponse = await axios.get<any>(
        `/attendance/pre-check-fraud?type=${confirmAction}`
      );
      
      // Check if fraud was detected
      if (preCheckResponse.data.data?.fraud?.detected || preCheckResponse.data.fraud?.detected) {
        const fraud = preCheckResponse.data.data?.fraud || preCheckResponse.data.fraud;
        setFraudInfo({
          hasDeviceAlert: fraud.hasDeviceAlert,
          hasIpAlert: fraud.hasIpAlert,
          message: fraud.message,
        });
        setPendingAction(confirmAction);
        setShowFraudDialog(true);
      } else {
        // No fraud, proceed normally
        if (confirmAction === 'check-in') {
          await handleConfirmCheckIn();
        } else {
          await handleConfirmCheckOut();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      // If pre-check fails, still try to proceed
      if (confirmAction === 'check-in') {
        await handleConfirmCheckIn();
      } else {
        await handleConfirmCheckOut();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleFraudConfirm = (reason: string) => {
    if (pendingAction === 'check-in') {
      handleConfirmCheckIn(reason);
    } else if (pendingAction === 'check-out') {
      handleConfirmCheckOut(reason);
    }
  };

  const handleFraudCancel = () => {
    setShowFraudDialog(false);
    setFraudInfo(null);
    setPendingAction(null);
    // Refresh today's attendance to reset state
    fetchTodayAttendance();
  };

  const handleConfirmCheckIn = async (fraudReason?: string) => {
    try {
      setActionLoading(true);
      const response = await axios.post<ApiResponse<Attendance>>('/attendance/check-in', {
        fraudReason,
      });
      setTodayAttendance(response.data.data!);
      toast.success('Check-in thành công! ✅');
      
      const attendance = response.data.data;
      if (attendance?.hasDeviceAlert || attendance?.hasIpAlert || attendance?.hasTimeAlert) {
        let alertMsg = attendance.alertMessage || '';
        if (attendance.hasTimeAlert && attendance.timeAlertMessage) {
          alertMsg = attendance.timeAlertMessage;
        }
        toast.error(`⚠️ Cảnh báo: ${alertMsg}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi check-in');
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setShowFraudDialog(false);
      setFraudInfo(null);
      setPendingAction(null);
    }
  };

  const handleConfirmCheckOut = async (fraudReason?: string) => {
    try {
      setActionLoading(true);
      const response = await axios.post<ApiResponse<Attendance>>('/attendance/check-out', {
        fraudReason,
      });
      setTodayAttendance(response.data.data!);
      toast.success('Check-out thành công! 👋');
      
      const attendance = response.data.data;
      if (attendance?.hasDeviceAlert || attendance?.hasIpAlert || attendance?.hasTimeAlert) {
        let alertMsg = attendance.alertMessage || '';
        if (attendance.hasTimeAlert && attendance.timeAlertMessage) {
          alertMsg = attendance.timeAlertMessage;
        }
        toast.error(`⚠️ Cảnh báo: ${alertMsg}`);
      }
      
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi check-out');
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setShowFraudDialog(false);
      setFraudInfo(null);
      setPendingAction(null);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('Đã đăng xuất');
  };

  const canCheckIn = !todayAttendance?.checkIn;
  const canCheckOut = todayAttendance?.checkIn && !todayAttendance?.checkOut;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
              <p className="text-sm text-gray-600">Xin chào, {user?.name}!</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
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
              { id: 'attendance' as TabType, label: 'Chấm công', icon: Clock },
              { id: 'leave-requests' as TabType, label: 'Nghỉ phép', icon: FileText },
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
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Check-in/Check-out Card */}
              <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  Chấm công hôm nay
                </CardTitle>
                <CardDescription>
                  {formatDate(new Date())}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-center py-8">
                  {!todayAttendance?.checkIn ? (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">
                        Chưa chấm công
                      </p>
                      <p className="text-sm text-gray-600">
                        Nhấn nút bên dưới để check-in
                      </p>
                    </div>
                  ) : !todayAttendance.checkOut ? (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">
                        Đang làm việc
                      </p>
                      <p className="text-sm text-gray-600">
                        Check-in lúc: {formatTime(todayAttendance.checkIn.time)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      {todayAttendance.status === 'completed' ? (
                        <>
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-purple-600" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            Đã được phê duyệt
                          </p>
                          <p className="text-sm text-gray-600">
                            Thời gian làm việc: {formatHours(todayAttendance.workedHours || 0)}
                          </p>
                        </>
                      ) : todayAttendance.status === 'rejected' ? (
                        <>
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-red-600" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            Đã bị từ chối
                          </p>
                          <p className="text-sm text-gray-600">
                            Chấm công của bạn đã bị từ chối bởi admin
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-12 h-12 text-yellow-600" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            Chờ phê duyệt
                          </p>
                          <p className="text-sm text-gray-600">
                            Thời gian làm việc: {formatHours(todayAttendance.workedHours || 0)}
                          </p>
                          <p className="text-xs text-yellow-600 mt-2">
                            Đang chờ admin phê duyệt
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Alert */}
                {todayAttendance && (todayAttendance.hasDeviceAlert || todayAttendance.hasIpAlert || todayAttendance.hasTimeAlert) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">Cảnh báo</p>
                      {todayAttendance.hasTimeAlert && todayAttendance.timeAlertMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-semibold text-red-900">⚠️ Cảnh báo thời gian:</p>
                          <p className="text-sm text-red-800 mt-1">{todayAttendance.timeAlertMessage}</p>
                          {todayAttendance.checkInLateMinutes && (
                            <p className="text-xs text-red-700 mt-1">
                              Check-in muộn: {formatTimeDifference(todayAttendance.checkInLateMinutes)}
                            </p>
                          )}
                          {todayAttendance.checkOutEarlyMinutes && (
                            <p className="text-xs text-red-700 mt-1">
                              Check-out sớm: {formatTimeDifference(todayAttendance.checkOutEarlyMinutes)}
                            </p>
                          )}
                        </div>
                      )}
                      {todayAttendance.alertMessage && (
                        <p className="text-sm text-yellow-800 mt-2">{todayAttendance.alertMessage}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {canCheckIn && (
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleCheckInClick}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {actionLoading ? 'Đang xử lý...' : 'Check-in'}
                    </Button>
                  )}
                  
                  {canCheckOut && (
                    <Button
                      className="flex-1"
                      size="lg"
                      variant="secondary"
                      onClick={handleCheckOutClick}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      {actionLoading ? 'Đang xử lý...' : 'Check-out'}
                    </Button>
                  )}
                </div>

                {/* Time Info */}
                {todayAttendance && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {todayAttendance.checkIn && (
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-semibold text-gray-900">
                          {formatTime(todayAttendance.checkIn.time)}
                        </p>
                      </div>
                    )}
                    {todayAttendance.checkOut && (
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-semibold text-gray-900">
                          {formatTime(todayAttendance.checkOut.time)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Stats Card */}
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Thống kê
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng ngày làm</span>
                  <span className="font-semibold text-gray-900">{history.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hoàn thành</span>
                  <span className="font-semibold text-green-600">
                    {history.filter((a) => a.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng giờ làm</span>
                  <span className="font-semibold text-gray-900">
                    {formatHours(history.reduce((sum, a) => sum + (a.workedHours || 0), 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
            </div>
            </div>

            {/* History */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  Lịch sử chấm công
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-600">Đang tải...</p>
                ) : history.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">Chưa có lịch sử chấm công</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-in</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-out</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Giờ làm</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((attendance) => (
                          <tr key={attendance._id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{formatDate(attendance.date)}</td>
                            <td className="py-3 px-4">
                              {attendance.checkIn ? formatTime(attendance.checkIn.time) : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {attendance.checkOut ? formatTime(attendance.checkOut.time) : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {attendance.workedHours ? formatHours(attendance.workedHours) : '-'}
                            </td>
                            <td className="py-3 px-4">
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
                                  ? 'Đã phê duyệt'
                                  : attendance.status === 'rejected'
                                  ? 'Đã từ chối'
                                  : attendance.status === 'pending'
                                  ? 'Chờ duyệt'
                                  : 'Vắng'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leave Requests Tab */}
        {activeTab === 'leave-requests' && (
          <div className="space-y-6">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Danh sách đơn nghỉ phép</h2>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo đơn nghỉ phép
              </Button>
            </div>

            {leaveRequestLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chưa có đơn nghỉ phép nào</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {leaveRequests.map((request) => {
                    const supportingStaff = getSupportingStaffNames(request);

                    return (
                      <Card key={request._id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {formatDate(new Date(request.leaveDate))}
                                </h3>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{getLeaveTypeText(request.leaveType)}</span>
                                </div>
                                <div>
                                  <strong>Lý do:</strong> {request.reason}
                                </div>
                                {supportingStaff.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap mt-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span className="font-medium">Nhân viên hỗ trợ:</span>
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
                                      <strong>Lý do từ chối:</strong>
                                    </div>
                                    <p className="text-red-600 mt-1">{request.rejectionReason}</p>
                                  </div>
                                )}
                                {request.reviewedBy &&
                                  typeof request.reviewedBy !== 'string' && (
                                    <div className="text-xs text-gray-500 mt-2">
                                      Đã {request.status === 'approved' ? 'duyệt' : 'từ chối'} bởi:{' '}
                                      {request.reviewedBy.name} vào{' '}
                                      {request.reviewedAt
                                        ? formatDate(new Date(request.reviewedAt))
                                        : ''}
                                    </div>
                                  )}
                              </div>
                            </div>
                            {request.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(request)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Sửa
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(request)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Xóa
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

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
              </>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }}
        title={
          confirmAction === 'check-in'
            ? 'Xác nhận Check-in'
            : 'Xác nhận Check-out'
        }
        description={
          confirmAction === 'check-in'
            ? 'Bạn có chắc chắn muốn check-in ngay bây giờ?'
            : 'Bạn có chắc chắn muốn check-out ngay bây giờ?'
        }
        confirmText={confirmAction === 'check-in' ? 'Xác nhận Check-in' : 'Xác nhận Check-out'}
        cancelText="Hủy"
        onConfirm={handleConfirmAction}
        variant="default"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Thông tin chấm công</p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>📅 Ngày: <span className="font-semibold">{formatDate(new Date())}</span></p>
                  <p>⏰ Thời gian: <span className="font-semibold">{formatDateTime(new Date())}</span></p>
                  <p>👤 Nhân viên: <span className="font-semibold">{user?.name}</span></p>
                  <p>🆔 Mã NV: <span className="font-semibold">{user?.employeeCode}</span></p>
                </div>
              </div>
            </div>
          </div>

          {confirmAction === 'check-out' && todayAttendance?.checkIn && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">Thông tin Check-in</p>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>⏰ Check-in lúc: <span className="font-semibold">{formatDateTime(todayAttendance.checkIn.time)}</span></p>
                    <p>🌐 IP: <span className="font-mono">{todayAttendance.checkIn.ipAddress}</span></p>
                    <p>💻 Thiết bị: <span className="font-semibold">{todayAttendance.checkIn.deviceInfo.browser} trên {todayAttendance.checkIn.deviceInfo.os}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                {confirmAction === 'check-in'
                  ? 'Sau khi check-in, bạn sẽ không thể check-in lại trong ngày hôm nay.'
                  : 'Sau khi check-out, bạn sẽ hoàn thành chấm công cho ngày hôm nay.'}
              </p>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Fraud Detection Dialog */}
      {fraudInfo && (
        <FraudDetectionDialog
          open={showFraudDialog}
          onClose={handleFraudCancel}
          onConfirm={handleFraudConfirm}
          onCancel={handleFraudCancel}
          type={pendingAction || 'check-in'}
          fraudInfo={fraudInfo}
        />
      )}

      {/* Create Leave Request Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Tạo đơn nghỉ phép"
        showActions={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày nghỉ <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.leaveDate}
              onChange={(e) => setFormData({ ...formData, leaveDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại nghỉ phép <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="leaveType"
                  value="full-day"
                  checked={formData.leaveType === 'full-day'}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span>Cả ngày</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="leaveType"
                  value="half-day-morning"
                  checked={formData.leaveType === 'half-day-morning'}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span>Nửa buổi sáng</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="leaveType"
                  value="half-day-afternoon"
                  checked={formData.leaveType === 'half-day-afternoon'}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span>Nửa buổi chiều</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do nghỉ phép <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              required
              placeholder="Nhập lý do nghỉ phép..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhân viên hỗ trợ (tùy chọn)
            </label>
            <div className="relative employee-select-container">
              <div
                className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[40px] cursor-pointer"
                onClick={() => setShowEmployeeSelect(!showEmployeeSelect)}
              >
                {selectedEmployees.length === 0 ? (
                  <span className="text-gray-500 text-sm">Chọn nhân viên hỗ trợ...</span>
                ) : (
                  selectedEmployees.map((empId) => {
                    const emp = employees.find((e) => e.id === empId);
                    return emp ? (
                      <Badge key={empId} variant="outline" className="flex items-center gap-1">
                        {emp.name}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEmployee(empId);
                          }}
                        />
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
              {showEmployeeSelect && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-gray-500">{emp.employeeCode}</div>
                      </div>
                      {selectedEmployees.includes(emp.id) && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmitCreate} disabled={actionLoading}>
            {actionLoading ? 'Đang xử lý...' : 'Tạo đơn'}
          </Button>
        </div>
      </Dialog>

      {/* Edit Leave Request Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedRequest(null);
        }}
        title="Sửa đơn nghỉ phép"
        showActions={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày nghỉ <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.leaveDate}
              onChange={(e) => setFormData({ ...formData, leaveDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại nghỉ phép <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="leaveType"
                  value="full-day"
                  checked={formData.leaveType === 'full-day'}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span>Cả ngày</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="leaveType"
                  value="half-day-morning"
                  checked={formData.leaveType === 'half-day-morning'}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span>Nửa buổi sáng</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="leaveType"
                  value="half-day-afternoon"
                  checked={formData.leaveType === 'half-day-afternoon'}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value as any })
                  }
                  className="w-4 h-4 text-primary"
                />
                <span>Nửa buổi chiều</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do nghỉ phép <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              required
              placeholder="Nhập lý do nghỉ phép..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhân viên hỗ trợ (tùy chọn)
            </label>
            <div className="relative employee-select-container">
              <div
                className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[40px] cursor-pointer"
                onClick={() => setShowEmployeeSelect(!showEmployeeSelect)}
              >
                {selectedEmployees.length === 0 ? (
                  <span className="text-gray-500 text-sm">Chọn nhân viên hỗ trợ...</span>
                ) : (
                  selectedEmployees.map((empId) => {
                    const emp = employees.find((e) => e.id === empId);
                    return emp ? (
                      <Badge key={empId} variant="outline" className="flex items-center gap-1">
                        {emp.name}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEmployee(empId);
                          }}
                        />
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
              {showEmployeeSelect && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-gray-500">{emp.employeeCode}</div>
                      </div>
                      {selectedEmployees.includes(emp.id) && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowEditDialog(false);
              setSelectedRequest(null);
            }}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmitEdit} disabled={actionLoading}>
            {actionLoading ? 'Đang xử lý...' : 'Cập nhật'}
          </Button>
        </div>
      </Dialog>

      {/* Delete Leave Request Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedRequest(null);
        }}
        title="Xóa đơn nghỉ phép"
        description="Bạn có chắc chắn muốn xóa đơn nghỉ phép này?"
        variant="danger"
        onConfirm={handleConfirmDelete}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </div>
  );
};

export default AttendancePage;


