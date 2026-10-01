import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, X, RefreshCw, Save, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchInventoryFromSheet, saveResultsToSheet } from '../utils/googleSheet';

const SAVED_SHEET_URL_KEY = 'inventory_saved_google_sheet_url';

export default function GoogleSheetModal({ 
  isOpen, 
  onClose, 
  onLoadSuccess, 
  items, 
  unknownItems 
}) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetTab, setSheetTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_SHEET_URL_KEY);
    if (saved) setSheetUrl(saved);
  }, []);

  if (!isOpen) return null;

  const handleLoad = async (e) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setErrorMsg('Vui lòng nhập link hoặc ID Google Sheet.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetchInventoryFromSheet(sheetUrl.trim(), sheetTab.trim());
      localStorage.setItem(SAVED_SHEET_URL_KEY, sheetUrl.trim());
      onLoadSuccess(res.items, res.spreadsheetTitle || 'Google Sheet');
      setSuccessMsg(`Đã nạp thành công ${res.items.length} mặt hàng từ "${res.spreadsheetTitle}"!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi nạp dữ liệu từ Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    if (!sheetUrl.trim()) {
      setErrorMsg('Vui lòng nhập link Google Sheet để lưu kết quả.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await saveResultsToSheet(sheetUrl.trim(), items, unknownItems);
      setSuccessMsg(`✅ ${res.message || 'Đã lưu thành công kết quả kiểm kê vào Google Sheet!'}`);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi lưu kết quả vào Google Sheet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>

              <h3>Đồng Bộ Google Sheet (Cloud)</h3>
              <p>Nạp đơn xuất kho hoặc lưu kết quả chênh lệch trực tiếp về Google Sheet</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Instructions */}
          <div className="excel-guide-banner">
            <div className="guide-text">
              <strong>Yêu cầu bảng tính:</strong>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0' }}>
                Bảng tính cần có các cột: <code>code</code>, <code>tên sản phẩm</code>, <code>số lượng</code>. Đảm bảo quyền chia sẻ: <em>"Bất kỳ ai có đường liên kết đều có thể xem/chỉnh sửa"</em>.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoad} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Link hoặc ID Google Sheet:
              </label>
              <input
                type="text"
                className="input-barcode"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Tên Tab Sheet (Tùy chọn, để trống sẽ đọc tab đầu tiên):
              </label>
              <input
                type="text"
                className="input-barcode"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
                placeholder="Ví dụ: Xuat_Kho_01"
                value={sheetTab}
                onChange={(e) => setSheetTab(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={loading || saving}
              >
                {loading ? <RefreshCw size={16} className="spin-icon" /> : <RefreshCw size={16} />}
                <span>{loading ? 'Đang đọc Sheet...' : 'Nạp Đơn Từ Google Sheet'}</span>
              </button>

              <button
                type="button"
                className="btn-export-excel"
                style={{ flex: 1 }}
                onClick={handleSaveResults}
                disabled={loading || saving || !sheetUrl.trim()}
                title="Tạo tab Chenh_Lech_Kiem_Ke trong Google Sheet"
              >
                {saving ? <RefreshCw size={16} className="spin-icon" /> : <Save size={16} />}
                <span>{saving ? 'Đang lưu...' : 'Lưu Kết Quả Vào Sheet'}</span>
              </button>
            </div>
          </form>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="modal-error-alert">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
