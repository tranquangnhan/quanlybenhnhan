
import React, { useState, useRef, useEffect } from 'react';
import { MOCK_TEXT_INPUT } from '../constants';
import { Sparkles, ClipboardCopy, X, FileSpreadsheet, UploadCloud, FileCheck } from 'lucide-react';
import { readExcelFile, formatExcelDataForAI } from '../services/excelService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => Promise<void>;
  isParsing: boolean;
}

const Importer: React.FC<Props> = ({ isOpen, onClose, onImport, isParsing }) => {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('file'); // Default to file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setActiveTab('file');
        // We don't clear selectedFile intentionally if the user wants to re-import the same file, 
        // but typically for a fresh modal open, maybe we should? 
        // Let's keep previous file if it exists for convenience "lần sau k hỏi lại".
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const processFileAndImport = async () => {
    if (!selectedFile) return;
    
    try {
      const rawData = await readExcelFile(selectedFile);
      const formattedText = formatExcelDataForAI(rawData);
      onImport(formattedText);
    } catch (error) {
      alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng tệp.");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        <div className="bg-pastel-blue p-4 flex justify-between items-center border-b border-pastel-blueDark">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <FileSpreadsheet size={24} />
            Nhập dữ liệu bệnh nhân
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition">
            <X size={20} className="text-blue-900" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'file' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Tải tệp Excel (.xlsx)
          </button>
          <button 
            onClick={() => { setActiveTab('text'); if(!text) setText(MOCK_TEXT_INPUT); }}
            className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Dán văn bản thủ công
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'file' ? (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                    setSelectedFile(file);
                  }
                }}
                className={`
                  border-4 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all
                  ${selectedFile ? 'border-green-300 bg-green-50' : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                
                {selectedFile ? (
                  <>
                    <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <FileCheck size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-700 text-lg">{selectedFile.name}</p>
                      <p className="text-sm text-green-600 opacity-70">Đã sẵn sàng. Nhấn "Bắt đầu Nhập" bên dưới.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <UploadCloud size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-blue-900 text-lg">Chọn file báo cáo hàng ngày</p>
                      <p className="text-sm text-blue-600 opacity-60">Chỉ lọc lấy quân số Bệnh xá e</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2">Dán vùng dữ liệu Excel của bạn vào ô dưới đây.</p>
              <textarea
                className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-0 font-mono text-xs bg-gray-50 resize-none transition"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste raw text here..."
              />
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
          >
            Đóng
          </button>
          <button 
            onClick={activeTab === 'file' ? processFileAndImport : () => onImport(text)}
            disabled={isParsing || (activeTab === 'file' && !selectedFile)}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white shadow-lg
              transition transform active:scale-95
              ${isParsing || (activeTab === 'file' && !selectedFile) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}
            `}
          >
            {isParsing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang lọc dữ liệu...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Bắt đầu Nhập
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Importer;
