import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

interface FraudDetectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  type: 'check-in' | 'check-out';
  fraudInfo: {
    hasDeviceAlert: boolean;
    hasIpAlert: boolean;
    message: string;
  };
}

const FraudDetectionDialog: React.FC<FraudDetectionDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  type,
  fraudInfo,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do khi phát hiện gian lận');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  const handleCancel = () => {
    setReason('');
    setError('');
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title="⚠️ Phát hiện gian lận chấm công"
      showActions={false}
      variant="warning"
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-2">
                Hệ thống phát hiện dấu hiệu gian lận khi {type === 'check-in' ? 'check-in' : 'check-out'}:
              </p>
              <div className="space-y-1 text-sm text-red-800">
                {fraudInfo.hasIpAlert && (
                  <p>• Địa chỉ IP không khớp hoặc không nằm trong danh sách IP xác thực</p>
                )}
                {fraudInfo.hasDeviceAlert && (
                  <p>• Thiết bị khác với các lần chấm công trước đó</p>
                )}
                {fraudInfo.message && (
                  <p className="mt-2 font-medium">{fraudInfo.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vui lòng nhập lý do <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="Ví dụ: Làm việc từ xa, đang ở chi nhánh khác, sử dụng thiết bị mới..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={4}
            required
          />
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Bạn phải nhập lý do để tiếp tục {type === 'check-in' ? 'check-in' : 'check-out'}. 
            Nếu không nhập lý do, bạn không thể thực hiện chấm công.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!reason.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            Gửi và {type === 'check-in' ? 'Check-in' : 'Check-out'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default FraudDetectionDialog;

