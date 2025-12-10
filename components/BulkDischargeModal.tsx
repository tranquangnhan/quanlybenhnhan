
import React, { useState, useMemo } from 'react';
import { Patient } from '../types';
import { X, FileText, CheckSquare, Square, Search, Download } from 'lucide-react';

interface Props {
  patients: Patient[];
  isOpen: boolean;
  onClose: () => void;
}

const BulkDischargeModal: React.FC<Props> = ({ patients, isOpen, onClose }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hometowns, setHometowns] = useState<Record<string, string>>({});
  const [diagnoses, setDiagnoses] = useState<Record<string, string>>({});
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.roomId !== 'waiting' && // Only show admitted patients
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [patients, searchTerm]);

  if (!isOpen) return null;

  const cleanDiagnosis = (d: string) => {
    if (!d) return "";
    let cleaned = d;
    cleaned = cleaned.replace(/^Sốt[,]?\s+/i, '');
    cleaned = cleaned.replace(/\s*N\d+$/i, '');
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned.trim();
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredPatients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPatients.map(p => p.id)));
    }
  };

  const handleHometownChange = (id: string, value: string) => {
    setHometowns(prev => ({ ...prev, [id]: value }));
  };

  const handleDiagnosisChange = (id: string, value: string) => {
    setDiagnoses(prev => ({ ...prev, [id]: value }));
  };

  // --- Helper Logic for Content Generation (Reused from DischargePaperModal logic) ---
  const mapRank = (r: string) => {
    const lower = (r || '').toLowerCase();
    if (lower.includes('h1')) return 'Hạ sĩ';
    if (lower.includes('h2')) return 'Trung sĩ';
    if (lower.includes('h3')) return 'Thượng sĩ';
    if (lower.includes('b1')) return 'Binh nhất';
    if (lower.includes('b2')) return 'Binh nhì';
    if (lower.includes('1/')) return 'Thiếu úy';
    if (lower.includes('2/')) return 'Trung úy';
    if (lower.includes('3/')) return 'Thượng úy';
    if (lower.includes('4/')) return 'Đại úy';
    return r;
  };

  const mapRole = (r: string) => {
      const lower = (r || '').toLowerCase().trim();
      if (lower === 'cs') return 'Chiến sĩ';
      if (lower === 'at') return 'Tiểu đội trưởng';
      if (lower === 'kđt') return 'Khẩu đội trưởng';
      if (lower === 'bt') return 'Trung đội trưởng';
      if (lower === 'ct') return 'Đại đội trưởng';
      return r || 'Chiến sĩ';
  };

  const mapUnit = (u: string) => {
     let mapped = u || '';
     mapped = mapped.replace(/c(\d+)/gi, 'Đại đội $1');
     mapped = mapped.replace(/d(\d+)/gi, 'Tiểu đoàn $1');
     mapped = mapped.replace(/-/g, ' - ');
     return mapped;
  };

  const getAutoContent = (diagnosis: string) => {
      const d = (diagnosis || '').toLowerCase();
      let meds = '';
      let condition = '';

      if (d.includes('sốt')) {
          meds = "- Kháng sinh\n- Giảm ho\n- Giảm đau, hạ sốt\n- Kháng histamin\n- Sinh tố";
      } else {
          meds = "- Kháng sinh\n- Giảm đau, hạ sốt\n- Sinh tố";
      }

      if ((d.includes('viêm họng') || d.includes('họng')) && d.includes('sốt')) {
          condition = "Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết sổ mũi, hết đau họng, ăn ngủ sinh hoạt bình thường.";
      } else if (d.includes('amydal') || d.includes('amidan')) {
          condition = "Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết đau đầu, hết đau họng, amydal hết sưng đau, ăn ngủ sinh hoạt bình thường.";
      } else {
          condition = "Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, ăn ngủ sinh hoạt bình thường.";
      }
      return { meds, condition };
  };

  const handleDownload = () => {
    const selectedList = patients.filter(p => selectedIds.has(p.id));
    if (selectedList.length === 0) return;

    const today = new Date();
    const dDay = today.getDate();
    const dMonth = today.getMonth() + 1;
    const dYear = today.getFullYear();

    const dischargeD = new Date(dischargeDate);
    const outDay = dischargeD.getDate();
    const outMonth = dischargeD.getMonth() + 1;
    const outYear = dischargeD.getFullYear();
    const formattedDischargeDate = `${outDay < 10 ? '0'+outDay : outDay}/${outMonth < 10 ? '0'+outMonth : outMonth}/${outYear}`;

    // Generate inner HTML for each patient
    const pagesHtml = selectedList.map((p, index) => {
        const { meds, condition } = getAutoContent(p.diagnosis);
        const hometown = hometowns[p.id] || '.......................................................';
        const medsHtml = meds.split('\n').map(line => `<div style="margin-bottom: 2px;">${line}</div>`).join('');
        
        // Use user edited diagnosis or clean it on the fly if not edited
        const finalDiagnosis = diagnoses[p.id] !== undefined ? diagnoses[p.id] : cleanDiagnosis(p.diagnosis);

        // Page break logic: Add a break BEFORE every page except the first one
        const pageBreak = index > 0 ? '<br clear=all style="mso-special-character:line-break;page-break-before:always">' : '';

        return `
            ${pageBreak}
            <div class="Section1" style="margin: 1.0cm; font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.3;">
              <table style="width: 100%; margin-bottom: 15px; border-collapse: collapse;">
                 <tr>
                    <td style="width: 45%; padding: 0; vertical-align: top;">
                        <table style="width: auto; border-collapse: collapse;">
                            <tr>
                                <td style="text-align: left;">
                                    <p style="margin: 0; line-height: 1.2; font-size: 13pt; text-transform: uppercase;">TRUNG ĐOÀN 66</p>
                                    <p style="margin: 0; line-height: 1.2; font-size: 13pt; text-align: center; font-weight: bold; text-transform: uppercase;">ĐẠI ĐỘI 24</p>
                                    <p style="margin: 0; line-height: 1.2; font-size: 13pt; text-align: center; font-style: italic;">Số: .....</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td style="width: 55%; text-align: center; vertical-align: top;">
                       <p style="margin: 0; line-height: 1.2; font-size: 13pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                       <p style="margin:0; line-height:1.2; font-size:13pt; text-align:center;">
                            <u><b>Độc lập – Tự do – Hạnh phúc</b></u>
                        </p>
                    </td>
                 </tr>
              </table>

              <h1 style="text-align: center; font-weight: bold; text-transform: uppercase; font-size: 16pt; margin: 20px 0 15px 0;">GIẤY RA VIỆN</h1>

              <div style="text-align: justify;">
                 <div style="margin-bottom: 4px;">Họ và tên: <span style="font-weight: bold; text-transform: uppercase; font-size: 14pt;">${p.name}</span></div>
                 <div style="margin-bottom: 4px;">Năm sinh: ${p.dob}</div>
                 <div style="margin-bottom: 4px;">Quân hàm: ${mapRank(p.rank)}</div>
                 <div style="margin-bottom: 4px;">Chức vụ: ${mapRole(p.role)}</div>
                 <div style="margin-bottom: 4px;">Đơn vị: ${mapUnit(p.unit)}</div>
                 <div style="margin-bottom: 4px;">Quê quán: ${hometown}</div>
                 <div style="margin-bottom: 4px;">Ngày vào viện: ${p.admissionDate} – Ngày ra viện: ${formattedDischargeDate}</div>
                 <div style="margin-bottom: 4px;">Chẩn đoán: <span style="font-style: italic; font-weight: bold;">${finalDiagnosis} đã ổn định</span></div>
                 
                 <div style="margin-bottom: 4px;">Thuốc điều trị:</div>
                 <div style="margin-left: 20px; margin-bottom: 5px;">${medsHtml}</div>
                 
                 <div style="margin-bottom: 4px;">Tình trạng bệnh nhân lúc ra viện: ${condition}</div>
                 <div style="margin-bottom: 4px;">Ý kiến đề nghị: <span style="font-style: italic;">Về đơn vị công tác.</span></div>
                 <div style="margin-bottom: 4px;">Chấp hành kỷ luật của bệnh nhân khi nằm bệnh xá: <span style="font-weight: bold;">Tốt.</span></div>
              </div>

              <table style="width: 100%; margin-top: 5px; border-collapse: collapse;">
                 <tr>
                     <td style="width: 50%;"></td>
                     <td style="width: 50%; text-align: center; font-style: italic; font-size: 14pt; padding-bottom: 5px;">
                        Ngày ${dDay} tháng ${dMonth} năm ${dYear}
                     </td>
                 </tr>
                 <tr>
                    <td style="width: 50%; text-align: center; font-weight: bold; font-size: 14pt;">
                       Y TÁ HÀNH CHÍNH
                    </td>
                    <td style="width: 50%; text-align: center; font-weight: bold; font-size: 14pt;">
                       BỆNH XÁ TRƯỞNG
                    </td>
                 </tr>
              </table>
            </div>
        `;
    }).join('');

    const finalHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
           <meta charset="utf-8">
           <title>Giấy Ra Viện (Gộp)</title>
           <style>
             @page Section1 { size: 419.55pt 595.3pt; margin: 1.0cm; }
             div.Section1 { page: Section1; }
           </style>
        </head>
        <body>
           ${pagesHtml}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', finalHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `giay-ra-vien-tong-hop.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-pop-in overflow-hidden">
        
        {/* Header */}
        <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg text-green-700">
                 <FileText size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-gray-800">Xuất Giấy Ra Viện (Hàng loạt)</h2>
                 <p className="text-xs text-gray-500">Chọn bệnh nhân để xuất chung 1 file Word</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-green-200 rounded-full text-gray-500 hover:text-green-700 transition">
              <X size={24} />
           </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white border-b border-gray-100 flex gap-4 items-center flex-wrap shrink-0">
           <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                 type="text" 
                 placeholder="Tìm tên hoặc chẩn đoán..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 outline-none"
              />
           </div>
           <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Ngày ra viện:</span>
              <input 
                 type="date" 
                 value={dischargeDate}
                 onChange={e => setDischargeDate(e.target.value)}
                 className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 outline-none focus:border-green-400"
              />
           </div>
        </div>

        {/* List Header */}
        <div className="grid grid-cols-[50px_1.5fr_2fr_2fr] gap-4 px-6 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
           <div className="flex items-center justify-center cursor-pointer" onClick={toggleAll}>
              {selectedIds.size === filteredPatients.length && filteredPatients.length > 0 ? (
                 <CheckSquare size={18} className="text-green-600" />
              ) : (
                 <Square size={18} className="text-gray-400" />
              )}
           </div>
           <div>Họ tên / Cấp bậc</div>
           <div>Chẩn đoán (Sửa trực tiếp)</div>
           <div>Quê quán (Nhập nhanh)</div>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto p-0 flex-1 min-h-0 bg-gray-50/50">
           {filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                 <p className="italic">Không tìm thấy bệnh nhân nào</p>
              </div>
           ) : (
             filteredPatients.map(p => {
                const isSelected = selectedIds.has(p.id);
                // Get display value: either from state (edited) or computed default
                const displayDiagnosis = diagnoses[p.id] !== undefined ? diagnoses[p.id] : cleanDiagnosis(p.diagnosis);
                
                return (
                   <div 
                      key={p.id}
                      onClick={() => toggleSelection(p.id)}
                      className={`grid grid-cols-[50px_1.5fr_2fr_2fr] gap-4 px-6 py-3 border-b border-gray-100 items-center cursor-pointer transition-colors
                         ${isSelected ? 'bg-green-50/50' : 'hover:bg-white'}
                      `}
                   >
                      <div className="flex justify-center text-green-600">
                         {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-gray-300" />}
                      </div>
                      
                      <div>
                         <p className="font-bold text-gray-800">{p.name}</p>
                         <p className="text-xs text-gray-500">{mapRank(p.rank)} - {mapUnit(p.unit)}</p>
                      </div>

                      <div onClick={e => e.stopPropagation()}>
                         <input 
                            type="text"
                            value={displayDiagnosis}
                            onChange={e => handleDiagnosisChange(p.id, e.target.value)}
                            className={`w-full text-sm px-3 py-1.5 rounded-lg border focus:ring-2 outline-none transition
                               ${isSelected ? 'bg-white border-green-200 focus:ring-green-400 text-gray-800' : 'bg-gray-100 border-transparent text-gray-400 pointer-events-none'}
                            `}
                            disabled={!isSelected}
                         />
                      </div>

                      <div onClick={e => e.stopPropagation()}>
                         <input 
                            type="text"
                            placeholder="Nhập quê quán..."
                            value={hometowns[p.id] || ''}
                            onChange={e => handleHometownChange(p.id, e.target.value)}
                            className={`w-full text-sm px-3 py-1.5 rounded-lg border focus:ring-2 outline-none transition
                               ${isSelected ? 'bg-white border-green-200 focus:ring-green-400' : 'bg-gray-100 border-transparent text-gray-400 pointer-events-none'}
                            `}
                            disabled={!isSelected}
                         />
                      </div>
                   </div>
                );
             })
           )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
           <div className="text-sm text-gray-500">
              Đã chọn <span className="font-bold text-green-600">{selectedIds.size}</span> bệnh nhân
           </div>
           <button 
              onClick={handleDownload}
              disabled={selectedIds.size === 0}
              className={`
                 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95
                 ${selectedIds.size > 0 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                    : 'bg-gray-300 cursor-not-allowed'}
              `}
           >
              <Download size={20} />
              Tải File Word ({selectedIds.size} BN)
           </button>
        </div>

      </div>
    </div>
  );
};

export default BulkDischargeModal;
