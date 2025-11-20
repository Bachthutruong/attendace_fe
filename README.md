# Attendance System - Frontend

Frontend cho hệ thống chấm công nhân viên.

## Công nghệ sử dụng

- React 18
- TypeScript
- Vite
- Redux Toolkit
- React Router v6
- TailwindCSS (Shadcn UI style)
- Lucide React Icons
- Axios
- React Hot Toast

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` (tùy chọn):
```env
VITE_API_URL=http://localhost:5000/api
```

## Chạy ứng dụng

### Development mode:
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:5173

### Build cho production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

## Tính năng

### Cho nhân viên:
- ✅ Đăng nhập/Đăng ký
- ✅ Check-in/Check-out
- ✅ Xem lịch sử chấm công
- ✅ Xem thống kê cá nhân
- ✅ Nhận cảnh báo khi thiết bị/IP thay đổi

### Cho Admin:
- ✅ Dashboard tổng quan
- ✅ Quản lý nhân viên (CRUD)
- ✅ Xem danh sách chấm công hôm nay
- ✅ Xem lịch sử chấm công của tất cả nhân viên
- ✅ Hệ thống thông báo real-time
- ✅ Cảnh báo thiết bị/IP bất thường
- ✅ Thống kê chi tiết

## Cấu trúc thư mục

```
src/
├── components/       # React components
│   └── ui/          # UI components (Button, Card, Input, etc.)
├── pages/           # Page components
│   ├── LoginPage.tsx
│   ├── AttendancePage.tsx
│   └── AdminDashboard.tsx
├── store/           # Redux store
│   ├── index.ts
│   └── slices/
│       └── authSlice.ts
├── hooks/           # Custom hooks
├── lib/             # Utilities and helpers
│   ├── axios.ts     # Axios instance
│   └── utils.ts     # Helper functions
├── types/           # TypeScript types
├── App.tsx          # Main App component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## UI/UX Features

- 🎨 Modern và đẹp mắt
- 📱 Responsive design (mobile, tablet, desktop)
- 🌈 Gradient backgrounds
- 🎯 Intuitive navigation
- ⚡ Fast and smooth animations
- 🔔 Real-time toast notifications
- 🎨 Color-coded status badges
- 📊 Visual statistics



