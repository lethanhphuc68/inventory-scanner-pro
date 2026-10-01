import React from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, PackageX } from 'lucide-react';

export default function ClearDataModal({
  isOpen,
  onClose,
  onClearAll,
  onResetCounts,
  totalItems,
  totalScanned
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
              <Trash2 size={22} />
            </div>
            <div>
              <h3>Tùy Chọn Xóa Dữ Liệu</h3>
              <p>Chọn thao tác xóa phù hợp với nhu cầu của bạn</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: '14px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            fontSize: '0.85rem',
            color: '#94a3b8'
          }}>
            Hiện có: <strong style={{ color: '#fff' }}>{totalItems} mặt hàng</strong> • Đã quét: <strong style={{ color: '#06b6d4' }}>{totalScanned} sản phẩm</strong>
          </div>

          {/* Option 1: Xóa trắng toàn bộ để kiểm đơn mới */}
          <div style={{
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(15, 23, 42, 0.6))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontWeight: 700, fontSize: '0.95rem' }}>
              <PackageX size={18} />
              <span>1. Xóa Trắng Toàn Bộ Đơn Hàng</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              Xóa sạch toàn bộ danh sách sản phẩm và mã lạ. Đưa ứng dụng về trạng thái trống để <strong>nạp file Excel mới</strong> hoặc <strong>Google Sheet mới</strong>.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #e11d48, #be123c)',
                boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)',
                padding: '10px',
                fontWeight: 700
              }}
              onClick={() => {
                onClearAll();
                onClose();
              }}
            >
              <Trash2 size={16} />
              <span>Xóa Hết Danh Sách (Để Nạp Đơn Mới)</span>
            </button>
          </div>

          {/* Option 2: Chỉ reset số đếm về 0 (giữ nguyên danh sách mã hàng) */}
          <div style={{
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.6))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem' }}>
              <RotateCcw size={18} />
              <span>2. Chỉ Đặt Lại Số Đếm Về 0</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              Giữ nguyên tên sản phẩm và số lượng cần xuất của đơn này. Chỉ đưa số lượng đã quét về 0 để <strong>kiểm đếm lại từ đầu</strong>.
            </p>
            <button
              type="button"
              className="btn-header"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                padding: '10px',
                fontWeight: 700,
                justifyContent: 'center'
              }}
              onClick={() => {
                onResetCounts();
                onClose();
              }}
            >
              <RotateCcw size={16} />
              <span>Đặt Lại Số Đếm Về 0 (Giữ Nguyên Mã)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
