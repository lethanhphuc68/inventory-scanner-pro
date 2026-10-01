import React, { useState } from 'react';
import { QrCode, X, Copy, Check, Play, Smartphone, Info } from 'lucide-react';

export default function BarcodeSimulatorModal({ isOpen, onClose, items, onSimulateScan }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentItem = items.find(i => i.code === selectedCode) || items[0];

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Generate QR image url via standard API or inline SVG fallback
  const qrUrl = currentItem 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentItem.code)}`
    : '';

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-simulator">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge badge-purple">
              <QrCode size={22} />
            </div>
            <div>
              <h3>Công Cụ Thử Nghiệm Quét (Test Barcode & QR)</h3>
              <p>Mở camera điện thoại hướng vào màn hình để quét thử, hoặc bấm "Bắn mã"</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body simulator-body">
          {/* Left: Product selector list */}
          <div className="simulator-list-column">
            <div className="sim-list-title">Danh sách sản phẩm trong đơn ({items.length})</div>
            <div className="sim-items-scroll">
              {items.map((item) => {
                const isSelected = currentItem?.code === item.code;
                return (
                  <div 
                    key={item.code}
                    className={`sim-item-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCode(item.code)}
                  >
                    <div className="sim-item-info">
                      <span className="sim-item-code">{item.code}</span>
                      <span className="sim-item-name">{item.name}</span>
                    </div>
                    <button 
                      type="button"
                      className="btn-sim-quick-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSimulateScan(item.code);
                      }}
                      title="Mô phỏng máy quét bắn mã này +1"
                    >
                      <Play size={13} />
                      <span>Bắn</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Big QR Code Display for Phone Camera */}
          {currentItem && (
            <div className="simulator-display-column">
              <div className="qr-preview-card">
                <div className="qr-image-wrapper">
                  <img 
                    src={qrUrl} 
                    alt={`QR Code ${currentItem.code}`} 
                    className="qr-img" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="sim-barcode-stripes">
                    {/* Simulated 1D Barcode Graphic */}
                    <div className="barcode-bars">
                      {[...Array(38)].map((_, i) => (
                        <div 
                          key={i} 
                          className="bar" 
                          style={{ 
                            width: (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1) + 'px',
                            marginRight: (i % 4 === 0 ? 2 : 1) + 'px'
                          }}
                        ></div>
                      ))}
                    </div>
                    <div className="barcode-number">{currentItem.code}</div>
                  </div>
                </div>

                <div className="qr-meta-info">
                  <div className="qr-code-display" onClick={() => handleCopy(currentItem.code)}>
                    <code>{currentItem.code}</code>
                    {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  </div>
                  <div className="qr-item-name">{currentItem.name}</div>
                  <div className="qr-scan-stat">
                    Tiến độ: <strong>{currentItem.scannedQty} / {currentItem.targetQty}</strong> sản phẩm
                  </div>
                </div>

                <div className="qr-actions-row">
                  <button 
                    type="button" 
                    className="btn-primary btn-block"
                    onClick={() => onSimulateScan(currentItem.code)}
                  >
                    <Play size={16} />
                    <span>Mô phỏng bắn mã này ngay (+1)</span>
                  </button>
                </div>

                <div className="simulator-tip-box">
                  <Smartphone size={16} />
                  <span>Dùng camera điện thoại quét thẳng vào mã QR trên màn hình này!</span>
                </div>
              </div>
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
