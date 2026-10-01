import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, Zap, ZapOff, X, AlertCircle, CheckCircle2 } from 'lucide-react';

// Chỉ tập trung vào các định dạng mã vạch & QR thông dụng trong kho để quét siêu tốc
const WAREHOUSE_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];

export default function CameraScanner({ onScan, onClose, isOpen }) {
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [lastScannedText, setLastScannedText] = useState('');
  const [flashSuccess, setFlashSuccess] = useState(false);

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

        // Ưu tiên camera sau (Rear / Back) trên điện thoại
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('sau') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        const selectedId = backCamera ? backCamera.id : devices[devices.length - 1].id;
        setCurrentCameraId(selectedId);

        // Khởi tạo engine với phần cứng tăng tốc và whitelist định dạng
        const html5QrCode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: WAREHOUSE_FORMATS,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Tận dụng chip phần cứng của điện thoại để quét tức thì
          }
        });
        html5QrCodeRef.current = html5QrCode;

        // Cấu hình tối ưu tốc độ cao: 25 FPS + Vùng ngắm rộng
        const config = {
          fps: 25, // Tăng từ 15 lên 25 khung hình/giây giúp bắt mã cực nhạy
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const width = Math.floor(viewfinderWidth * 0.90);
            const height = Math.floor(Math.min(viewfinderHeight * 0.70, 340));
            return { width, height };
          },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment',
            focusMode: 'continuous',
            advanced: [{ focusMode: 'continuous' }]
          }
        };

        await html5QrCode.start(
          selectedId,
          config,
          (decodedText) => {
            const now = Date.now();
            const cleanText = decodedText.trim();

            // Nếu là mã khác: Nhận diện TỨC THÌ (0ms). Nếu là cùng 1 mã: giảm độ trễ xuống 400ms (trước là 900ms)
            if (lastScanTimeRef.current.code === cleanText && (now - lastScanTimeRef.current.time) < 400) {
              return;
            }

            lastScanTimeRef.current = { code: cleanText, time: now };
            setLastScannedText(cleanText);

            // Hiệu ứng chớp viền xanh báo hiệu quét thành công
            setFlashSuccess(true);
            setTimeout(() => setFlashSuccess(false), 220);

            // Gửi mã xử lý và phát âm thanh ngay lập tức
            onScan(cleanText);
          },
          () => {
            // bỏ qua frame không có mã để CPU chạy êm ái
          }
        );

        if (!mounted) {
          html5QrCode.stop().catch(() => {});
          return;
        }

        // Kiểm tra đèn Flash / Torch
        try {
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
        fps: 25,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const width = Math.floor(viewfinderWidth * 0.90);
          const height = Math.floor(Math.min(viewfinderHeight * 0.70, 340));
          return { width, height };
        }
      };

      await html5QrCodeRef.current.start(
        nextDevice.id,
        config,
        (decodedText) => {
          const now = Date.now();
          const cleanText = decodedText.trim();
          if (lastScanTimeRef.current.code === cleanText && (now - lastScanTimeRef.current.time) < 400) return;
          lastScanTimeRef.current = { code: cleanText, time: now };
          setLastScannedText(cleanText);
          setFlashSuccess(true);
          setTimeout(() => setFlashSuccess(false), 220);
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
      <div className={`camera-modal-content ${flashSuccess ? 'flash-success-border' : ''}`}>
        {/* Header */}
        <div className="camera-modal-header">
          <div className="camera-modal-title">
            <span className="live-indicator"></span>
            <Camera size={20} />
            <span>Camera Quét Siêu Tốc (25 FPS)</span>
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
              <CheckCircle2 size={16} className="text-emerald" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
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
            <span>Đã bật nhận diện tức thì • Hướng vào mã vạch 1D hoặc mã QR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
