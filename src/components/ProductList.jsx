import React, { useState } from 'react';
import { 
  Search, 
  Check, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Minus, 
  Trash2, 
  Copy, 
  CheckCheck, 
  Boxes,
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';

export default function ProductList({
  items,
  unknownItems,
  activeFilter,
  onFilterChange,
  onUpdateQty,
  onRemoveUnknown,
  onResetItem
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // Classify standard items
  const completedList = items.filter(i => i.scannedQty === i.targetQty && i.targetQty > 0);
  const missingList = items.filter(i => i.scannedQty < i.targetQty);
  const surplusList = items.filter(i => i.scannedQty > i.targetQty);

  // Filter based on active tab
  let displayedItems = [];
  let displayedUnknown = [];

  if (activeFilter === 'all') {
    displayedItems = items;
    displayedUnknown = unknownItems;
  } else if (activeFilter === 'missing') {
    displayedItems = missingList;
    displayedUnknown = [];
  } else if (activeFilter === 'completed') {
    displayedItems = completedList;
    displayedUnknown = [];
  } else if (activeFilter === 'surplus') {
    displayedItems = surplusList;
    displayedUnknown = unknownItems;
  } else if (activeFilter === 'diff_only') {
    // REQUIREMENT: "khi xong bảng sẽ hiển thị sản phẩm thiếu hoặc dư. đủ không hiển thị."
    displayedItems = [...missingList, ...surplusList];
    displayedUnknown = unknownItems;
  }

  // Apply search query filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    displayedItems = displayedItems.filter(i => 
      i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
    );
    displayedUnknown = displayedUnknown.filter(u => 
      u.code.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
    );
  }

  const totalDiffCount = missingList.length + surplusList.length + unknownItems.length;

  return (
    <div className="product-list-container">
      {/* Navigation Tabs */}
      <div className="filter-tabs-wrapper">
        <div className="filter-tabs-scroll">
          <button 
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            <Boxes size={16} />
            <span>Tất cả</span>
            <span className="tab-badge">{items.length}</span>
          </button>

          <button 
            className={`filter-tab ${activeFilter === 'missing' ? 'active' : ''}`}
            onClick={() => onFilterChange('missing')}
          >
            <Clock size={16} />
            <span>Chưa quét / Thiếu</span>
            <span className={`tab-badge ${missingList.length > 0 ? 'badge-amber' : ''}`}>
              {missingList.length}
            </span>
          </button>

          <button 
            className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => onFilterChange('completed')}
          >
            <CheckCheck size={16} />
            <span>Đã quét đủ</span>
            <span className="tab-badge badge-emerald">
              {completedList.length}
            </span>
          </button>

          <button 
            className={`filter-tab ${activeFilter === 'surplus' ? 'active' : ''}`}
            onClick={() => onFilterChange('surplus')}
          >
            <AlertTriangle size={16} />
            <span>Dư / Mã lạ</span>
            <span className={`tab-badge ${(surplusList.length + unknownItems.length) > 0 ? 'badge-rose' : ''}`}>
              {surplusList.length + unknownItems.length}
            </span>
          </button>

          {/* CRITICAL TAB: "khi xong bảng sẽ hiển thị sản phẩm thiếu hoặc dư. đủ không hiển thị." */}
          <button 
            className={`filter-tab special-diff-tab ${activeFilter === 'diff_only' ? 'active' : ''}`}
            onClick={() => onFilterChange('diff_only')}
            title="Ẩn tất cả sản phẩm đã đủ, chỉ hiển thị danh sách bị lệch (Thiếu hoặc Dư)"
          >
            <Layers size={16} />
            <span>BẢNG LỆCH (CHỈ THIẾU & DƯ)</span>
            <span className={`tab-badge ${totalDiffCount > 0 ? 'badge-danger-glow' : 'badge-emerald'}`}>
              {totalDiffCount}
            </span>
          </button>
        </div>
      </div>

      {/* Search and Context Bar */}
      <div className="search-filter-bar">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã vạch code hoặc tên sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {activeFilter === 'diff_only' && (
          <div className="diff-notice-tag">
            <span>Đang ẩn các món đã đủ (100%) - Chỉ hiển thị {displayedItems.length + displayedUnknown.length} sản phẩm lệch</span>
          </div>
        )}
      </div>

      {/* Product List Content */}
      <div className="product-cards-grid">
        {/* Empty State when no items matched */}
        {displayedItems.length === 0 && displayedUnknown.length === 0 && (
          <div className="empty-state-box">
            {activeFilter === 'diff_only' ? (
              <div className="celebration-empty-diff">
                <div className="celebration-icon">🎉</div>
                <h3>Tuyệt vời! Không có sản phẩm nào thiếu hoặc dư!</h3>
                <p>Tất cả sản phẩm trong phiếu xuất kho đều đã được kiểm đếm chính xác 100%.</p>
                <button 
                  className="btn-primary btn-sm"
                  onClick={() => onFilterChange('all')}
                >
                  Xem toàn bộ danh sách
                </button>
              </div>
            ) : (
              <div className="generic-empty">
                <Boxes size={48} className="empty-icon" />
                <h3>Không tìm thấy sản phẩm phù hợp</h3>
                <p>Thử đổi bộ lọc hoặc kiểm tra lại từ khóa tìm kiếm</p>
              </div>
            )}
          </div>
        )}

        {/* Regular Items in Order */}
        {displayedItems.map((item) => {
          const isComplete = item.scannedQty === item.targetQty && item.targetQty > 0;
          const isMissing = item.scannedQty < item.targetQty;
          const isSurplus = item.scannedQty > item.targetQty;
          const percent = item.targetQty > 0 
            ? Math.min(100, Math.round((item.scannedQty / item.targetQty) * 100))
            : 0;

          return (
            <div 
              key={item.code} 
              className={`product-card ${
                isComplete ? 'card-complete' : isSurplus ? 'card-surplus' : isMissing && item.scannedQty > 0 ? 'card-in-progress' : 'card-not-started'
              }`}
            >
              {/* Top row: Code and Status Badge */}
              <div className="product-card-top">
                <div className="code-chip" onClick={() => copyToClipboard(item.code)} title="Bấm để sao chép mã">
                  <span className="code-text">{item.code}</span>
                  {copiedCode === item.code ? (
                    <span className="copied-tag">Đã sao chép!</span>
                  ) : (
                    <Copy size={13} className="copy-icon" />
                  )}
                </div>

                <div className="status-badge-wrapper">
                  {isComplete && (
                    <span className="badge-pill badge-pill-success">
                      <Check size={14} /> ĐÃ ĐỦ
                    </span>
                  )}
                  {isMissing && (
                    <span className="badge-pill badge-pill-warning">
                      <Clock size={14} /> THIẾU {item.targetQty - item.scannedQty}
                    </span>
                  )}
                  {isSurplus && (
                    <span className="badge-pill badge-pill-danger">
                      <AlertTriangle size={14} /> DƯ +{item.scannedQty - item.targetQty}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <h3 className="product-name" title={item.name}>
                {item.name}
              </h3>

              {/* Progress Bar inside Card */}
              <div className="item-progress-track">
                <div 
                  className={`item-progress-bar ${
                    isComplete ? 'bar-success' : isSurplus ? 'bar-danger' : 'bar-warning'
                  }`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              {/* Numbers & Stepper Controls */}
              <div className="product-card-bottom">
                <div className="quantity-display">
                  <span className="qty-scanned-big">{item.scannedQty}</span>
                  <span className="qty-divider">/</span>
                  <span className="qty-target-total">{item.targetQty}</span>
                  <span className="qty-unit">cái</span>
                </div>

                <div className="card-stepper-actions">
                  <button 
                    type="button" 
                    className="btn-stepper-sm"
                    onClick={() => onUpdateQty(item.code, -1)}
                    disabled={item.scannedQty <= 0}
                    title="Giảm 1"
                  >
                    <Minus size={15} />
                  </button>

                  <button 
                    type="button" 
                    className="btn-stepper-sm btn-stepper-plus"
                    onClick={() => onUpdateQty(item.code, 1)}
                    title="Tăng 1 (Đếm thêm)"
                  >
                    <Plus size={15} />
                  </button>

                  {item.scannedQty > 0 && (
                    <button 
                      type="button" 
                      className="btn-stepper-reset"
                      onClick={() => onResetItem(item.code)}
                      title="Đặt lại về 0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Unknown Items Section (Mã lạ ngoài phiếu xuất) */}
        {displayedUnknown.map((uItem) => (
          <div key={uItem.code} className="product-card card-unknown">
            <div className="product-card-top">
              <div className="code-chip chip-unknown">
                <span className="code-text">{uItem.code}</span>
              </div>
              <div className="status-badge-wrapper">
                <span className="badge-pill badge-pill-unknown">
                  <AlertTriangle size={14} /> MÃ LẠ NGOÀI ĐƠN
                </span>
              </div>
            </div>

            <h3 className="product-name text-rose-300">
              ⚠️ Sản phẩm này không có trong phiếu xuất gốc
            </h3>

            <div className="product-card-bottom">
              <div className="quantity-display">
                <span className="qty-scanned-big text-rose">+{uItem.scannedQty}</span>
                <span className="qty-unit">đã quét</span>
              </div>

              <div className="card-stepper-actions">
                <button 
                  type="button" 
                  className="btn-stepper-sm"
                  onClick={() => onUpdateQty(uItem.code, -1, true)}
                  title="Giảm 1"
                >
                  <Minus size={15} />
                </button>
                <button 
                  type="button" 
                  className="btn-stepper-sm btn-stepper-plus"
                  onClick={() => onUpdateQty(uItem.code, 1, true)}
                  title="Tăng 1"
                >
                  <Plus size={15} />
                </button>
                <button 
                  type="button" 
                  className="btn-stepper-delete"
                  onClick={() => onRemoveUnknown(uItem.code)}
                  title="Xoá mã lạ này"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
