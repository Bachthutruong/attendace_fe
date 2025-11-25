import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import axios from '@/lib/axios';
import { LeaveRequest, User as UserType, ApiResponse, PaginationResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const AdminLeaveRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/attendance');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [pagination.page, filters]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

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
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách đơn nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleReject = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await axios.patch<ApiResponse<LeaveRequest>>(
        `/admin/leave-requests/${selectedRequest._id}/approve`
      );
      toast.success('Duyệt đơn nghỉ phép thành công');
      setShowApproveDialog(false);
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt đơn nghỉ phép');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setActionLoading(true);
      await axios.patch<ApiResponse<LeaveRequest>>(
        `/admin/leave-requests/${selectedRequest._id}/reject`,
        { rejectionReason }
      );
      toast.success('Từ chối đơn nghỉ phép thành công');
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối đơn nghỉ phép');
    } finally {
      setActionLoading(false);
    }
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('Đã đăng xuất');
  };

  const stats = {
    pending: leaveRequests.filter((r) => r.status === 'pending').length,
    approved: leaveRequests.filter((r) => r.status === 'approved').length,
    rejected: leaveRequests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn nghỉ phép</h1>
              <p className="text-sm text-gray-600">Xin chào, {user?.name}!</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã duyệt</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã từ chối</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Đã từ chối</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters({ ...filters, endDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ status: '', startDate: '', endDate: '' });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : leaveRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có đơn nghỉ phép nào</p>
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
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {requestUser && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
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
                            <strong>Lý do:</strong> {request.reason}
                          </div>
                          {supportingStaff.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              <User className="w-4 h-4" />
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
                          <div className="text-xs text-gray-400 mt-2">
                            Tạo lúc: {formatDate(new Date(request.createdAt))}
                          </div>
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(request)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Duyệt
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Từ chối
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Trước
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Trang {pagination.page} / {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
            >
              Sau
            </Button>
          </div>
        )}
      </main>

      {/* Approve Dialog */}
      <Dialog
        open={showApproveDialog}
        onClose={() => {
          setShowApproveDialog(false);
          setSelectedRequest(null);
        }}
        title="Duyệt đơn nghỉ phép"
        description="Bạn có chắc chắn muốn duyệt đơn nghỉ phép này?"
        variant="default"
        onConfirm={handleConfirmApprove}
        confirmText="Duyệt"
        cancelText="Hủy"
      />

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title="Từ chối đơn nghỉ phép"
        variant="danger"
        showActions={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              required
              placeholder="Nhập lý do từ chối..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowRejectDialog(false);
              setSelectedRequest(null);
              setRejectionReason('');
            }}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmReject}
            disabled={actionLoading || !rejectionReason.trim()}
          >
            {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminLeaveRequestPage;

