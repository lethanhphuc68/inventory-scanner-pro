import * as XLSX from 'xlsx';

// Sample demo data for quick test without needing an existing excel file
export const SAMPLE_DATA = [
  { code: '8934563128124', name: 'Mì Hảo Hảo Tôm Chua Cay 75g', targetQty: 10, scannedQty: 0 },
  { code: '8934673587023', name: 'Nước Ngọt Coca-Cola Sleek Can 320ml', targetQty: 24, scannedQty: 0 },
  { code: '8936036010021', name: 'Sữa Milo Nestle Hộp 180ml', targetQty: 12, scannedQty: 0 },
  { code: '8935049500544', name: 'Cà Phê G7 3in1 Hộp 18 gói', targetQty: 6, scannedQty: 0 },
  { code: '8934822001158', name: 'Bánh Quy Cosy Mè Kinh Đô 288g', targetQty: 8, scannedQty: 0 },
  { code: '8935001701323', name: 'Dầu Ăn Simply Nguyên Chất 1L', targetQty: 4, scannedQty: 0 },
  { code: '8934868117769', name: 'Nước Rửa Tay Lifebuoy Bảo Vệ 500ml', targetQty: 5, scannedQty: 0 },
  { code: '1241205102',    name: 'Áo Thun Cotton Basic Size L (Mã ví dụ của bạn)', targetQty: 3, scannedQty: 0 },
];

// Helper to normalize string for comparison
function normalizeHeader(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parse an uploaded Excel file (.xlsx, .xls, .csv)
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.length) {
          throw new Error('File Excel không có sheet nào.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length < 2) {
          throw new Error('File Excel không đủ dữ liệu (cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).');
        }

        // Find header row (usually row 0 or 1)
        let headerRowIndex = 0;
        let colCodeIndex = -1;
        let colNameIndex = -1;
        let colQtyIndex = -1;

        for (let r = 0; r < Math.min(rawJson.length, 5); r++) {
          const row = rawJson[r];
          row.forEach((cell, cIndex) => {
            const h = normalizeHeader(cell);
            // Matches for code / barcode / sku
            if (['code', 'ma', 'masp', 'masanpham', 'barcode', 'sku', 'mahang', 'mavach'].includes(h) || h.includes('code') || h.includes('mavach')) {
              if (colCodeIndex === -1) colCodeIndex = cIndex;
            }
            // Matches for name / product name
            if (['tensanpham', 'tensp', 'tenhang', 'tenhanghoa', 'ten', 'name', 'productname', 'sanpham', 'mota'].includes(h) || h.includes('tensanpham') || h.includes('ten')) {
              if (colNameIndex === -1) colNameIndex = cIndex;
            }
            // Matches for quantity
            if (['soluong', 'soluongxuat', 'slxuat', 'slcanxuat', 'sl', 'quantity', 'qty', 'soluongyeucau'].includes(h) || h.includes('soluong') || h === 'sl') {
              if (colQtyIndex === -1) colQtyIndex = cIndex;
            }
          });

          // If we found at least code and qty or name
          if (colCodeIndex !== -1 && (colQtyIndex !== -1 || colNameIndex !== -1)) {
            headerRowIndex = r;
            break;
          }
        }

        // Fallback default column order if headers weren't named standard: Col 0: code, Col 1: name, Col 2: qty
        if (colCodeIndex === -1) colCodeIndex = 0;
        if (colNameIndex === -1) colNameIndex = 1;
        if (colQtyIndex === -1) colQtyIndex = 2;

        const itemsMap = new Map();

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          let rawCode = row[colCodeIndex];
          if (rawCode === undefined || rawCode === null || String(rawCode).trim() === '') {
            continue; // Skip empty rows
          }

          // Format code safely (trim spaces, keep exact text)
          const code = String(rawCode).trim();
          const name = colNameIndex < row.length && row[colNameIndex] ? String(row[colNameIndex]).trim() : `Sản phẩm ${code}`;
          
          let qty = 1;
          if (colQtyIndex < row.length && row[colQtyIndex] !== undefined) {
            const parsedQty = parseInt(String(row[colQtyIndex]).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedQty) && parsedQty >= 0) {
              qty = parsedQty;
            }
          }

          // If the file has duplicated code rows, sum up the required quantity
          if (itemsMap.has(code)) {
            const existing = itemsMap.get(code);
            existing.targetQty += qty;
          } else {
            itemsMap.set(code, {
              code,
              name,
              targetQty: qty,
              scannedQty: 0,
            });
          }
        }

        const items = Array.from(itemsMap.values());
        if (items.length === 0) {
          throw new Error('Không tìm thấy dữ liệu hợp lệ trong file Excel. Vui lòng kiểm tra lại cấu trúc cột.');
        }

        resolve({
          fileName: file.name,
          itemsCount: items.length,
          items,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate and trigger download for sample Excel template
 */
export function downloadSampleTemplate() {
  const data = [
    {
      'Mã sản phẩm (Code / Barcode)': '8934563128124',
      'Tên sản phẩm': 'Mì Hảo Hảo Tôm Chua Cay 75g',
      'Số lượng xuất': 10
    },
    {
      'Mã sản phẩm (Code / Barcode)': '8934673587023',
      'Tên sản phẩm': 'Nước Ngọt Coca-Cola Sleek Can 320ml',
      'Số lượng xuất': 24
    },
    {
      'Mã sản phẩm (Code / Barcode)': '8936036010021',
      'Tên sản phẩm': 'Sữa Milo Nestle Hộp 180ml',
      'Số lượng xuất': 12
    },
    {
      'Mã sản phẩm (Code / Barcode)': '8935049500544',
      'Tên sản phẩm': 'Cà Phê G7 3in1 Hộp 18 gói',
      'Số lượng xuất': 6
    },
    {
      'Mã sản phẩm (Code / Barcode)': '1241205102',
      'Tên sản phẩm': 'Áo Thun Cotton Basic (Mã ví dụ)',
      'Số lượng xuất': 3
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 40 },
    { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'File_Xuat_Kho_Goc');
  XLSX.writeFile(workbook, 'Mau_File_Xuat_Kho_Kiem_Dem.xlsx');
}

/**
 * Export results to Excel:
 * - Sheet 1: "Chenh_Lech_Thieu_Du" (ONLY items that are deficient or surplus or unknown)
 * - Sheet 2: "Toan_Bo_Kiem_Ke" (All items)
 */
export function exportReportToExcel(items, unknownItems = [], meta = {}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');

  // 1. Data for Discrepancy Sheet (Chỉ Thiếu và Dư)
  const diffRows = [];

  // Filter missing items (scanned < target)
  items.filter(i => i.scannedQty < i.targetQty).forEach(i => {
    diffRows.push({
      'Trạng thái': 'THIẾU',
      'Mã sản phẩm (Code)': i.code,
      'Tên sản phẩm': i.name,
      'SL Cần xuất': i.targetQty,
      'SL Đã quét': i.scannedQty,
      'Chênh lệch (Thiếu/Dư)': i.scannedQty - i.targetQty,
      'Ghi chú': `Còn thiếu ${i.targetQty - i.scannedQty} sản phẩm`
    });
  });

  // Filter surplus items (scanned > target)
  items.filter(i => i.scannedQty > i.targetQty).forEach(i => {
    diffRows.push({
      'Trạng thái': 'DƯ THỪA',
      'Mã sản phẩm (Code)': i.code,
      'Tên sản phẩm': i.name,
      'SL Cần xuất': i.targetQty,
      'SL Đã quét': i.scannedQty,
      'Chênh lệch (Thiếu/Dư)': `+${i.scannedQty - i.targetQty}`,
      'Ghi chú': `Quét lố ${i.scannedQty - i.targetQty} sản phẩm`
    });
  });

  // Unknown items
  unknownItems.forEach(u => {
    diffRows.push({
      'Trạng thái': 'MÃ LẠ NGOÀI ĐƠN',
      'Mã sản phẩm (Code)': u.code,
      'Tên sản phẩm': u.name || 'Không có trong phiếu xuất gốc',
      'SL Cần xuất': 0,
      'SL Đã quét': u.scannedQty,
      'Chênh lệch (Thiếu/Dư)': `+${u.scannedQty}`,
      'Ghi chú': 'Mã không nằm trong danh sách xuất kho'
    });
  });

  // 2. Data for All Items Sheet
  const allRows = items.map(i => {
    let statusText = 'ĐỦ';
    if (i.scannedQty === 0) statusText = 'CHƯA QUÉT';
    else if (i.scannedQty < i.targetQty) statusText = 'THIẾU';
    else if (i.scannedQty > i.targetQty) statusText = 'DƯ';

    return {
      'Trạng thái': statusText,
      'Mã sản phẩm (Code)': i.code,
      'Tên sản phẩm': i.name,
      'SL Cần xuất': i.targetQty,
      'SL Đã quét': i.scannedQty,
      'Chênh lệch': i.scannedQty - i.targetQty,
      'Tỉ lệ hoàn thành': `${Math.round((i.scannedQty / (i.targetQty || 1)) * 100)}%`
    };
  });

  // Add unknown items to all rows as well
  unknownItems.forEach(u => {
    allRows.push({
      'Trạng thái': 'MÃ LẠ NGOÀI ĐƠN',
      'Mã sản phẩm (Code)': u.code,
      'Tên sản phẩm': u.name || 'Không có trong phiếu xuất gốc',
      'SL Cần xuất': 0,
      'SL Đã quét': u.scannedQty,
      'Chênh lệch': `+${u.scannedQty}`,
      'Tỉ lệ hoàn thành': '100% (Dư)'
    });
  });

  const workbook = XLSX.utils.book_new();

  // Create sheet 1: Chênh lệch
  const wsDiff = XLSX.utils.json_to_sheet(diffRows.length > 0 ? diffRows : [{ 'Thông báo': 'Tuyệt vời! Tất cả sản phẩm đều khớp chính xác 100%, không có chênh lệch.' }]);
  wsDiff['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(workbook, wsDiff, 'Bao_Cao_Chenh_Lech');

  // Create sheet 2: Toàn bộ
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  wsAll['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, wsAll, 'Toan_Bo_Chi_Tiet');

  const filePrefix = meta.fileName ? meta.fileName.replace(/\.[^/.]+$/, "") : 'Kiem_Kho';
  const timeStamp = now.toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Ket_Qua_${filePrefix}_${timeStamp}.xlsx`);
}
