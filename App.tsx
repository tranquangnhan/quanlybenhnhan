
import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, useDroppable } from '@dnd-kit/core';
import { Filter, Upload, Search, Printer, Trash2, AlertTriangle, X, FileText, Cross } from 'lucide-react';
import { Patient, FilterState, RoomData, DischargeInfo } from './types';
import { INITIAL_ROOMS } from './constants';
import { parsePatientData } from './services/geminiService';
import RoomZone from './components/RoomZone';
import Importer from './components/Importer';
import PatientDetails from './components/PatientDetails';
import PatientMeeple from './components/PatientMeeple';
import RoamingPet from './components/RoamingPet';
import DischargePaperModal from './components/DischargePaperModal';
import BulkDischargeModal from './components/BulkDischargeModal';
import TemperatureSheet from './components/TemperatureSheet';

const TrashZone: React.FC<{ isDragging: boolean }> = ({ isDragging }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash-zone' });
  
  return (
    <div 
      ref={setNodeRef}
      className={`
        fixed right-0 top-0 bottom-0 w-28 z-50 flex flex-col items-center justify-center
        transition-all duration-300 ease-in-out border-l-4
        ${isDragging ? 'translate-x-0' : 'translate-x-full'}
        ${isOver ? 'bg-red-50 border-red-500 shadow-[inset_10px_0_20px_rgba(255,0,0,0.1)]' : 'bg-gray-100/80 border-gray-200 backdrop-blur-sm'}
      `}
    >
       <div className={`
         transition-transform duration-200
         ${isOver ? 'scale-125 text-red-600' : 'text-gray-400'}
       `}>
          <Trash2 size={40} />
       </div>
       <span className={`mt-3 font-bold text-xs ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
          THẢ ĐỂ XÓA
       </span>
    </div>
  );
};

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('pastel_medimap_patients');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load patients", e);
      return [];
    }
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTempSheetOpen, setIsTempSheetOpen] = useState(false);
  const [isBulkDischargeOpen, setIsBulkDischargeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [dischargePatient, setDischargePatient] = useState<Patient | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    rank: '',
    date: '',
  });

  useEffect(() => {
    localStorage.setItem('pastel_medimap_patients', JSON.stringify(patients));
  }, [patients]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor)
  );

  const nextPaperNumber = useMemo(() => {
    let maxNum = 0;
    patients.forEach(p => {
      if (p.dischargeInfo?.paperNumber) {
        const num = parseInt(p.dischargeInfo.paperNumber, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return (maxNum + 1).toString().padStart(2, '0');
  }, [patients]);

  const handleImport = async (text: string) => {
    setIsParsing(true);
    const parsedPatients = await parsePatientData(text);

    // 1. Lọc bỏ các bản ghi thiếu thông tin bắt buộc (STT, CB, CV, ĐV)
    // Vì trường STT không lưu trong object Patient, ta kiểm tra các trường Rank(CB), Role(CV), Unit(ĐV)
    const validStructurePatients = parsedPatients.filter(p => {
        const hasRank = p.rank && p.rank.trim() !== '';
        const hasRole = p.role && p.role.trim() !== '';
        const hasUnit = p.unit && p.unit.trim() !== '';
        return hasRank && hasRole && hasUnit;
    });

    // 2. Lọc bỏ các bản ghi trùng lặp
    // Tạo chữ ký (signature) cho các bệnh nhân hiện có: Tên + Đơn vị + Năm sinh
    const existingSignatures = new Set(patients.map(p => 
        `${p.name?.toLowerCase().trim()}|${p.unit?.toLowerCase().trim()}|${p.dob?.trim()}`
    ));

    const newUniquePatients = validStructurePatients.filter(p => {
        const signature = `${p.name?.toLowerCase().trim()}|${p.unit?.toLowerCase().trim()}|${p.dob?.trim()}`;
        return !existingSignatures.has(signature);
    });
    
    // Tính toán số lượng bị lọc
    const duplicatesCount = validStructurePatients.length - newUniquePatients.length;
    const invalidCount = parsedPatients.length - validStructurePatients.length;

    if (newUniquePatients.length > 0) {
        setPatients((prev) => [...prev, ...newUniquePatients]);
        alert(
            `Đã nhập thành công: ${newUniquePatients.length} BN.\n` + 
            `- Trùng lặp (đã bỏ qua): ${duplicatesCount}\n` + 
            `- Thiếu thông tin CB/CV/ĐV (đã bỏ qua): ${invalidCount}`
        );
    } else {
        alert(
            `Không có bệnh nhân mới nào được nhập.\n` + 
            `- Trùng lặp: ${duplicatesCount}\n` + 
            `- Thiếu thông tin: ${invalidCount}`
        );
    }

    setIsParsing(false);
    setIsImportOpen(false);
  };

  const handleDeletePatient = (id: string) => {
    setSelectedPatient(null);
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selectedPatient && selectedPatient.id === id) {
      setSelectedPatient(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleSaveDischargeInfo = (id: string, info: DischargeInfo) => {
    handleUpdatePatient(id, { dischargeInfo: info });
  };

  const handleToggleLongTerm = (id: string) => {
    setPatients((prev) => prev.map(p => 
      p.id === id ? { ...p, isLongTerm: !p.isLongTerm } : p
    ));
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      if (over.id === 'trash-zone') {
        handleDeletePatient(active.id as string);
      } else if (active.id !== over.id) {
        setPatients((items) =>
          items.map((p) => {
            if (p.id === active.id) {
              return { ...p, roomId: over.id as string };
            }
            return p;
          })
        );
      }
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          p.diagnosis.toLowerCase().includes(filters.search.toLowerCase());
      const matchRank = filters.rank ? p.rank.toLowerCase().includes(filters.rank.toLowerCase()) : true;
      const matchDate = filters.date ? p.admissionDate.includes(filters.date) : true;
      return matchSearch && matchRank && matchDate;
    });
  }, [patients, filters]);

  const activePatient = useMemo(() => patients.find(p => p.id === activeId), [activeId, patients]);
  const getPatientsInRoom = (roomId: string) => filteredPatients.filter(p => p.roomId === roomId);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20 overflow-x-hidden">
      
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 px-8 py-5 flex flex-wrap items-center justify-between gap-6 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg flex items-center justify-center border border-white/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                <div className="bg-white p-1.5 rounded-full shadow-sm">
                     <Cross size={20} className="text-red-600" strokeWidth={3} />
                </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none uppercase">Đại đội QY 24</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Quân Y Việt Nam</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner max-w-full">
           <Search size={20} className="ml-2 text-gray-400" />
           <input 
             type="text" 
             placeholder="Tìm tên, chẩn đoán..." 
             className="bg-transparent border-none outline-none text-sm font-semibold w-40 md:w-64 placeholder-gray-400 text-gray-800"
             value={filters.search}
             onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
           />
           <div className="h-5 w-[1px] bg-gray-300 mx-1"></div>
           <select 
              className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer px-1"
              onChange={(e) => setFilters(prev => ({...prev, rank: e.target.value}))}
           >
             <option value="">Cấp Bậc</option>
             <option value="h1">H1</option>
             <option value="h2">H2</option>
             <option value="h3">H3</option>
             <option value="sq">Sĩ Quan</option>
           </select>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsTempSheetOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-blue-100 flex items-center gap-2 transition transform active:scale-95 text-xs"
          >
            <Printer size={18} /> IN PHIẾU
          </button>
          
          <button 
            onClick={() => setIsBulkDischargeOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-green-100 flex items-center gap-2 transition transform active:scale-95 text-xs"
          >
            <FileText size={18} /> XUẤT GIẤY RV
          </button>

          <button 
            onClick={() => setIsImportOpen(true)}
            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-gray-300 flex items-center gap-2 transition transform active:scale-95 text-xs"
          >
            <Upload size={18} /> NHẬP DATA
          </button>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-[1400px] mx-auto relative print:hidden">
        <RoamingPet />
        
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <TrashZone isDragging={!!activeId} />

           <div className="mb-10">
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'waiting')!} 
                patients={getPatientsInRoom('waiting')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
              />
           </div>

          <div className="flex flex-wrap items-start justify-center gap-6">
            <div className="w-full md:w-64 flex flex-col gap-6">
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'isolation')!} 
                patients={getPatientsInRoom('isolation')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
              />
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'ke_bn3')!} 
                patients={getPatientsInRoom('ke_bn3')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
              />
            </div>

            <div className="w-full md:w-64">
               <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'bn3')!} 
                patients={getPatientsInRoom('bn3')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[400px]" 
              />
            </div>
            <div className="w-full md:w-64">
               <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'bn2')!} 
                patients={getPatientsInRoom('bn2')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[400px]"
              />
            </div>
            <div className="w-full md:w-64">
               <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'bn1')!} 
                patients={getPatientsInRoom('bn1')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[400px]"
              />
            </div>

            <div className="w-full md:w-64 flex flex-col gap-6">
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'officer')!} 
                patients={getPatientsInRoom('officer')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
              />
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'injection')!} 
                patients={getPatientsInRoom('injection')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
              />
            </div>

            <div className="w-full md:w-64 flex flex-col gap-6">
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'post_op')!} 
                patients={getPatientsInRoom('post_op')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[180px]"
              />
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'emergency')!} 
                patients={getPatientsInRoom('emergency')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
              />
            </div>

          </div>

          <DragOverlay>
            {activePatient ? (
              <PatientMeeple patient={activePatient} onClick={() => {}} className="scale-110" />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <Importer isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImport} isParsing={isParsing} />
      <PatientDetails 
        patient={selectedPatient} onClose={() => setSelectedPatient(null)} 
        onDelete={handleDeletePatient} onUpdate={handleUpdatePatient}
        roomName={INITIAL_ROOMS.find(r => r.id === selectedPatient?.roomId)?.name}
        onOpenDischarge={(p) => { setDischargePatient(p); setIsDischargeOpen(true); }}
      />
      <DischargePaperModal 
        patient={dischargePatient} isOpen={isDischargeOpen} onClose={() => setIsDischargeOpen(false)}
        onSave={handleSaveDischargeInfo} nextPaperNumber={nextPaperNumber}
      />
      <BulkDischargeModal patients={patients} isOpen={isBulkDischargeOpen} onClose={() => setIsBulkDischargeOpen(false)} onSave={handleSaveDischargeInfo} />
      {isTempSheetOpen && <TemperatureSheet patients={patients} onClose={() => setIsTempSheetOpen(false)} />}
    </div>
  );
};

export default App;
