import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, Zap, ZapOff, X, AlertCircle } from 'lucide-react';

export default function CameraScanner({ onScan, onClose, isOpen }) {
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [lastScannedText, setLastScannedText] = useState('');

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';
  const lastScanTimeRef = useRef({ code: '', time: 0 });

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsStarting(true);
    setErrorMsg(null);

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          throw new Error('Không tìm thấy camera trên thiết bị của bạn.');
        }

        if (!mounted) return;
        setCameras(devices);

        // Prefer back camera on phones
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('sau') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        const selectedId = backCamera ? backCamera.id : devices[devices.length - 1].id;
        setCurrentCameraId(selectedId);

        const html5QrCode = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Optimal box aspect ratio for barcode + QR
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const width = Math.floor(minEdge * 0.85);
            const height = Math.floor(minEdge * 0.65);
            return { width, height };
          },
          aspectRatio: 1.0,
          formatsToSupport: undefined, // All supported 1D barcodes and 2D QR
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        await html5QrCode.start(
          selectedId,
          config,
          (decodedText) => {
            const now = Date.now();
            const cleanText = decodedText.trim();
            // Prevent duplicate triggers of exact same code within 900ms
            if (lastScanTimeRef.current.code === cleanText && (now - lastScanTimeRef.current.time) < 900) {
              return;
            }
            lastScanTimeRef.current = { code: cleanText, time: now };
            setLastScannedText(cleanText);
            onScan(cleanText);
          },
          () => {
            // scan failure callback (ignored to keep console clean during searching)
          }
        );

        if (!mounted) {
          html5QrCode.stop().catch(() => {});
          return;
        }

        // Check torch capabilities
        try {
          // Some devices support torch
          const track = html5QrCode.getRunningTrackCapabilities();
          if (track && track.torch) {
            setHasTorch(true);
          }
        } catch {
          // ignore torch detection error
        }

        setIsStarting(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Lỗi khởi động camera:', err);
        setErrorMsg(err.message || 'Không thể mở Camera. Vui lòng cấp quyền truy cập Camera trong trình duyệt.');
        setIsStarting(false);
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current.clear();
            }).catch(e => console.warn('Camera stop error:', e));
          }
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, [isOpen]);

  const switchCamera = async () => {
    if (!html5QrCodeRef.current || cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextDevice = cameras[nextIndex];

    try {
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      setCurrentCameraId(nextDevice.id);
      setTorchOn(false);

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return { width: Math.floor(minEdge * 0.85), height: Math.floor(minEdge * 0.65) };
        }
      };

      await html5QrCodeRef.current.start(
        nextDevice.id,
        config,
        (decodedText) => {
          const now = Date.now();
          const cleanText = decodedText.trim();
          if (lastScanTimeRef.current.code === cleanText && (now - lastScanTimeRef.current.time) < 900) return;
          lastScanTimeRef.current = { code: cleanText, time: now };
          setLastScannedText(cleanText);
          onScan(cleanText);
        },
        () => {}
      );
    } catch (e) {
      console.error('Lỗi đổi camera:', e);
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal-content">
        {/* Header */}
        <div className="camera-modal-header">
          <div className="camera-modal-title">
            <span className="live-indicator"></span>
            <Camera size={20} />
            <span>Camera Quét Barcode & QR</span>
          </div>
          <button className="btn-close-camera" onClick={onClose} title="Đóng camera">
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="camera-viewfinder-wrapper">
          <div id={scannerContainerId} className="camera-html5-view"></div>

          {/* Laser guideline overlay */}
          <div className="scanner-laser-line"></div>
          <div className="scanner-target-corners">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>

          {isStarting && (
            <div className="camera-loading-state">
              <RefreshCw size={32} className="spin-icon" />
              <span>Đang kết nối camera điện thoại...</span>
            </div>
          )}

          {errorMsg && (
            <div className="camera-error-banner">
              <AlertCircle size={24} />
              <p>{errorMsg}</p>
              <button className="btn-secondary btn-sm" onClick={onClose}>Đóng & Nhập tay</button>
            </div>
          )}

          {lastScannedText && !isStarting && (
            <div className="live-scanned-bubble">
              Quét mã: <strong>{lastScannedText}</strong>
            </div>
          )}
        </div>

        {/* Camera controls toolbar */}
        <div className="camera-toolbar">
          {cameras.length > 1 && (
            <button className="btn-toolbar" onClick={switchCamera} title="Đổi camera">
              <RefreshCw size={18} />
              <span>Đổi Camera</span>
            </button>
          )}

          {hasTorch && (
            <button className={`btn-toolbar ${torchOn ? 'active' : ''}`} onClick={toggleTorch} title="Bật/Tắt đèn pin">
              {torchOn ? <ZapOff size={18} /> : <Zap size={18} />}
              <span>{torchOn ? 'Tắt Đèn' : 'Bật Đèn'}</span>
            </button>
          )}

          <div className="camera-scan-tip">
            <span>Hướng camera vào mã vạch hoặc mã QR trên sản phẩm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
