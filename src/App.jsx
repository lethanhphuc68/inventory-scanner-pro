import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Package, 
  Upload, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  FileSpreadsheet, 
  QrCode, 
  Smartphone, 
  History, 
  Undo2, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronDown,
  Layers,
  Trash2
} from 'lucide-react';

import ManualBarcodeInput from './components/ManualBarcodeInput';
import CameraScanner from './components/CameraScanner';
import StatsOverview from './components/StatsOverview';
import ProductList from './components/ProductList';
import ImportModal from './components/ImportModal';
import BarcodeSimulatorModal from './components/BarcodeSimulatorModal';
import GoogleSheetModal from './components/GoogleSheetModal';
import ClearDataModal from './components/ClearDataModal';


import { soundManager } from './utils/sound';
import { exportReportToExcel, SAMPLE_DATA } from './utils/excel';

const STORAGE_KEY = 'inventory_scanner_pro_data_v1';

export default function App() {
  // Main states
  const [items, setItems] = useState([]);
  const [unknownItems, setUnknownItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [fileName, setFileName] = useState('');
  
  // Modals & UI
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);


  
  // Recent scan alert & history
  const [lastScanAlert, setLastScanAlert] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data from localStorage or fallback to Sample Data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) {
          setItems(parsed.items);
          setUnknownItems(parsed.unknownItems || []);
          setFileName(parsed.fileName || '');
          setScanHistory(parsed.scanHistory || []);
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Error loading localStorage:', e);
    }

    // Default to sample data for first run
    setItems(SAMPLE_DATA);
    setFileName('Mau_Xuat_Kho_Mac_Dinh.xlsx');
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items,
        unknownItems,
        fileName,
        scanHistory: scanHistory.slice(0, 50)
      }));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }, [isLoaded, items, unknownItems, fileName, scanHistory]);

  // Audio mute toggle
  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  /**
   * CORE LOGIC: Handle barcode / QR scan
   */
  const handleScan = (scannedCode, qty = 1) => {
    const cleanCode = String(scannedCode).trim();
    if (!cleanCode) return;

    // Check if code exists in original inventory
    const existingIndex = items.findIndex(i => i.code === cleanCode);

    if (existingIndex !== -1) {
      const targetItem = items[existingIndex];
      const newScanned = targetItem.scannedQty + qty;
      const target = targetItem.targetQty;

      let status = 'valid';
      let alertType = 'info';
      let message = '';

      if (newScanned === target) {
        // Just fulfilled target
        status = 'complete';
        alertType = 'success';
        message = `✅ ĐÃ ĐỦ: ${targetItem.name} (${newScanned}/${target})`;
        soundManager.playItemCompleted();
      } else if (newScanned > target) {
        // Exceeded target
        status = 'surplus';
        alertType = 'warning';
        message = `⚠️ CẢNH BÁO DƯ: ${targetItem.name} (Đã quét ${newScanned}/${target} - Dư +${newScanned - target})`;
        soundManager.playWarningOver();
      } else {
        // Still missing
        status = 'valid';
        alertType = 'info';
        message = `📦 Đếm +${qty}: ${targetItem.name} (${newScanned}/${target} - Còn thiếu ${target - newScanned})`;
        soundManager.playScanBeep();
      }

      // Update items state
      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...targetItem,
        scannedQty: newScanned
      };
      setItems(updatedItems);

      // Check if ALL items in order are 100% complete
      const allDone = updatedItems.every(i => i.scannedQty === i.targetQty) && unknownItems.length === 0;
      if (allDone && status === 'complete') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        soundManager.playAllDoneChime();
      }

      // Set alert banner
      setLastScanAlert({
        id: Date.now(),
        type: alertType,
        code: cleanCode,
        name: targetItem.name,
        message,
        qtyAdded: qty,
        current: newScanned,
        target
      });

      // Record history
      setScanHistory(prev => [
        {
          id: Date.now(),
          code: cleanCode,
          name: targetItem.name,
          qtyAdded: qty,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          status
        },
        ...prev.slice(0, 49)
      ]);

    } else {
      // Barcode NOT in list -> UNKNOWN BARCODE
      soundManager.playErrorUnknown();

      const existingUnknownIndex = unknownItems.findIndex(u => u.code === cleanCode);
      let newUnknownList = [];

      if (existingUnknownIndex !== -1) {
        newUnknownList = [...unknownItems];
        newUnknownList[existingUnknownIndex].scannedQty += qty;
      } else {
        newUnknownList = [
          ...unknownItems,
          {
            code: cleanCode,
            name: 'Mã không có trong đơn xuất',
            scannedQty: qty,
            targetQty: 0
          }
        ];
      }

      setUnknownItems(newUnknownList);

      setLastScanAlert({
        id: Date.now(),
        type: 'danger',
        code: cleanCode,
        name: 'MÃ LẠ NGOÀI ĐƠN',
        message: `🚨 BÁO ĐỘNG: Mã [${cleanCode}] không tồn tại trong phiếu xuất gốc!`,
        qtyAdded: qty,
        current: (newUnknownList.find(u => u.code === cleanCode)?.scannedQty || 1),
        target: 0
      });

      setScanHistory(prev => [
        {
          id: Date.now(),
          code: cleanCode,
          name: 'Mã lạ ngoài đơn',
          qtyAdded: qty,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          status: 'unknown'
        },
        ...prev.slice(0, 49)
      ]);
    }
  };

  /**
   * Manual Stepper updates (+1 or -1) from card buttons
   */
  const handleUpdateQty = (code, delta, isUnknown = false) => {
    if (isUnknown) {
      setUnknownItems(prev => prev.map(u => {
        if (u.code === code) {
          const next = Math.max(0, u.scannedQty + delta);
          return { ...u, scannedQty: next };
        }
        return u;
      }).filter(u => u.scannedQty > 0));
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.code === code) {
        const next = Math.max(0, item.scannedQty + delta);
        if (delta > 0) {
          if (next === item.targetQty) soundManager.playItemCompleted();
          else if (next > item.targetQty) soundManager.playWarningOver();
          else soundManager.playScanBeep();
        }
        return { ...item, scannedQty: next };
      }
      return item;
    }));
  };

  // Reset a single item's scanned count
  const handleResetItem = (code) => {
    setItems(prev => prev.map(i => i.code === code ? { ...i, scannedQty: 0 } : i));
  };

  // Remove an unknown item
  const handleRemoveUnknown = (code) => {
    setUnknownItems(prev => prev.filter(u => u.code !== code));
  };

  // Undo last scan
  const handleUndoLastScan = () => {
    if (scanHistory.length === 0) return;
    const last = scanHistory[0];

    if (last.status === 'unknown') {
      handleUpdateQty(last.code, -last.qtyAdded, true);
    } else {
      handleUpdateQty(last.code, -last.qtyAdded, false);
    }

    setScanHistory(prev => prev.slice(1));
    setLastScanAlert({
      id: Date.now(),
      type: 'info',
      code: last.code,
      message: `Đã hoàn tác thao tác quét mã [${last.code}]`
    });
  };

  // Reset all scanned counts to zero (start over with same order)
  const handleResetAllCounts = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại toàn bộ số lượng đã quét về 0 để kiểm đếm lại từ đầu?')) {
      setItems(prev => prev.map(i => ({ ...i, scannedQty: 0 })));
      setUnknownItems([]);
      setScanHistory([]);
      setLastScanAlert(null);
    }
  };

  // Clear all data completely (empty list to load brand new file/sheet)
  const handleClearAllData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách sản phẩm và đơn hàng hiện tại? Sau khi xóa bạn có thể nạp file Excel hoặc Google Sheet mới.')) {
      setItems([]);
      setUnknownItems([]);
      setScanHistory([]);
      setLastScanAlert(null);
      setFileName('Chưa chọn file');
    }
  };

  // Delete a single item from the list
  const handleDeleteItem = (code) => {
    const item = items.find(i => i.code === code);
    const itemName = item ? item.name : code;
    if (window.confirm(`Xóa sản phẩm "${itemName}" khỏi danh sách kiểm đếm?`)) {
      setItems(prev => prev.filter(i => i.code !== code));
    }
  };

  // Import new Excel file
  const handleImportSuccess = (newItems, newFileName) => {
    setItems(newItems);
    setUnknownItems([]);
    setFileName(newFileName);
    setScanHistory([]);
    setLastScanAlert(null);
    setActiveFilter('all');
  };

  // Export report to Excel
  const handleExportExcel = () => {
    exportReportToExcel(items, unknownItems, { fileName });
  };

  return (
    <div className="app-layout">
      {/* Top Header Bar */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-badge">
            <Package size={22} className="logo-icon" />
          </div>
          <div>
            <h1 className="app-title">Kiểm Kho QR & Barcode</h1>
            <div className="header-file-tag">
              <FileSpreadsheet size={13} />
              <span className="file-name" title={fileName}>{fileName || 'Chưa chọn file'}</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* Audio toggle */}
          <button 
            type="button" 
            className={`btn-icon-circle ${isMuted ? 'muted' : ''}`}
            onClick={toggleSound}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Google Sheet Sync */}
          <button 
            type="button" 
            className="btn-header-action"
            style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            onClick={() => setIsSheetModalOpen(true)}
            title="Nạp đơn xuất hoặc lưu kết quả về Google Sheet"
          >
            <FileSpreadsheet size={16} />
            <span>Google Sheet</span>
          </button>

          {/* Test Barcode Simulator */}
          <button 
            type="button" 
            className="btn-header-action btn-sim"
            onClick={() => setIsSimulatorModalOpen(true)}
            title="Mở mã QR & Barcode để quét thử bằng camera điện thoại"
          >
            <QrCode size={16} />
            <span className="hide-on-mobile">Mã QR Mẫu</span>
          </button>


          {/* Import new Excel */}
          <button 
            type="button" 
            className="btn-header-action btn-import"
            onClick={() => setIsImportModalOpen(true)}
            title="Nạp file Excel xuất kho mới"
          >
            <Upload size={16} />
            <span>Nạp Excel</span>
          </button>

          {/* Clear / Reset Data button */}
          <button 
            type="button" 
            className="btn-header-action btn-clear"
            onClick={() => setIsClearModalOpen(true)}
            title="Xóa dữ liệu kiểm kê hoặc đặt lại số đếm"
          >
            <Trash2 size={16} />
            <span>Xóa Dữ Liệu</span>
          </button>

          {/* Reset all button */}
          <button 
            type="button" 
            className="btn-icon-circle btn-reset-all"
            onClick={handleResetAllCounts}
            title="Đặt lại số đếm về 0"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Recent Scan Live Alert Card */}
        {lastScanAlert && (
          <div className={`scan-alert-banner alert-${lastScanAlert.type}`}>
            <div className="alert-icon-box">
              {lastScanAlert.type === 'success' && <CheckCircle2 size={24} />}
              {lastScanAlert.type === 'warning' && <AlertTriangle size={24} />}
              {lastScanAlert.type === 'danger' && <AlertCircle size={24} />}
              {lastScanAlert.type === 'info' && <Package size={24} />}
            </div>
            <div className="alert-content">
              <div className="alert-main-text">{lastScanAlert.message}</div>
              {lastScanAlert.code && (
                <div className="alert-code-sub">Mã: <code>{lastScanAlert.code}</code></div>
              )}
            </div>
            <button 
              type="button" 
              className="btn-undo-small"
              onClick={handleUndoLastScan}
              title="Lỡ quét nhầm? Bấm hoàn tác ngay"
            >
              <Undo2 size={14} />
              <span>Hoàn tác</span>
            </button>
          </div>
        )}

        {/* Barcode & Camera Input Bar */}
        <ManualBarcodeInput 
          onScan={handleScan}
          onOpenCam={() => setIsCameraOpen(true)}
        />

        {/* Stats & Progress Overview */}
        <StatsOverview 
          items={items}
          unknownItems={unknownItems}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onExportExcel={handleExportExcel}
        />

        {/* Product List with Filter and Discrepancy (Thiếu/Dư) Table */}
        <ProductList 
          items={items}
          unknownItems={unknownItems}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onUpdateQty={handleUpdateQty}
          onRemoveUnknown={handleRemoveUnknown}
          onResetItem={handleResetItem}
          onDeleteItem={handleDeleteItem}
          onOpenExcel={() => setIsImportModalOpen(true)}
          onOpenSheet={() => setIsSheetModalOpen(true)}
          onLoadDemo={() => handleImportSuccess(SAMPLE_DATA, 'Mau_Don_Kiem_Ke_Demo.xlsx')}
        />
      </main>

      {/* Floating Bottom Quick Action for Mobile Camera */}
      <div className="mobile-floating-camera">
        <button 
          type="button" 
          className="btn-floating-scan"
          onClick={() => setIsCameraOpen(true)}
          title="Bật Camera Quét Barcode"
        >
          <Smartphone size={22} />
          <span>QUÉT CAMERA</span>
        </button>
      </div>

      {/* Camera Viewfinder Modal */}
      <CameraScanner 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(code) => {
          handleScan(code, 1);
        }}
      />

      {/* Import File Excel Modal */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Barcode & QR Simulator Test Modal */}
      <BarcodeSimulatorModal 
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        items={items}
        onSimulateScan={(code) => handleScan(code, 1)}
      />

      {/* Google Sheet Sync Modal */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onLoadSuccess={(loadedItems, title) => {
          handleImportSuccess(loadedItems, title);
        }}
        items={items}
        unknownItems={unknownItems}
      />

      {/* Clear / Reset Data Modal */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onClearAll={handleClearAllData}
        onResetCounts={handleResetAllCounts}
        totalItems={items.length}
        totalScanned={items.reduce((s, i) => s + (i.scannedQty || 0), 0)}
      />
    </div>
  );

}
