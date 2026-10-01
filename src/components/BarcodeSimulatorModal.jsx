import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  Scan, 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Play, 
  Smartphone, 
  Info, 
  Layers, 
  Barcode 
} from 'lucide-react';

export default function BarcodeSimulatorModal({ isOpen, onClose, items, onSimulateScan }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState('both'); // 'both' | 'barcode' | 'qr'
  const barcodeSvgRef = useRef(null);

  const currentItem = items.find(i => i.code === selectedCode) || items[0];

  // Render real SVG Barcode using JsBarcode whenever selected item changes
  useEffect(() => {
    if (!isOpen || !currentItem?.code || !barcodeSvgRef.current) return;

    try {
      JsBarcode(barcodeSvgRef.current, String(currentItem.code).trim(), {
        format: 'CODE128',
        lineColor: '#000000',
        width: 2.2,
        height: 75,
        displayValue: true,
        fontSize: 16,
        font: 'monospace',
        textMargin: 6,
        background: '#ffffff',
        margin: 12
      });
    } catch (err) {
      console.warn('JsBarcode error with CODE128, fallback to auto:', err);
      try {
        JsBarcode(barcodeSvgRef.current, String(currentItem.code).trim(), {
          format: 'auto',
          width: 2,
          height: 65,
          background: '#ffffff',
          margin: 10
        });
      } catch (e) {
        console.error('JsBarcode failed completely:', e);
      }
    }
  }, [isOpen, currentItem?.code, displayMode]);

  if (!isOpen) return null;

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Generate QR image url via standard API
  const qrUrl = currentItem 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(currentItem.code)}`
    : '';

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-simulator" style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff' }}>
              <Scan size={22} />
            </div>
            <div>
              <h3>Mã Mẫu Thử Nghiệm (Cả Barcode 1D & QR Code 2D)</h3>
              <p>Mở camera điện thoại hướng vào màn hình để quét thử cả 2 loại mã!</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Display Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            className={`filter-tab ${displayMode === 'both' ? 'active' : ''}`}
            onClick={() => setDisplayMode('both')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Layers size={15} />
            <span>Hiển thị Cả Hai (Barcode & QR)</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${displayMode === 'barcode' ? 'active' : ''}`}
            onClick={() => setDisplayMode('barcode')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Barcode size={15} />
            <span>Chuyên Mã Vạch Barcode (1D)</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${displayMode === 'qr' ? 'active' : ''}`}
            onClick={() => setDisplayMode('qr')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <QrCode size={15} />
            <span>Chuyên Mã QR (2D)</span>
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

          {/* Right: Big Display Column for Phone Camera Scanning */}
          {currentItem && (
            <div className="simulator-display-column">
              <div className="qr-preview-card" style={{ gap: '14px' }}>

                {/* Codes container */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  {/* Real 1D Barcode (SVG) */}
                  {(displayMode === 'both' || displayMode === 'barcode') && (
                    <div style={{
                      width: '100%',
                      background: '#ffffff',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#475569',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        <Barcode size={15} style={{ color: '#0284c7' }} />
                        <span>Mã Vạch Barcode 1D Chuẩn (Thử Quét Bằng Camera)</span>
                      </div>
                      <svg 
                        ref={barcodeSvgRef} 
                        style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
                      />
                    </div>
                  )}

                  {/* Real 2D QR Code */}
                  {(displayMode === 'both' || displayMode === 'qr') && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      padding: '12px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#475569',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        <QrCode size={15} style={{ color: '#7c3aed' }} />
                        <span>Mã QR Code 2D Chuẩn (Thử Quét Bằng Camera)</span>
                      </div>
                      <img 
                        src={qrUrl} 
                        alt={`QR Code ${currentItem.code}`} 
                        style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto', borderRadius: '4px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="qr-meta-info" style={{ width: '100%' }}>
                  <div className="qr-code-display" onClick={() => handleCopy(currentItem.code)} title="Bấm để sao chép mã">
                    <code>{currentItem.code}</code>
                    {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  </div>
                  <div className="qr-item-name">{currentItem.name}</div>
                  <div className="qr-scan-stat">
                    Tiến độ kiểm đếm: <strong>{currentItem.scannedQty} / {currentItem.targetQty}</strong> sản phẩm
                  </div>
                </div>

                {/* Quick simulate trigger */}
                <div className="qr-actions-row" style={{ width: '100%' }}>
                  <button 
                    type="button" 
                    className="btn-primary btn-block"
                    onClick={() => onSimulateScan(currentItem.code)}
                  >
                    <Play size={16} />
                    <span>Mô phỏng máy quét bắn mã này (+1)</span>
                  </button>
                </div>

                <div className="simulator-tip-box">
                  <Smartphone size={16} />
                  <span>Mở camera trên điện thoại và hướng vào mã vạch Barcode hoặc QR ở trên để thử nghiệm tính năng quét!</span>
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
