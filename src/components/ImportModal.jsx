import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Sparkles, 
  X, 
  AlertCircle, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { parseExcelFile, downloadSampleTemplate, SAMPLE_DATA } from '../utils/excel';

export default function ImportModal({ isOpen, onClose, onImportSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [parsedPreview, setParsedPreview] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await parseExcelFile(file);
      setParsedPreview(result);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi xử lý file Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const confirmImport = () => {
    if (parsedPreview) {
      onImportSuccess(parsedPreview.items, parsedPreview.fileName);
      onClose();
    }
  };

  const loadDemoData = () => {
    onImportSuccess(SAMPLE_DATA, 'Mau_Don_Kiem_Ke_Demo.xlsx');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3>Import File Xuất Kho Gốc</h3>
              <p>Hỗ trợ file Excel (.xlsx, .xls) hoặc file CSV</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Column structure guidelines */}
          <div className="excel-guide-banner">
            <HelpCircle size={18} className="guide-icon" />
            <div className="guide-text">
              <strong>Yêu cầu cấu trúc cột trong file:</strong>
              <div className="column-tags">
                <span className="col-tag">code (Mã vạch / QR)</span>
                <span className="col-tag">tên sản phẩm</span>
                <span className="col-tag">số lượng</span>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          {!parsedPreview ? (
            <div 
              className={`dropzone-box ${isDragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                id="excel-file-input" 
                className="hidden-file-input"
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
              />
              <label htmlFor="excel-file-input" className="dropzone-label">
                <div className="upload-circle-icon">
                  <Upload size={32} />
                </div>
                <div className="dropzone-prompt">
                  <strong>Kéo thả file vào đây hoặc bấm để chọn file</strong>
                  <span>Hỗ trợ các định dạng .xlsx, .xls, .csv</span>
                </div>
              </label>

              {loading && (
                <div className="dropzone-loading-overlay">
                  <div className="spinner"></div>
                  <span>Đang phân tích file Excel...</span>
                </div>
              )}
            </div>
          ) : (
            /* Preview of parsed data */
            <div className="parsed-preview-box">
              <div className="preview-header">
                <div className="file-info-badge">
                  <CheckCircle size={18} className="text-emerald" />
                  <span>File: <strong>{parsedPreview.fileName}</strong> ({parsedPreview.itemsCount} mặt hàng)</span>
                </div>
                <button 
                  className="btn-text-danger btn-sm"
                  onClick={() => setParsedPreview(null)}
                >
                  Chọn file khác
                </button>
              </div>

              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã Code (Barcode)</th>
                      <th>Tên sản phẩm</th>
                      <th>SL Cần Xuất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreview.items.slice(0, 5).map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><code>{item.code}</code></td>
                        <td>{item.name}</td>
                        <td className="text-right"><strong>{item.targetQty}</strong></td>
                      </tr>
                    ))}
                    {parsedPreview.items.length > 5 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          ... và {parsedPreview.items.length - 5} mặt hàng khác
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="modal-error-alert">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="modal-quick-actions">
            <button 
              type="button" 
              className="btn-outline-action"
              onClick={downloadSampleTemplate}
            >
              <Download size={16} />
              <span>Tải file Excel mẫu (.xlsx)</span>
            </button>

            <button 
              type="button" 
              className="btn-demo-action"
              onClick={loadDemoData}
            >
              <Sparkles size={16} />
              <span>Nạp dữ liệu mẫu nhanh (Test thử ngay)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Đóng
          </button>
          {parsedPreview && (
            <button className="btn-confirm-import" onClick={confirmImport}>
              Bắt đầu kiểm đếm ({parsedPreview.itemsCount} món)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
