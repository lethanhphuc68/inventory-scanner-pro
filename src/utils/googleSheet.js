const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyK16sv3S1Wtj148wKEUXk-hkbS80LjJ4sb9tuK3V2j6AoKBQU4Jb0rn-n9T4vSmBTcbg/exec';

/**
 * Đọc danh sách sản phẩm xuất kho từ Google Sheet thông qua GAS API
 */
export async function fetchInventoryFromSheet(sheetUrl, sheetTab = '') {
  const targetUrl = `${GAS_API_URL}?action=getInventory&sheetUrl=${encodeURIComponent(sheetUrl)}&sheetTab=${encodeURIComponent(sheetTab)}`;
  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error('Lỗi kết nối tới Google Apps Script server.');
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Không thể đọc dữ liệu từ Google Sheet. Vui lòng kiểm tra quyền chia sẻ (bất kỳ ai có liên kết đều có thể xem).');
  }
  return data;
}

/**
 * Ghi kết quả kiểm kê (Chênh lệch Thiếu/Dư) ngược về Google Sheet
 */
export async function saveResultsToSheet(sheetUrl, items, unknownItems) {
  const payload = {
    sheetUrl,
    items,
    unknownItems
  };

  const targetUrl = `${GAS_API_URL}?action=saveResults&data=${encodeURIComponent(JSON.stringify(payload))}`;
  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error('Lỗi kết nối tới máy chủ Google Apps Script.');
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Lỗi khi lưu kết quả vào Google Sheet.');
  }
  return data;
}
