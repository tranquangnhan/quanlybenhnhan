
import React, { useState, useEffect } from 'react';
import { DischargeInfo, Patient } from '../types';
import { X, FileText, ClipboardList, Save, Sparkles, Loader2 } from 'lucide-react';
import { generateDischargeCondition } from '../services/geminiService';

interface Props {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, info: DischargeInfo) => void;
  nextPaperNumber: string;
}

const DischargePaperModal: React.FC<Props> = ({ patient, isOpen, onClose, onSave, nextPaperNumber }) => {
  const [hometown, setHometown] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [treatments, setTreatments] = useState('');
  const [condition, setCondition] = useState('');
  const [discipline, setDiscipline] = useState('Tốt');
  const [paperNumber, setPaperNumber] = useState('');
  const [role, setRole] = useState('');
  const [rank, setRank] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const cleanDiagnosis = (d: string) => {
    if (!d) return "";
    let cleaned = d;
    cleaned = cleaned.replace(/^Sốt[,]?\s+/i, '');
    cleaned = cleaned.replace(/\s*N\d+$/i, '');
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned.trim();
  };

  const mapRank = (r: string) => {
    const lower = (r || '').toLowerCase();
    // Officers (Tá) - Check double slashes first
    if (lower.includes('4//')) return 'Đại tá';
    if (lower.includes('3//')) return 'Thượng tá';
    if (lower.includes('2//')) return 'Trung tá';
    if (lower.includes('1//')) return 'Thiếu tá';
    
    // Officers (Úy)
    if (lower.includes('4/')) return 'Đại úy';
    if (lower.includes('3/')) return 'Thượng úy';
    if (lower.includes('2/')) return 'Trung úy';
    if (lower.includes('1/')) return 'Thiếu úy';

    // NCOs & Enlisted
    if (lower.includes('h3')) return 'Thượng sĩ';
    if (lower.includes('h2')) return 'Trung sĩ';
    if (lower.includes('h1')) return 'Hạ sĩ';
    if (lower.includes('b1')) return 'Binh nhất';
    if (lower.includes('b2')) return 'Binh nhì';
    
    return r;
  };

  const mapRole = (r: string) => {
    const lower = (r || '').toLowerCase().trim();
    const roleMap: Record<string, string> = {
        'cs': 'Chiến sĩ',
        'at': 'Tiểu đội trưởng',
        'kđt': 'Khẩu đội trưởng',
        'ctv': 'Chính trị viên',
        'ctvp': 'Chính trị viên phó',
        'ct': 'Đại đội trưởng',
        'pct': 'Phó đại đội trưởng',
        'tx': 'Trưởng xe',
        'tlqc': 'Trợ lý quần chúng',
        'nvcntt': 'Nhân viên CNTT',
        'nvtk': 'Nhân viên thống kê',
        'tltc': 'Trợ lý tác chiến',
        'pcnct': 'Phó chủ nhiệm chính trị',
        'nvna': 'Nhân viên nấu ăn',
        'nđ': 'Nạp đạn',
        'pt': 'Pháo thủ',
        'csm': 'Chiến sĩ mới',
        'lxe': 'Lái xe',
        'tsc': 'Thợ sửa chữa',
        'dt': 'Tiểu đoàn trưởng',
        'pdt': 'Tiểu đoàn phó',
        'nvql': 'Nhân viên quản lý',
        'bt': 'Trung đội trưởng',
        'tlhc': 'Trợ lý hậu cần',
        'tlbvệ': 'Trợ lý bảo vệ',
        'nvqn': 'Nhân viên quân nhu',
        'tlth': 'Trợ lý tuyên huấn',
        'nv cơ yếu': 'Nhân viên cơ yếu'
    };
    return roleMap[lower] || r;
  };

  useEffect(() => {
    if (patient && isOpen) {
        if (patient.dischargeInfo) {
            setPaperNumber(patient.dischargeInfo.paperNumber);
            setHometown(patient.dischargeInfo.hometown);
            setDischargeDate(patient.dischargeInfo.dischargeDate);
            setTreatments(patient.dischargeInfo.meds);
            setCondition(patient.dischargeInfo.condition);
            setRank(patient.dischargeInfo.rank);
            setRole(patient.dischargeInfo.role);
            setDiagnosis(patient.dischargeInfo.diagnosis);
            setDiscipline(patient.dischargeInfo.discipline);
        } else {
            setPaperNumber(nextPaperNumber);
            setHometown('');
            setDischargeDate(new Date().toISOString().split('T')[0]);
            setDiscipline('Tốt');
            setRank(mapRank(patient.rank));
            setRole(mapRole(patient.role));
            
            setDiagnosis(cleanDiagnosis(patient.diagnosis));
            const d = (patient.diagnosis || '').toLowerCase();
            if (d.includes('sốt')) {
                setTreatments("- Kháng sinh\n- Giảm ho\n- Giảm đau, hạ sốt\n- Kháng histamin\n- Sinh tố");
            } else {
                setTreatments("- Kháng sinh\n- Giảm đau, hạ sốt\n- Sinh tố");
            }
            
            // Default condition template
            if ((d.includes('viêm họng') || d.includes('họng')) && d.includes('sốt')) {
                setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết sổ mũi, hết đau họng, ăn ngủ sinh hoạt bình thường.");
            } else if (d.includes('amydal') || d.includes('amidan')) {
                setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết đau đầu, hết đau họng, amydal hết sưng đau, ăn ngủ sinh hoạt bình thường.");
            } else {
                setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, ăn ngủ sinh hoạt bình thường.");
            }
        }
    }
  }, [patient, isOpen, nextPaperNumber]);

  const handleAIGenerateCondition = async () => {
    if (!diagnosis) return;
    setIsGenerating(true);
    const aiResult = await generateDischargeCondition(diagnosis);
    if (aiResult) {
      // Wrap AI result with fixed template requested by user
      const finalCondition = `Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, ${aiResult}, ăn ngủ sinh hoạt bình thường.`;
      setCondition(finalCondition);
    }
    setIsGenerating(false);
  };

  if (!isOpen || !patient) return null;

  const saveData = () => {
    const info: DischargeInfo = { paperNumber, hometown, dischargeDate, meds: treatments, condition, rank, role, diagnosis, discipline };
    onSave(patient.id, info);
    return info;
  };

  const generateDischargePaper = () => {
      saveData();
      const today = new Date();
      // Format signature date with leading zeros
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      
      const dD = new Date(dischargeDate);
      const formattedRV = `${dD.getDate().toString().padStart(2,'0')}/${(dD.getMonth()+1).toString().padStart(2,'0')}/${dD.getFullYear()}`;
      const medsHtml = treatments.split('\n').map(line => `<div style="margin-bottom: 2px;">${line}</div>`).join('');
      const mappedUnit = (patient.unit || '').replace(/c(\d+)/gi, 'Đại đội $1').replace(/d(\d+)/gi, 'Tiểu đoàn $1').replace(/-/g, ' - ');
      
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
                 <div class="content-line">Ngày vào viện: ${patient.admissionDate} – Ngày ra viện: ${formattedRV}</div>
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
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `giay-ra-vien-${patient.name}.doc`;
      link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-pop-in relative border-4 border-white" onClick={e => e.stopPropagation()}>
             <div className="bg-green-50 p-6 border-b border-green-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-green-900 flex items-center gap-3">
                    <ClipboardList size={28} />
                    GIẤY RA VIỆN CHI TIẾT
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-full transition">
                    <X size={24} className="text-green-700" />
                </button>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Số giấy</label>
                        <input type="text" value={paperNumber} onChange={(e) => setPaperNumber(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-400 outline-none text-center font-bold text-red-600 text-2xl bg-gray-50" 
                        />
                    </div>
                     <div>
                        <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Cấp bậc</label>
                        <input type="text" value={rank} onChange={(e) => setRank(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-400 outline-none text-lg font-bold bg-gray-50" 
                        />
                    </div>
                     <div>
                        <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Chức vụ</label>
                        <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-400 outline-none text-lg font-bold bg-gray-50" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Quê quán</label>
                    <input type="text" value={hometown} onChange={(e) => setHometown(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-green-400 outline-none text-lg font-bold bg-gray-50" 
                        placeholder="Thành phố, Tỉnh..."
                    />
                </div>
                
                <div>
                     <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Chẩn đoán (Sau điều trị)</label>
                     <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-green-400 outline-none font-bold text-gray-800 text-lg bg-gray-50"
                     />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Ngày ra viện</label>
                        <input type="date" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)}
                            className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-green-400 outline-none text-lg font-bold bg-gray-50"
                        />
                    </div>
                    <div>
                         <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Kỷ luật</label>
                         <input type="text" value={discipline} onChange={(e) => setDiscipline(e.target.value)}
                            className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-green-400 outline-none text-lg font-bold bg-gray-50"
                         />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">Thuốc điều trị</label>
                        <textarea rows={5} value={treatments} onChange={(e) => setTreatments(e.target.value)}
                            className="w-full border-2 border-gray-100 rounded-xl p-4 focus:border-green-400 outline-none text-lg font-medium bg-gray-50 leading-relaxed"
                        ></textarea>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-gray-600 text-sm font-bold uppercase tracking-wide">Tình trạng ra viện</label>
                            <button 
                                onClick={handleAIGenerateCondition}
                                disabled={isGenerating}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all
                                    ${isGenerating 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 border border-blue-100 shadow-sm'
                                    }`}
                            >
                                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                {isGenerating ? 'Đang tạo...' : 'AI Gợi ý'}
                            </button>
                        </div>
                        <textarea rows={5} value={condition} onChange={(e) => setCondition(e.target.value)}
                            className={`w-full border-2 border-gray-100 rounded-xl p-4 focus:border-green-400 outline-none text-lg font-medium bg-gray-50 leading-relaxed transition-all
                                ${isGenerating ? 'opacity-50 animate-pulse' : 'opacity-100'}`}
                        ></textarea>
                    </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                    <button onClick={() => { saveData(); onClose(); }}
                        className="flex-1 bg-white hover:bg-gray-50 text-green-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 border-2 border-green-200 shadow-sm transition transform active:scale-95 text-base uppercase tracking-wider"
                    >
                        <Save size={20} /> Lưu Lại
                    </button>
                    <button onClick={generateDischargePaper}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition transform active:scale-95 text-base uppercase tracking-wider"
                    >
                        <FileText size={20} /> Tải (.doc)
                    </button>
                </div>
             </div>
        </div>
    </div>
  );
};

export default DischargePaperModal;
