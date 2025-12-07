
import React, { useState, useEffect, useCallback } from 'react';
import { Patient } from '../types';
import { X, Calendar, User, Briefcase, Activity, MapPin, Trash2, Thermometer, AlertTriangle, FileText, ClipboardList } from 'lucide-react';

interface Props {
  patient: Patient | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Patient>) => void;
  roomName?: string;
}

const PatientDetails: React.FC<Props> = ({ patient, onClose, roomName, onDelete, onUpdate }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [hometown, setHometown] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [treatments, setTreatments] = useState('');
  const [condition, setCondition] = useState('');

  // Reset state when patient changes
  useEffect(() => {
    setIsConfirming(false);
    if (patient) {
        // Defaults
        setHometown('');
        setDischargeDate(new Date().toISOString().split('T')[0]); // Today
        
        // Auto-fill logic based on diagnosis
        const d = patient.diagnosis.toLowerCase();
        
        // Treatments
        if (d.includes('sốt')) {
            setTreatments("- Kháng sinh\n- Giảm ho\n- Giảm đau, hạ sốt\n- Kháng histamin\n- Sinh tố");
        } else {
            setTreatments("- Kháng sinh\n- Giảm đau, hạ sốt\n- Sinh tố");
        }

        // Condition
        if ((d.includes('viêm họng') || d.includes('họng')) && d.includes('sốt')) {
            setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết sổ mũi, hết đau họng, ăn ngủ sinh hoạt bình thường.");
        } else if (d.includes('amydal') || d.includes('amidan')) {
            setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết đau đầu, hết đau họng, amydal hết sưng đau, ăn ngủ sinh hoạt bình thường.");
        } else {
            setCondition("Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, ăn ngủ sinh hoạt bình thường.");
        }
    }
  }, [patient]);

  if (!patient) return null;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(patient.id, { monitoringType: e.target.value as '3h' | 'stc' | 'none' });
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

  const mapUnit = (u: string) => {
     let mapped = u || '';
     mapped = mapped.replace(/c(\d+)/gi, 'Đại đội $1');
     mapped = mapped.replace(/d(\d+)/gi, 'Tiểu đoàn $1');
     mapped = mapped.replace(/-/g, ' - ');
     return mapped;
  };

  const generateDischargePaper = useCallback(() => {
      if (!patient) return;

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
      
      const mappedRank = mapRank(patient.rank);
      const mappedUnit = mapUnit(patient.unit);

      // A5 dimensions: 148mm x 210mm (~420pt x 595pt)
      // Optimized for 14pt font size
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
           <meta charset="utf-8">
           <title>Giấy Ra Viện</title>
           <style>
             /* Page Setup: A5 Portrait */
             @page Section1 { size: 419.55pt 595.3pt; margin: 1.27cm 1.0cm 1.27cm 2.0cm; }
             div.Section1 { page: Section1; }
             
             /* Global Font Settings - Updated to 14pt */
             body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.2; }
             
             .header-table td { border: none; padding: 0; vertical-align: top; }
             .center { text-align: center; }
             .bold { font-weight: bold; }
             .italic { font-style: italic; }
             .uppercase { text-transform: uppercase; }
             .indent { margin-left: 20px; }
             .underline { text-decoration: underline; }
             .content-line { margin-bottom: 6px; }
             
             /* Tight header styling for zero spacing */
             .tight-header div { margin: 0; padding: 0; line-height: 1.2; }
           </style>
        </head>
        <body>
           <div class="Section1">
              <table class="header-table" style="width: 100%; margin-bottom: 10px;">
                 <tr>
                    <td class="center tight-header" style="width: 45%;">
                       <div class="uppercase" style="font-size: 12pt;">TRUNG ĐOÀN 66</div>
                       <div class="bold underline uppercase" style="font-size: 12pt;">ĐẠI ĐỘI 24</div>
                       <div class="italic" style="font-size: 12pt;">Số: 02</div>
                    </td>
                    <td class="center tight-header" style="width: 55%;">
                       <div class="bold uppercase" style="font-size: 12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                       <div class="bold underline" style="font-size: 13pt;">Độc lập – Tự do – Hạnh phúc</div>
                    </td>
                 </tr>
              </table>

              <h1 class="center bold uppercase" style="font-size: 16pt; margin: 20px 0 20px 0;">GIẤY RA VIỆN</h1>

              <div style="text-align: justify;">
                 <div class="content-line">Họ và tên: <span class="bold uppercase" style="font-size: 14pt;">${patient.name}</span></div>
                 <div class="content-line">Năm sinh: ${patient.dob}</div>
                 <div class="content-line">Quân hàm: ${mappedRank} <span style="margin-left: 30px;">Chức vụ: ${patient.role}</span></div>
                 <div class="content-line">Đơn vị: ${mappedUnit}</div>
                 <div class="content-line">Quê quán: ${hometown}</div>
                 <div class="content-line">Ngày vào viện: ${patient.admissionDate} – Ngày ra viện: ${formattedDischargeDate}</div>
                 <div class="content-line">Chẩn đoán: <span class="italic">${patient.diagnosis} đã ổn định</span></div>
                 
                 <div class="content-line">Thuốc điều trị:</div>
                 <div class="indent" style="margin-bottom: 5px;">
                    ${medsHtml}
                 </div>
                 
                 <div class="content-line">Tình trạng bệnh nhân lúc ra viện: ${condition}</div>
                 <div class="content-line">Ý kiến đề nghị: <span class="italic">Về đơn vị công tác.</span></div>
                 <div class="content-line">Chấp hành kỷ luật của bệnh nhân khi nằm bệnh xá: <span class="bold">Tốt.</span></div>
              </div>

              <table class="header-table" style="width: 100%; margin-top: 20px;">
                 <tr>
                    <td class="center bold" style="width: 50%; font-size: 13pt;">
                       Y TÁ HÀNH CHÍNH
                    </td>
                    <td class="center bold" style="width: 50%; font-size: 13pt;">
                       <div class="italic" style="font-weight: normal; margin-bottom: 3px; font-size: 13pt;">Ngày ${day} tháng ${month} năm ${year}</div>
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
  }, [patient, dischargeDate, hometown, treatments, condition]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-pop-in relative border-4 border-white my-8"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Header Background */}
        <div className="h-24 bg-gradient-to-r from-blue-400 to-purple-400 w-full absolute top-0 left-0 z-0"></div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-md transition"
        >
          <X size={20} />
        </button>

        <div className="relative z-0 pt-12 px-6 pb-6 flex flex-col items-center">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl mb-4">
            {patient.rank?.includes('h1') ? '👶' : patient.rank?.includes('h3') ? '🧑‍🎓' : '🧑‍⚕️'}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">{patient.name}</h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            {patient.id.slice(0, 8)}
          </span>

          <div className="w-full space-y-3">
            <DetailRow icon={<Calendar size={18} />} label="DOB" value={patient.dob} />
            <DetailRow icon={<User size={18} />} label="Rank/Role" value={`${patient.rank || '-'} / ${patient.role || '-'}`} />
            <DetailRow icon={<Briefcase size={18} />} label="Unit" value={patient.unit} />
            <DetailRow icon={<Activity size={18} />} label="Diagnosis" value={patient.diagnosis} highlight />
            <DetailRow icon={<Calendar size={18} />} label="Admitted" value={patient.admissionDate} />
            <DetailRow icon={<MapPin size={18} />} label="Location" value={roomName || 'Unknown'} />
            
            {/* Monitoring Type Selector */}
            <div className={`flex items-center p-3 rounded-xl bg-orange-50 border border-orange-100`}>
              <div className="mr-3 text-orange-500">
                <Thermometer size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Theo dõi nhiệt độ</p>
                <select 
                  value={patient.monitoringType || 'none'} 
                  onChange={handleTypeChange}
                  className="mt-1 block w-full bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded leading-tight focus:outline-none focus:border-blue-500 text-sm font-semibold cursor-pointer"
                >
                  <option value="stc">Sáng / Trưa / Chiều (S/T/C)</option>
                  <option value="3h">3 Giờ / Lần</option>
                  <option value="none">Không đo (Bỏ qua)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Discharge Paper Section */}
          <div className="w-full mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <ClipboardList className="text-blue-500" size={20} />
                Thông tin ra viện
            </h3>
            
            <div className="space-y-3 text-sm">
                <div>
                    <label className="block text-gray-500 text-xs font-bold mb-1">Quê quán</label>
                    <input 
                        type="text" 
                        value={hometown} 
                        onChange={(e) => setHometown(e.target.value)}
                        className="w-full border rounded p-2 bg-gray-50 focus:border-blue-400 outline-none" 
                        placeholder="Nhập quê quán..."
                    />
                </div>
                <div>
                    <label className="block text-gray-500 text-xs font-bold mb-1">Ngày ra viện</label>
                    <input 
                        type="date" 
                        value={dischargeDate} 
                        onChange={(e) => setDischargeDate(e.target.value)}
                        className="w-full border rounded p-2 bg-gray-50 focus:border-blue-400 outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-gray-500 text-xs font-bold mb-1">Thuốc điều trị</label>
                    <textarea 
                        rows={3}
                        value={treatments} 
                        onChange={(e) => setTreatments(e.target.value)}
                        className="w-full border rounded p-2 bg-gray-50 focus:border-blue-400 outline-none text-xs font-mono" 
                    />
                </div>
                <div>
                    <label className="block text-gray-500 text-xs font-bold mb-1">Tình trạng ra viện</label>
                    <textarea 
                        rows={3}
                        value={condition} 
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full border rounded p-2 bg-gray-50 focus:border-blue-400 outline-none text-xs" 
                    />
                </div>
                
                <button 
                    onClick={generateDischargePaper}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 mt-2 shadow-md shadow-green-200 transition"
                >
                    <FileText size={18} /> In Giấy Ra Viện (.doc) - Khổ A5
                </button>
            </div>
          </div>

          {/* Delete Section */}
          {isConfirming ? (
            <div className="mt-6 w-full p-4 bg-red-50 rounded-xl border border-red-100 animate-fade-in-up">
              <div className="flex items-center gap-2 text-red-600 mb-3 font-bold text-sm justify-center">
                 <AlertTriangle size={16} />
                 <span>Bạn chắc chắn muốn xóa?</span>
              </div>
              <div className="flex gap-3">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
                   className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition"
                 >
                   Hủy
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                   className="flex-1 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition shadow-md shadow-red-200"
                 >
                   Xác nhận
                 </button>
              </div>
            </div>
          ) : (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsConfirming(true); }}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition border border-red-100 cursor-pointer"
            >
              <Trash2 size={18} />
              Xóa Bệnh Nhân
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ icon: React.ReactNode, label: string, value: string, highlight?: boolean }> = ({ icon, label, value, highlight }) => (
  <div className={`flex items-center p-3 rounded-xl ${highlight ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
    <div className={`mr-3 ${highlight ? 'text-red-500' : 'text-gray-400'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-red-700' : 'text-gray-700'}`}>{value || 'N/A'}</p>
    </div>
  </div>
);

export default PatientDetails;
