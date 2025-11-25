import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import axios from '@/lib/axios';
import { LeaveRequest, User as UserType, ApiResponse, PaginationResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const LeaveRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);
  const [pagination, setPagination] = useState({
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
    fetchLeaveRequests();
    fetchEmployees();
  }, [pagination.page]);

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

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get<PaginationResponse<LeaveRequest>>(
        `/leave-requests/my-requests?page=${pagination.page}&limit=${pagination.limit}`
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('Đã đăng xuất');
  };

  const renderForm = () => (
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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Xin nghỉ phép</h1>
              <p className="text-sm text-gray-600">Xin chào, {user?.name}!</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/attendance')}>
                <Clock className="w-4 h-4 mr-2" />
                Chấm công
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
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách đơn nghỉ phép</h2>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn nghỉ phép
          </Button>
        </div>

        {loading ? (
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

      {/* Create Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Tạo đơn nghỉ phép"
        onConfirm={handleSubmitCreate}
        confirmText="Tạo đơn"
        showActions={false}
      >
        {renderForm()}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmitCreate} disabled={actionLoading}>
            {actionLoading ? 'Đang xử lý...' : 'Tạo đơn'}
          </Button>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedRequest(null);
        }}
        title="Sửa đơn nghỉ phép"
        showActions={false}
      >
        {renderForm()}
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

      {/* Delete Dialog */}
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

export default LeaveRequestPage;

