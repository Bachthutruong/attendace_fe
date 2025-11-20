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
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Dialog from '@/components/ui/Dialog';
import axios from '@/lib/axios';
import { Attendance, ApiResponse, PaginationResponse } from '@/types';
import { formatDate, formatTime, formatHours, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'check-in' | 'check-out' | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchTodayAttendance();
    fetchHistory();
  }, []);

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

  const handleCheckInClick = () => {
    setConfirmAction('check-in');
    setShowConfirmDialog(true);
  };

  const handleCheckOutClick = () => {
    setConfirmAction('check-out');
    setShowConfirmDialog(true);
  };

  const handleConfirmCheckIn = async () => {
    try {
      setActionLoading(true);
      const response = await axios.post<ApiResponse<Attendance>>('/attendance/check-in');
      setTodayAttendance(response.data.data!);
      toast.success('Check-in thành công! ✅');
      
      if (response.data.data?.hasDeviceAlert || response.data.data?.hasIpAlert) {
        toast.error(`⚠️ Cảnh báo: ${response.data.data.alertMessage}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi check-in');
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmCheckOut = async () => {
    try {
      setActionLoading(true);
      const response = await axios.post<ApiResponse<Attendance>>('/attendance/check-out');
      setTodayAttendance(response.data.data!);
      toast.success('Check-out thành công! 👋');
      
      if (response.data.data?.hasDeviceAlert || response.data.data?.hasIpAlert) {
        toast.error(`⚠️ Cảnh báo: ${response.data.data.alertMessage}`);
      }
      
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi check-out');
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
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
              <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>
              <p className="text-sm text-gray-600">Xin chào, {user?.name}!</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {todayAttendance && (todayAttendance.hasDeviceAlert || todayAttendance.hasIpAlert) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">Cảnh báo</p>
                      <p className="text-sm text-yellow-800">{todayAttendance.alertMessage}</p>
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
        onConfirm={
          confirmAction === 'check-in' ? handleConfirmCheckIn : handleConfirmCheckOut
        }
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
    </div>
  );
};

export default AttendancePage;


