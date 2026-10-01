import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, PackageX, Boxes, FileSpreadsheet, Eye } from 'lucide-react';

export default function StatsOverview({ 
  items, 
  unknownItems, 
  activeFilter, 
  onFilterChange,
  onExportExcel 
}) {
  const totalSku = items.length;
  const totalTargetQty = items.reduce((sum, i) => sum + i.targetQty, 0);
  const totalScannedQty = items.reduce((sum, i) => sum + i.scannedQty, 0);

  // Grouping
  const completedItems = items.filter(i => i.scannedQty === i.targetQty && i.targetQty > 0);
  const missingItems = items.filter(i => i.scannedQty < i.targetQty);
  const surplusItems = items.filter(i => i.scannedQty > i.targetQty);
  const totalDiffCount = missingItems.length + surplusItems.length + unknownItems.length;

  const totalMissingQty = missingItems.reduce((sum, i) => sum + (i.targetQty - i.scannedQty), 0);
  const totalSurplusQty = surplusItems.reduce((sum, i) => sum + (i.scannedQty - i.targetQty), 0) + 
    unknownItems.reduce((sum, u) => sum + u.scannedQty, 0);

  // Overall percentage
  const percent = totalTargetQty > 0 
    ? Math.min(100, Math.round((totalScannedQty / totalTargetQty) * 100)) 
    : 0;

  return (
    <div className="stats-overview-wrapper">
      {/* Main Progress Bar Card */}
      <div className="progress-banner-card">
        <div className="progress-info-row">
          <div>
            <div className="progress-label">Tiến Độ Kiểm Đếm Đơn Hàng</div>
            <div className="progress-numbers">
              <span className="scanned-num">{totalScannedQty}</span>
              <span className="separator">/</span>
              <span className="target-num">{totalTargetQty}</span>
              <span className="unit-label">sản phẩm</span>
            </div>
          </div>
          <div className="progress-percent-badge">
            {percent}%
          </div>
        </div>

        {/* Progress Track */}
        <div className="progress-track">
          <div 
            className={`progress-fill ${percent === 100 && totalSurplusQty === 0 ? 'complete' : ''}`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>

        {/* Quick status summary line */}
        <div className="progress-sub-details">
          <span>{completedItems.length}/{totalSku} mã hàng đã đủ 100%</span>
          {totalMissingQty > 0 && (
            <span className="missing-tag">Thiếu {totalMissingQty} cái</span>
          )}
          {totalSurplusQty > 0 && (
            <span className="surplus-tag">Dư +{totalSurplusQty} cái</span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Card 1: Tất cả */}
        <div 
          className={`kpi-card ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Tổng Mặt Hàng</span>
            <Boxes size={18} className="kpi-icon total" />
          </div>
          <div className="kpi-value">{totalSku} <span className="kpi-sub">mã</span></div>
          <div className="kpi-desc">Tổng số mã trong đơn xuất</div>
        </div>

        {/* Card 2: Thiếu / Chưa đủ */}
        <div 
          className={`kpi-card ${activeFilter === 'missing' ? 'active' : ''}`}
          onClick={() => onFilterChange('missing')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Đang Thiếu</span>
            <Clock size={18} className="kpi-icon missing" />
          </div>
          <div className="kpi-value text-amber">
            {missingItems.length} <span className="kpi-sub">mã</span>
          </div>
          <div className="kpi-desc">
            {totalMissingQty > 0 ? `Thiếu ${totalMissingQty} sp chưa quét` : 'Không có mã thiếu'}
          </div>
        </div>

        {/* Card 3: Đã đủ */}
        <div 
          className={`kpi-card ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => onFilterChange('completed')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Đã Quét Đủ</span>
            <CheckCircle2 size={18} className="kpi-icon completed" />
          </div>
          <div className="kpi-value text-emerald">
            {completedItems.length} <span className="kpi-sub">mã</span>
          </div>
          <div className="kpi-desc">Khớp chính xác 100% số lượng</div>
        </div>

        {/* Card 4: Dư hoặc Mã Lạ */}
        <div 
          className={`kpi-card ${activeFilter === 'surplus' ? 'active' : ''}`}
          onClick={() => onFilterChange('surplus')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Bị Dư / Mã Lạ</span>
            <AlertTriangle size={18} className="kpi-icon surplus" />
          </div>
          <div className="kpi-value text-rose">
            {surplusItems.length + unknownItems.length} <span className="kpi-sub">mã</span>
          </div>
          <div className="kpi-desc">
            {surplusItems.length > 0 ? `${surplusItems.length} vượt SL` : ''} 
            {unknownItems.length > 0 ? ` + ${unknownItems.length} mã lạ` : ''}
            {surplusItems.length === 0 && unknownItems.length === 0 ? 'Không bị dư thừa' : ''}
          </div>
        </div>
      </div>

      {/* Special Highlights Bar for Difference Mode */}
      <div className="diff-highlight-bar">
        <div className="diff-text">
          <Eye size={18} />
          <span>
            {totalDiffCount === 0 
              ? 'Tất cả sản phẩm đã khớp chính xác 100%! Đơn hàng hoàn tất hoàn hảo.' 
              : `Hiện có ${totalDiffCount} mặt hàng có chênh lệch (thiếu hoặc dư).`}
          </span>
        </div>
        <div className="diff-actions">
          <button 
            className={`btn-diff-mode ${activeFilter === 'diff_only' ? 'active' : ''}`}
            onClick={() => onFilterChange('diff_only')}
            title="Chỉ hiển thị các sản phẩm thiếu hoặc dư, tự động ẩn sản phẩm đã đủ"
          >
            <AlertTriangle size={16} />
            <span>Xem Bảng Lệch (Thiếu / Dư)</span>
          </button>

          <button 
            className="btn-export-excel"
            onClick={onExportExcel}
            title="Tải báo cáo kiểm kê chi tiết về máy"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
