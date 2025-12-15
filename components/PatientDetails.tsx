
import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { X, Calendar, User, Briefcase, Activity, MapPin, Trash2, Thermometer, AlertTriangle, FileText, HeartPulse, BadgeCheck } from 'lucide-react';

interface Props {
  patient: Patient | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Patient>) => void;
  onOpenDischarge: (patient: Patient) => void;
  roomName?: string;
}

const PatientDetails: React.FC<Props> = ({ patient, onClose, roomName, onDelete, onUpdate, onOpenDischarge }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setIsConfirming(false);
  }, [patient]);

  if (!patient) return null;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(patient.id, { monitoringType: e.target.value as '3h' | 'stc' | 'none' });
  };

  const handleVitalsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(patient.id, { monitorVitals: e.target.checked });
  };

  const handleEmployeeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(patient.id, { isLongTerm: e.target.checked });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-pop-in relative border-4 border-white my-8"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Header Background */}
        <div className="h-20 bg-gradient-to-r from-blue-400 to-purple-400 w-full absolute top-0 left-0 z-0"></div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/40 p-1.5 rounded-full text-white backdrop-blur-md transition"
        >
          <X size={18} />
        </button>

        <div className="relative z-0 pt-10 px-5 pb-5 flex flex-col items-center">
          {/* Avatar */}
          <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl mb-3">
            {patient.rank?.includes('h1') ? '👶' : patient.rank?.includes('h3') ? '🧑‍🎓' : '🧑‍⚕️'}
          </div>

          <h2 className="text-xl font-bold text-gray-800 text-center mb-1">{patient.name}</h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
            {patient.id.slice(0, 8)}
          </span>

          <div className="w-full space-y-3">
            <DetailRow icon={<Calendar size={18} />} label="DOB" value={patient.dob} />
            <DetailRow icon={<User size={18} />} label="Rank/Role" value={`${patient.rank || '-'} / ${patient.role || '-'}`} />
            <DetailRow icon={<Briefcase size={18} />} label="Unit" value={patient.unit} />
            <DetailRow icon={<Activity size={18} />} label="Diagnosis" value={patient.diagnosis} highlight />
            <DetailRow icon={<Calendar size={18} />} label="Admitted" value={patient.admissionDate} />
            <DetailRow icon={<MapPin size={18} />} label="Location" value={roomName || 'Unknown'} />
            
            {/* Employee Toggle - White Background */}
            <div className={`flex items-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm`}>
              <div className="mr-3 text-yellow-500">
                <BadgeCheck size={20} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Nhân viên</p>
                  <p className="text-sm text-gray-700 font-semibold">Đánh dấu nhân viên</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={patient.isLongTerm || false}
                  onChange={handleEmployeeToggle}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 cursor-pointer accent-yellow-500"
                />
              </div>
            </div>

            {/* Monitoring Type Selector - White Background */}
            <div className={`flex items-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm`}>
              <div className="mr-3 text-orange-500">
                <Thermometer size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Theo dõi nhiệt độ</p>
                <select 
                  value={patient.monitoringType || 'none'} 
                  onChange={handleTypeChange}
                  className="mt-1 block w-full bg-white border border-gray-300 text-gray-700 py-1.5 px-2 rounded-lg leading-tight focus:outline-none focus:border-blue-500 text-sm font-semibold cursor-pointer"
                >
                  <option value="stc">Sáng / Trưa / Chiều (S/T/C)</option>
                  <option value="3h">3 Giờ / Lần</option>
                  <option value="none">Không đo (Bỏ qua)</option>
                </select>
              </div>
            </div>

            {/* Monitor Vitals Toggle - White Background */}
            <div className={`flex items-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm`}>
              <div className="mr-3 text-red-500">
                <HeartPulse size={20} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Mạch & Huyết Áp</p>
                  <p className="text-sm text-gray-700 font-semibold">Theo dõi thêm</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={patient.monitorVitals || false}
                  onChange={handleVitalsToggle}
                  className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer accent-red-500"
                />
              </div>
            </div>
          </div>
          
          {/* Discharge Button */}
          <div className="w-full mt-4 pt-4 border-t border-gray-100">
             <button 
                onClick={() => { onClose(); onOpenDischarge(patient); }}
                className="w-full bg-green-50 text-green-700 hover:bg-green-100 font-bold py-3 rounded-xl border border-green-100 flex items-center justify-center gap-2 transition text-sm"
             >
                <FileText size={18} /> Tạo Giấy Ra Viện
             </button>
          </div>

          {/* Delete Section */}
          {isConfirming ? (
            <div className="mt-4 w-full p-3 bg-red-50 rounded-xl border border-red-100 animate-fade-in-up">
              <div className="flex items-center gap-2 text-red-600 mb-2 font-bold text-xs justify-center">
                 <AlertTriangle size={16} />
                 <span>Bạn chắc chắn muốn xóa?</span>
              </div>
              <div className="flex gap-2">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
                   className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition text-sm"
                 >
                   Hủy
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                   className="flex-1 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition shadow-md shadow-red-200 text-sm"
                 >
                   Xác nhận
                 </button>
              </div>
            </div>
          ) : (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsConfirming(true); }}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition border border-red-100 cursor-pointer text-sm"
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
  <div className={`flex items-center p-2 rounded-xl ${highlight ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
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
