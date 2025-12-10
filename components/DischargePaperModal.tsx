
import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { X, FileText, ClipboardList } from 'lucide-react';

interface Props {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

const DischargePaperModal: React.FC<Props> = ({ patient, isOpen, onClose }) => {
  const [hometown, setHometown] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [treatments, setTreatments] = useState('');
  const [condition, setCondition] = useState('');
  const [discipline, setDiscipline] = useState('Tốt');
  const [paperNumber, setPaperNumber] = useState('01');
  const [role, setRole] = useState('');
  const [rank, setRank] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  // Helper to clean diagnosis string
  const cleanDiagnosis = (d: string) => {
    if (!d) return "";
    let cleaned = d;
    // Remove "Sốt," or "Sốt " at the start (case insensitive)
    cleaned = cleaned.replace(/^Sốt[,]?\s+/i, '');
    // Remove "N" followed by numbers at the end (e.g. N1, N12)
    cleaned = cleaned.replace(/\s*N\d+$/i, '');
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned.trim();
  };

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

  useEffect(() => {
    if (patient && isOpen) {
        setHometown('');
        setDischargeDate(new Date().toISOString().split('T')[0]);
        setDiscipline('Tốt');
        setPaperNumber('01');
        
        // Map Rank
        setRank(mapRank(patient.rank));

        // Map Role
        const r = (patient.role || '').toLowerCase().trim();
        let mappedRole = patient.role;
        if (r === 'cs') mappedRole = 'Chiến sĩ';
        else if (r === 'at') mappedRole = 'Tiểu đội trưởng';
        else if (r === 'kđt') mappedRole = 'Khẩu đội trưởng';
        else if (r === 'bt') mappedRole = 'Trung đội trưởng';
        else if (r === 'ct') mappedRole = 'Đại đội trưởng';
        setRole(mappedRole);

        // Clean and set Diagnosis
        setDiagnosis(cleanDiagnosis(patient.diagnosis));
        
        const d = (patient.diagnosis || '').toLowerCase();
        
        if (d.includes('sốt')) {
            setTreatments("- Kháng sinh\n- Giảm ho\n- Giảm đau, hạ sốt\n- Kháng histamin\n- Sinh tố");
        } else {
            setTreatments("- Kháng sinh\n- Giảm đau, hạ sốt\n- Sinh tố");
        }

        if ((d.includes('viêm họng') || d.includes('họng')) && d.includes('sốt')) {
            setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết sổ mũi, hết đau họng, ăn ngủ sinh hoạt bình thường.");
        } else if (d.includes('amydal') || d.includes('amidan')) {
            setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết đau đầu, hết đau họng, amydal hết sưng đau, ăn ngủ sinh hoạt bình thường.");
        } else {
            setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, ăn ngủ sinh hoạt bình thường.");
        }
    }
  }, [patient, isOpen]);

  if (!isOpen || !patient) return null;

  const mapUnit = (u: string) => {
     let mapped = u || '';
     mapped = mapped.replace(/c(\d+)/gi, 'Đại đội $1');
     mapped = mapped.replace(/d(\d+)/gi, 'Tiểu đoàn $1');
     mapped = mapped.replace(/-/g, ' - ');
     return mapped;
  };

  const generateDischargePaper = () => {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      const dischargeD = new Date(dischargeDate);
      const dDay = dischargeD.getDate();
      const dMonth = dischargeD.getMonth() + 1;
      const dYear = dischargeD.getFullYear();
      const formattedDischargeDate = `${dDay < 10 ? '0'+dDay : dDay}/${dMonth < 10 ? '0'+dMonth : dMonth}/${dYear}`;

      const medsHtml = treatments.split('\n').map(line => `<div style="margin-bottom: 2px;">${line}</div>`).join('');
      
      const mappedUnit = mapUnit(patient.unit);
      
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
           <meta charset="utf-8">
           <title>Giấy Ra Viện</title>
           <style>
             /* Page Setup: A5 Portrait */
             @page Section1 { size: 419.55pt 595.3pt; margin: 1.0cm; }
             div.Section1 { page: Section1; }
             body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.3; }
             .header-table td { border: none; padding: 0; vertical-align: top; }
             .center { text-align: center; }
             .bold { font-weight: bold; }
             .italic { font-style: italic; }
             .uppercase { text-transform: uppercase; }
             .indent { margin-left: 20px; }
             .underline { text-decoration: underline; }
             .content-line { margin-bottom: 4px; }
             p { margin: 0; padding: 0; } 
           </style>
        </head>
        <body>
           <div class="Section1">
              <table class="header-table" style="width: 100%; margin-bottom: 15px;">
                 <tr>
                 <td style="width: 45%; padding-left: 0;">

                    <!-- Bảng tự co theo chiều rộng dòng TRUNG ĐOÀN 66 -->
                    <table style="width: auto; border-collapse: collapse;">
                        <tr>
                            <td style="text-align: left;">
                                <p style="margin: 0; line-height: 1.2; font-size: 13pt;" class="uppercase">
                                    TRUNG ĐOÀN 66
                                </p>

                                <!-- Hai dòng dưới căn giữa theo chiều rộng dòng trên -->
                                <p style="margin: 0; line-height: 1.2; font-size: 13pt; text-align: center;" class="bold uppercase">
                                    ĐẠI ĐỘI 24
                                </p>

                                <p style="margin: 0; line-height: 1.2; font-size: 13pt; text-align: center;" class="italic">
                                    Số: ${paperNumber}
                                </p>
                            </td>
                        </tr>
                    </table>

                </td>


                    <td class="center" style="width: 55%;">
                       <p class="uppercase" style="margin: 0; line-height: 1.2; font-size: 13pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                       <p style="margin:0; line-height:1.2; font-size:13pt; text-align:center;">
                            <u><b>Độc lập – Tự do – Hạnh phúc</b></u>
                        </p>

                    </td>
                 </tr>
              </table>

              <h1 class="center bold uppercase" style="font-size: 16pt; margin: 20px 0 15px 0;">GIẤY RA VIỆN</h1>

              <div style="text-align: justify;">
                 <div class="content-line">Họ và tên: <span class="bold uppercase" style="font-size: 14pt;">${patient.name.toUpperCase()}</span></div>
                 <div class="content-line">Năm sinh: ${patient.dob}</div>
                 <div class="content-line">Quân hàm: ${rank}</div>
                 <div class="content-line">Chức vụ: ${role}</div>
                 <div class="content-line">Đơn vị: ${mappedUnit}</div>
                 <div class="content-line">Quê quán: ${hometown}</div>
                 <div class="content-line">Ngày vào viện: ${patient.admissionDate} – Ngày ra viện: ${formattedDischargeDate}</div>
                <div class="content-line italic">
                    Chẩn đoán: 
                    <span style="font-weight: bold; font-style: italic;">
                        ${diagnosis} đã ổn định
                    </span>
                </div>
                 
                 <div class="content-line">Thuốc điều trị:</div>
                 <div class="indent" style="margin-bottom: 5px;">
                    ${medsHtml}
                 </div>
                 
                 <div class="content-line">Tình trạng bệnh nhân lúc ra viện: ${condition}</div>
                 <div class="content-line">Ý kiến đề nghị: <span class="italic">Về đơn vị công tác.</span></div>
                 <div class="content-line">Chấp hành kỷ luật của bệnh nhân khi nằm bệnh xá: <span class="bold">${discipline}.</span></div>
              </div>

              <table class="header-table" style="width: 100%; margin-top: 5px;">
                 <tr>
                     <td style="width: 50%;"></td>
                     <td class="center italic" style="width: 50%; font-size: 14pt; padding-bottom: 5px;">
                        Ngày ${day} tháng ${month} năm ${year}
                     </td>
                 </tr>
                 <tr>
                    <td class="center bold" style="width: 50%; font-size: 14pt; font-weight: bold">
                       Y TÁ HÀNH CHÍNH
                    </td>
                    <td class="center bold" style="width: 50%; font-size: 14pt; font-weight: bold">
                       BỆNH XÁ TRƯỞNG
                    </td>
                 </tr>
              </table>
           </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `giay-ra-vien-${patient.name}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-pop-in relative" onClick={e => e.stopPropagation()}>
             <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                    <ClipboardList size={20} />
                    Thông tin ra viện
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-green-200 rounded-full transition">
                    <X size={20} className="text-green-700" />
                </button>
             </div>
             
             <div className="p-6 space-y-4 text-sm">
                
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-gray-600 text-xs font-bold mb-1">Số giấy</label>
                        <input 
                            type="text" 
                            value={paperNumber} 
                            onChange={(e) => setPaperNumber(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none" 
                        />
                    </div>
                     <div>
                        <label className="block text-gray-600 text-xs font-bold mb-1">Cấp bậc</label>
                        <input 
                            type="text" 
                            value={rank} 
                            onChange={(e) => setRank(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none" 
                        />
                    </div>
                     <div>
                        <label className="block text-gray-600 text-xs font-bold mb-1">Chức vụ</label>
                        <input 
                            type="text" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1">Quê quán</label>
                    <input 
                        type="text" 
                        value={hometown} 
                        onChange={(e) => setHometown(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none" 
                        placeholder="Nhập quê quán..."
                    />
                </div>
                
                <div>
                     <label className="block text-gray-600 text-xs font-bold mb-1">Chẩn đoán (Đã xử lý)</label>
                     <input 
                        type="text" 
                        value={diagnosis} 
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none font-semibold text-gray-700"
                     />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-600 text-xs font-bold mb-1">Ngày ra viện</label>
                        <input 
                            type="date" 
                            value={dischargeDate} 
                            onChange={(e) => setDischargeDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none"
                        />
                    </div>
                    <div>
                         <label className="block text-gray-600 text-xs font-bold mb-1">Chấp hành kỷ luật</label>
                         <input 
                            type="text" 
                            value={discipline} 
                            onChange={(e) => setDiscipline(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none"
                         />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1">Thuốc điều trị</label>
                    <textarea 
                        rows={4} 
                        value={treatments}
                        onChange={(e) => setTreatments(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none text-xs"
                    ></textarea>
                </div>
                
                <div>
                    <label className="block text-gray-600 text-xs font-bold mb-1">Tình trạng ra viện</label>
                    <textarea 
                        rows={3} 
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none text-xs"
                    ></textarea>
                </div>
                
                <button 
                    onClick={generateDischargePaper}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-green-200 transition transform active:scale-95"
                >
                    <FileText size={20} /> In Giấy Ra Viện (.doc)
                </button>
             </div>
        </div>
    </div>
  );
};

export default DischargePaperModal;
