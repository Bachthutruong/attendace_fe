import React from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { Attendance } from '@/types';
import { formatDate, formatDateTime, formatTimeDifference } from '@/lib/utils';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface AttendanceDetailModalProps {
  attendance: Attendance | null;
  onClose: () => void;
}

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  attendance,
  onClose,
}) => {
  if (!attendance) return null;

  const user = typeof attendance.userId === 'object' ? attendance.userId : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết chấm công</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Thông tin nhân viên</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Mã nhân viên</p>
                <p className="font-semibold text-primary">{user?.employeeCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Họ và tên</p>
                <p className="font-semibold">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày</p>
                <p className="font-semibold">{formatDate(attendance.date)}</p>
              </div>
            </div>
          </div>

          {/* Status & Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Trạng thái</p>
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
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Giờ làm việc</p>
              <p className="text-xl font-bold text-green-600">
                {attendance.workedHours ? `${attendance.workedHours.toFixed(2)}h` : '-'}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Cảnh báo</p>
              {attendance.hasDeviceAlert || attendance.hasIpAlert || attendance.hasTimeAlert ? (
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Có cảnh báo
                </Badge>
              ) : (
                <Badge variant="success">Không có</Badge>
              )}
            </div>
          </div>

          {/* Time Alert Message */}
          {attendance.hasTimeAlert && attendance.timeAlertMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">⚠️ Cảnh báo thời gian</p>
                  <p className="text-sm text-red-800 mb-2">{attendance.timeAlertMessage}</p>
                  {attendance.checkInLateMinutes && (
                    <div className="mt-2 p-2 bg-red-100 rounded">
                      <p className="text-sm font-semibold text-red-900">Check-in muộn:</p>
                      <p className="text-sm text-red-800">{formatTimeDifference(attendance.checkInLateMinutes)}</p>
                    </div>
                  )}
                  {attendance.checkOutEarlyMinutes && (
                    <div className="mt-2 p-2 bg-red-100 rounded">
                      <p className="text-sm font-semibold text-red-900">Check-out sớm:</p>
                      <p className="text-sm text-red-800">{formatTimeDifference(attendance.checkOutEarlyMinutes)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Alert Message */}
          {(attendance.hasDeviceAlert || attendance.hasIpAlert) && attendance.alertMessage && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-1">Cảnh báo bảo mật</p>
                  <p className="text-sm text-yellow-800 mb-2">{attendance.alertMessage}</p>
                  {attendance.fraudReason && (
                    <div className="mt-3 pt-3 border-t border-yellow-300">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">📝 Lý do được cung cấp:</p>
                      <div className="bg-white rounded p-3 border border-yellow-200">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{attendance.fraudReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fraud Reason (if no security alert but has fraud reason) */}
          {!(attendance.hasDeviceAlert || attendance.hasIpAlert) && attendance.fraudReason && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 mb-2">📝 Lý do được cung cấp</p>
                  <div className="bg-white rounded p-3 border border-blue-200">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{attendance.fraudReason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Check-in Details */}
          {attendance.checkIn && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Check-in</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thời gian</p>
                  <p className="font-semibold">{formatDateTime(attendance.checkIn.time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Địa chỉ IP</p>
                  <p className="font-mono text-sm font-semibold">{attendance.checkIn.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trình duyệt</p>
                  <p className="font-semibold">
                    {attendance.checkIn.deviceInfo.browser} {attendance.checkIn.deviceInfo.browserVersion}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hệ điều hành</p>
                  <p className="font-semibold">
                    {attendance.checkIn.deviceInfo.os} {attendance.checkIn.deviceInfo.osVersion}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thiết bị</p>
                  <p className="font-semibold capitalize">{attendance.checkIn.deviceInfo.deviceType}</p>
                </div>
                {attendance.checkIn.deviceInfo.userAgent && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">User Agent</p>
                    <p className="font-mono text-xs bg-gray-50 p-2 rounded border break-all">
                      {attendance.checkIn.deviceInfo.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check-out Details */}
          {attendance.checkOut && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Check-out</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thời gian</p>
                  <p className="font-semibold">{formatDateTime(attendance.checkOut.time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Địa chỉ IP</p>
                  <p className="font-mono text-sm font-semibold">{attendance.checkOut.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trình duyệt</p>
                  <p className="font-semibold">
                    {attendance.checkOut.deviceInfo.browser} {attendance.checkOut.deviceInfo.browserVersion}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hệ điều hành</p>
                  <p className="font-semibold">
                    {attendance.checkOut.deviceInfo.os} {attendance.checkOut.deviceInfo.osVersion}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thiết bị</p>
                  <p className="font-semibold capitalize">{attendance.checkOut.deviceInfo.deviceType}</p>
                </div>
                {attendance.checkOut.deviceInfo.userAgent && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">User Agent</p>
                    <p className="font-mono text-xs bg-gray-50 p-2 rounded border break-all">
                      {attendance.checkOut.deviceInfo.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparison if there's alert */}
          {(attendance.hasDeviceAlert || attendance.hasIpAlert) && attendance.checkIn && attendance.checkOut && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3">So sánh Check-in & Check-out</h4>
              <div className="space-y-2 text-sm">
                {attendance.hasIpAlert && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Địa chỉ IP khác nhau:</p>
                      <p className="text-red-800">
                        Check-in: <span className="font-mono">{attendance.checkIn.ipAddress}</span> → 
                        Check-out: <span className="font-mono">{attendance.checkOut.ipAddress}</span>
                      </p>
                    </div>
                  </div>
                )}
                {attendance.hasDeviceAlert && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Thiết bị khác nhau</p>
                      <p className="text-red-800">Check-in và Check-out sử dụng thiết bị/trình duyệt khác nhau</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailModal;


