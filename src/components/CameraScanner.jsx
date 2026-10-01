import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  RefreshCw, 
  Zap, 
  ZapOff, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Barcode, 
  QrCode, 
  Layers 
} from 'lucide-react';

// Hỗ trợ ĐẦY ĐỦ tất cả các định dạng Barcode 1D và QR 2D phổ biến nhất
const ALL_WAREHOUSE_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,       // Mã QR 2D
  Html5QrcodeSupportedFormats.CODE_128,      // Mã vạch 1D kho hàng & logistics
  Html5QrcodeSupportedFormats.EAN_13,        // Mã vạch 1D siêu thị & hàng tiêu dùng 13 số
  Html5QrcodeSupportedFormats.EAN_8,         // Mã vạch 1D 8 số
  Html5QrcodeSupportedFormats.CODE_39,       // Mã vạch 1D công nghiệp & linh kiện
  Html5QrcodeSupportedFormats.CODE_93,       // Mã vạch 1D độ mật độ cao
  Html5QrcodeSupportedFormats.UPC_A,         // Mã vạch 1D chuẩn Mỹ / nhập khẩu
  Html5QrcodeSupportedFormats.UPC_E,         // Mã vạch 1D rút gọn
  Html5QrcodeSupportedFormats.ITF,           // Mã vạch thùng hàng carton Interleaved 2 of 5
  Html5QrcodeSupportedFormats.CODABAR,       // Mã vạch vận chuyển & bưu tá
  Html5QrcodeSupportedFormats.DATA_MATRIX,   // Mã 2D bo mạch & y tế
  Html5QrcodeSupportedFormats.AZTEC,         // Mã 2D vé & hóa đơn
  Html5QrcodeSupportedFormats.PDF_417        // Mã tem nhãn vận chuyển bưu điện
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
  const [scanMode, setScanMode] = useState('all'); // 'all' | 'barcode' | 'qr'

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';
  const lastScanTimeRef = useRef({ code: '', time: 0 });
  const scanModeRef = useRef(scanMode);
  scanModeRef.current = scanMode;

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

        // Khởi tạo engine với phần cứng tăng tốc và whitelist tất cả định dạng
        const html5QrCode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: ALL_WAREHOUSE_FORMATS,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Tận dụng chip phần cứng của điện thoại để quét tức thì
          }
        });
        html5QrCodeRef.current = html5QrCode;

        // Cấu hình tối ưu quét siêu tốc 25 FPS + Khung ngắm rộng không bị cắt barcode
        const config = {
          fps: 25,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Vùng quét rộng bao phủ 92% bề ngang để nhận diện trọn vẹn cả barcode 1D dài và QR code
            const width = Math.floor(viewfinderWidth * 0.92);
            const height = Math.floor(Math.min(viewfinderHeight * 0.72, 340));
            return { width, height };
          },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment',
            focusMode: 'continuous',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };

        await html5QrCode.start(
          selectedId,
          config,
          (decodedText) => {
            const now = Date.now();
            const cleanText = decodedText.trim();

            // Nếu là mã khác: Nhận diện TỨC THÌ (0ms). Nếu là cùng 1 mã: giảm độ trễ xuống 420ms
            if (lastScanTimeRef.current.code === cleanText && (now - lastScanTimeRef.current.time) < 420) {
              return;
            }

            lastScanTimeRef.current = { code: cleanText, time: now };
            setLastScannedText(cleanText);

            // Hiệu ứng chớp viền xanh báo hiệu quét thành công
            setFlashSuccess(true);
            setTimeout(() => setFlashSuccess(false), 240);

            // Gửi mã xử lý và phát âm thanh ngay lập tức
            onScan(cleanText);
          },
          () => {
            // Bỏ qua frame không có mã
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
          const width = Math.floor(viewfinderWidth * 0.92);
          const height = Math.floor(Math.min(viewfinderHeight * 0.72, 340));
          return { width, height };
        },
        videoConstraints: {
          facingMode: 'environment',
          focusMode: 'continuous',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      await html5QrCodeRef.current.start(
        nextDevice.id,
        config,
        (decodedText) => {
          const now = Date.now();
          const cleanText = decodedText.trim();
          if (lastScanTimeRef.current.code === cleanText && (now - lastScanTimeRef.current.time) < 420) return;
          lastScanTimeRef.current = { code: cleanText, time: now };
          setLastScannedText(cleanText);
          setFlashSuccess(true);
          setTimeout(() => setFlashSuccess(false), 240);
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
            <Camera size={19} />
            <span>Camera Quét Barcode & QR (25 FPS)</span>
          </div>
          <button className="btn-close-camera" onClick={onClose} title="Đóng camera">
            <X size={20} />
          </button>
        </div>

        {/* Scan Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          gap: '6px',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            className={`filter-tab ${scanMode === 'all' ? 'active' : ''}`}
            onClick={() => setScanMode('all')}
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            <Layers size={14} />
            <span>Tất cả (QR & Barcode)</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${scanMode === 'barcode' ? 'active' : ''}`}
            onClick={() => setScanMode('barcode')}
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            <Barcode size={14} />
            <span>Mã Vạch Barcode 1D</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${scanMode === 'qr' ? 'active' : ''}`}
            onClick={() => setScanMode('qr')}
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            <QrCode size={14} />
            <span>Mã QR Code 2D</span>
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="camera-viewfinder-wrapper">
          <div id={scannerContainerId} className="camera-html5-view"></div>

          {/* Laser guideline overlay according to mode */}
          {scanMode === 'barcode' ? (
            /* Barcode 1D specialized horizontal red laser beam */
            <div className="scanner-laser-barcode-guide">
              <div className="barcode-laser-line-red"></div>
              <div className="barcode-box-target">
                <span className="barcode-guide-hint">CĂN VẠCH ĐỎ CẮT QUA MÃ VẠCH</span>
              </div>
            </div>
          ) : scanMode === 'qr' ? (
            /* QR Code specialized square reticle */
            <>
              <div className="scanner-laser-line"></div>
              <div className="scanner-target-corners qr-mode-corners">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
            </>
          ) : (
            /* All mode: versatile guide */
            <>
              <div className="scanner-laser-line"></div>
              <div className="scanner-target-corners">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
            </>
          )}

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
              Đã quét: <strong>{lastScannedText}</strong>
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
            {scanMode === 'barcode' ? (
              <span>🔴 Đang quét Barcode 1D: Hướng tia laser đỏ cắt ngang qua các sọc mã vạch</span>
            ) : scanMode === 'qr' ? (
              <span>⬛ Đang quét QR: Đặt mã QR vào giữa khung vuông</span>
            ) : (
              <span>⚡ Đang bật quét Cả Hai: Tự động nhận diện tức thì Barcode 1D & QR Code</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
