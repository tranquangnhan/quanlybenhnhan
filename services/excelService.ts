
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

        const workbook = lib.read(new Uint8Array(data), { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
            throw new Error("File Excel không có dữ liệu (Sheet trống).");
        }

        // CHỌN SHEET CUỐI CÙNG (BÊN PHẢI NHẤT)
        const lastSheetIndex = workbook.SheetNames.length - 1;
        const targetSheetName = workbook.SheetNames[lastSheetIndex];
        const worksheet = workbook.Sheets[targetSheetName];
        
        const jsonData = lib.utils.sheet_to_json(worksheet, { header: 1 });
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
             
             // Prevent [object Object] by handling objects gracefully
             if (typeof cell === 'object') {
                 if (cell instanceof Date) {
                     return cell.toLocaleDateString('vi-VN');
                 }
                 // If it is a generic object, ignore it to prevent [object Object] spam
                 return ''; 
             }
             
             return String(cell).trim();
        }).join('\t');
    })
    .filter(line => line.length > 0) // Remove completely empty lines
    .join('\n');
};
