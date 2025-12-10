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
      setError('請輸入異常理由');
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
      title="⚠️ 偵測到考勤異常"
      showActions={false}
      variant="warning"
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-2">
                系統在{type === 'check-in' ? '上班打卡' : '下班打卡'}時偵測到異常：
              </p>
              <div className="space-y-1 text-sm text-red-800">
                {fraudInfo.hasIpAlert && (
                  <p>• IP 位址不符或不在白名單中</p>
                )}
                {fraudInfo.hasDeviceAlert && (
                  <p>• 裝置與之前的考勤記錄不同</p>
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
            請輸入理由 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="例如：遠端工作、在其他分店、使用新裝置..."
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
            <strong>注意：</strong> 您必須輸入理由才能繼續{type === 'check-in' ? '上班打卡' : '下班打卡'}。 
            若未輸入理由，將無法進行打卡。
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!reason.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            送出並{type === 'check-in' ? '上班打卡' : '下班打卡'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default FraudDetectionDialog;

