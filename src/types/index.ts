export interface User {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  isActive?: boolean;
  defaultCheckInTime?: string; // Format: "HH:mm", e.g., "08:00"
  defaultCheckOutTime?: string; // Format: "HH:mm", e.g., "17:00"
  customCheckInTime?: string; // Format: "HH:mm", overrides default for this employee
  customCheckOutTime?: string; // Format: "HH:mm", overrides default for this employee
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: string;
  userAgent?: string; // Full user agent string for detailed comparison
}

export interface AttendanceRecord {
  type: 'check-in' | 'check-out';
  time: string;
  ipAddress: string;
  deviceInfo: DeviceInfo;
  location?: string;
}

export interface Attendance {
  _id: string;
  userId: User | string;
  date: string;
  checkIn?: AttendanceRecord;
  checkOut?: AttendanceRecord;
  workedHours?: number;
  status: 'pending' | 'completed' | 'absent' | 'rejected';
  hasDeviceAlert: boolean;
  hasIpAlert: boolean;
  alertMessage?: string;
  hasTimeAlert?: boolean;
  timeAlertMessage?: string;
  checkInLateMinutes?: number;
  checkOutEarlyMinutes?: number;
  fraudReason?: string; // Reason provided when fraud is detected
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'check-in' | 'check-out' | 'alert';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    attendanceId?: string;
    ipAddress?: string;
    deviceInfo?: string;
    timestamp?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  completedDays: number;
  pendingDays: number;
  totalWorkedHours: number;
  averageWorkedHours: number;
  alertCount: number;
  deviceAlertCount: number;
  ipAlertCount: number;
}

export interface TodayAttendanceResponse {
  attendances: Attendance[];
  absentEmployees: User[];
  stats: {
    total: number;
    present: number;
    absent: number;
    completed: number;
    pending: number;
    withAlerts: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LeaveRequest {
  _id: string;
  userId: User | string;
  leaveDate: string;
  leaveType: 'half-day-morning' | 'half-day-afternoon' | 'full-day';
  reason: string;
  supportingStaff?: (User | string)[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: User | string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

