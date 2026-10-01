import React, { useState, useRef, useEffect } from 'react';
import { Scan, Camera, ArrowRight, Plus, Minus, CornerDownLeft, Sparkles } from 'lucide-react';

export default function ManualBarcodeInput({ onScan, onOpenCam, autoFocus = true }) {
  const [code, setCode] = useState('');
  const [stepQty, setStepQty] = useState(1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = code.trim();
    if (!clean) return;

    onScan(clean, stepQty);
    setCode('');

    // Re-focus input for continuous barcode gun scanning
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const adjustQty = (amount) => {
    setStepQty(prev => Math.max(1, prev + amount));
  };

  return (
    <div className="scanner-action-bar">
      {/* Mobile-first big trigger for camera */}
      <button 
        type="button" 
        className="btn-camera-trigger"
        onClick={onOpenCam}
        title="Mở camera điện thoại để quét mã"
      >
        <div className="cam-icon-glow">
          <Camera size={26} />
        </div>
        <div className="cam-btn-labels">
          <span className="cam-main-label">BẬT CAMERA QUÉT</span>
          <span className="cam-sub-label">Quét mã vạch 1D & QR Code bằng điện thoại</span>
        </div>
      </button>

      {/* Barcode Gun / Manual Keyboard Input */}
      <form className="barcode-input-container" onSubmit={handleSubmit}>
        <div className="input-group-barcode">
          <div className="barcode-prefix-icon">
            <Scan size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="input-barcode"
            placeholder="Bắn súng Barcode hoặc nhập mã code (vd: 1241205102)..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          {code && (
            <button 
              type="button" 
              className="btn-clear-input"
              onClick={() => { setCode(''); inputRef.current?.focus(); }}
            >
              ×
            </button>
          )}
        </div>

        {/* Step quantity multiplier */}
        <div className="step-qty-controls" title="Số lượng tính cho mỗi lần quét">
          <span className="qty-label">SL/lần:</span>
          <button 
            type="button" 
            className="btn-qty-step" 
            onClick={() => adjustQty(-1)}
            disabled={stepQty <= 1}
          >
            <Minus size={14} />
          </button>
          <span className="qty-number">+{stepQty}</span>
          <button 
            type="button" 
            className="btn-qty-step" 
            onClick={() => adjustQty(1)}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Submit button */}
        <button 
          type="submit" 
          className="btn-submit-barcode" 
          disabled={!code.trim()}
        >
          <span className="btn-text">Đếm</span>
          <CornerDownLeft size={16} />
        </button>
      </form>
    </div>
  );
}
