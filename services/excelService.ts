
import * as XLSX from 'xlsx';

export const readExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) {
             throw new Error("Failed to read file data");
        }
        
        // Robust library loading for CDN UMD/ESM interop
        const lib = (XLSX as any).read ? XLSX : 
                    ((XLSX as any).default && (XLSX as any).default.read) ? (XLSX as any).default : 
                    (window as any).XLSX;

        if (!lib || typeof lib.read !== 'function') {
             throw new Error("XLSX library failed to load. Please check the CDN link or internet connection.");
        }

        // Cấu hình đọc ngày tháng chính xác
        const workbook = lib.read(new Uint8Array(data), { 
            type: 'array',
            cellDates: true, // Đọc cell date dưới dạng Date object để xử lý format
            dateNF: 'dd/mm/yyyy' // Định dạng ngày tháng mặc định
        });
        
        if (workbook.SheetNames.length === 0) {
            throw new Error("File Excel không có dữ liệu (Sheet trống).");
        }

        // CHỌN SHEET CUỐI CÙNG (BÊN PHẢI NHẤT)
        const lastSheetIndex = workbook.SheetNames.length - 1;
        const targetSheetName = workbook.SheetNames[lastSheetIndex];
        const worksheet = workbook.Sheets[targetSheetName];
        
        // raw: false -> Lấy giá trị hiển thị (String) thay vì giá trị gốc (Số serial date)
        // dateNF -> Định dạng ngày tháng nếu Excel chưa định dạng
        const jsonData = lib.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false, 
            dateNF: 'dd/mm/yyyy',
            defval: ''
        });

        resolve(jsonData);
      } catch (err) {
        console.error("Excel processing error:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const formatExcelDataForAI = (rawData: any[]): string => {
  return rawData
    .map(row => {
        if (!Array.isArray(row)) return '';
        // Check if row has at least one meaningful value
        const hasContent = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
        if (!hasContent) return '';
        
        return row.map(cell => {
             if (cell === null || cell === undefined) return '';
             
             // Vì đã dùng raw: false ở trên, hầu hết dữ liệu đã là string.
             // Tuy nhiên vẫn xử lý phòng hờ trường hợp thư viện trả về object lạ.
             if (typeof cell === 'object') {
                 // Nếu lọt lưới 1 Date object
                 if (cell instanceof Date) {
                     const day = cell.getDate().toString().padStart(2, '0');
                     const month = (cell.getMonth() + 1).toString().padStart(2, '0');
                     const year = cell.getFullYear();
                     return `${day}/${month}/${year}`;
                 }
                 // Nếu là object khác, convert sang string an toàn hoặc bỏ qua
                 return ''; 
             }
             
             return String(cell).trim();
        }).join('\t');
    })
    .filter(line => line.length > 0) // Remove completely empty lines
    .join('\n');
};
