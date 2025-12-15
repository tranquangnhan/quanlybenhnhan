
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

// Internal Trash Zone Component
const TrashZone: React.FC<{ isDragging: boolean }> = ({ isDragging }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash-zone' });
  
  return (
    <div 
      ref={setNodeRef}
      className={`
        fixed right-0 top-0 bottom-0 w-24 z-50 flex flex-col items-center justify-center
        transition-all duration-300 ease-in-out border-l-4
        ${isDragging ? 'translate-x-0' : 'translate-x-full'}
        ${isOver ? 'bg-red-100 border-red-500 shadow-[inset_10px_0_20px_rgba(255,0,0,0.2)]' : 'bg-gray-100/80 border-gray-300 backdrop-blur-sm'}
      `}
    >
       <div className={`
         transition-transform duration-200
         ${isOver ? 'scale-125 text-red-600' : 'text-gray-400'}
       `}>
          <Trash2 size={40} />
       </div>
       <span className={`mt-2 font-bold text-xs ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
          Kéo vào để xóa
       </span>
    </div>
  );
};

const App: React.FC = () => {
  // Initialize state from LocalStorage if available
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('pastel_medimap_patients');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load patients from local storage", e);
      return [];
    }
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTempSheetOpen, setIsTempSheetOpen] = useState(false);
  const [isBulkDischargeOpen, setIsBulkDischargeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // Discharge Modal State
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [dischargePatient, setDischargePatient] = useState<Patient | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    rank: '',
    date: '',
  });

  // Persist patients to LocalStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('pastel_medimap_patients', JSON.stringify(patients));
  }, [patients]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor)
  );

  // Calculate Next Paper Number
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

  // Parsing Handler
  const handleImport = async (text: string) => {
    setIsParsing(true);
    const newPatients = await parsePatientData(text);
    setPatients((prev) => [...prev, ...newPatients]);
    setIsParsing(false);
    setIsImportOpen(false);
  };

  // Delete Handler
  const handleDeletePatient = (id: string) => {
    setSelectedPatient(null);
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  // Update Handler
  const handleUpdatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selectedPatient && selectedPatient.id === id) {
      setSelectedPatient(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Specific Handler for Discharge Info
  const handleSaveDischargeInfo = (id: string, info: DischargeInfo) => {
    handleUpdatePatient(id, { dischargeInfo: info });
  };

  // Toggle Long Term Status Handler
  const handleToggleLongTerm = (id: string) => {
    setPatients((prev) => prev.map(p => 
      p.id === id ? { ...p, isLongTerm: !p.isLongTerm } : p
    ));
  };

  // Drag Handler
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      if (over.id === 'trash-zone') {
        // Handle Delete via Drop -> Instant Delete
        handleDeletePatient(active.id as string);
      } else if (active.id !== over.id) {
        // Handle Move Room
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

  // Filtering Logic
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          p.diagnosis.toLowerCase().includes(filters.search.toLowerCase());
      const matchRank = filters.rank ? p.rank.toLowerCase().includes(filters.rank.toLowerCase()) : true;
      const matchDate = filters.date ? p.admissionDate.includes(filters.date) : true;
      return matchSearch && matchRank && matchDate;
    });
  }, [patients, filters]);

  // Derived state for dragging overlay
  const activePatient = useMemo(() => patients.find(p => p.id === activeId), [activeId, patients]);

  // Derived state for room population
  const getPatientsInRoom = (roomId: string) => filteredPatients.filter(p => p.roomId === roomId);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20 overflow-x-hidden">
      
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-lg">
            <Cross size={24} fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Đại đội QY 24</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner overflow-hidden max-w-full">
           <Search size={18} className="ml-2 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search name, diagnosis..." 
             className="bg-transparent border-none outline-none text-sm w-40 md:w-64 placeholder-gray-400 text-gray-700"
             value={filters.search}
             onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
           />
           <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
           <select 
              className="bg-transparent text-xs font-semibold text-gray-600 outline-none cursor-pointer"
              onChange={(e) => setFilters(prev => ({...prev, rank: e.target.value}))}
           >
             <option value="">All Ranks</option>
             <option value="h1">H1</option>
             <option value="h2">H2</option>
             <option value="h3">H3</option>
             <option value="sq">Officers</option>
           </select>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsTempSheetOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center gap-2 transition transform active:scale-95"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">In Phiếu Theo Dõi</span>
          </button>
          
          <button 
            onClick={() => setIsBulkDischargeOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-200 flex items-center gap-2 transition transform active:scale-95"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">Xuất Giấy Ra Viện</span>
          </button>

          <button 
            onClick={() => setIsImportOpen(true)}
            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-gray-300/50 flex items-center gap-2 transition transform active:scale-95"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">Import Data</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto relative print:hidden">
        <RoamingPet />
        
        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          {/* Trash Zone */}
          <TrashZone isDragging={!!activeId} />

          {/* Waiting Area */}
           <div className="mb-4">
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'waiting')!} 
                patients={getPatientsInRoom('waiting')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
              />
           </div>

          {/* Map Layout - Flex Row */}
          <div className="flex flex-wrap items-start justify-start gap-3">
            
            <div className="w-full md:w-44 flex flex-col gap-3">
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

            <div className="w-full md:w-44">
               <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'bn3')!} 
                patients={getPatientsInRoom('bn3')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[300px]" 
              />
            </div>
            <div className="w-full md:w-44">
               <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'bn2')!} 
                patients={getPatientsInRoom('bn2')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[300px]"
              />
            </div>
            <div className="w-full md:w-44">
               <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'bn1')!} 
                patients={getPatientsInRoom('bn1')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[300px]"
              />
            </div>

            <div className="w-full md:w-44 flex flex-col gap-3">
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

            <div className="w-full md:w-44 ml-12 flex flex-col gap-3">
              <RoomZone 
                room={INITIAL_ROOMS.find(r => r.id === 'post_op')!} 
                patients={getPatientsInRoom('post_op')} 
                onPatientClick={setSelectedPatient}
                onPatientDoubleClick={handleToggleLongTerm}
                className="min-h-[144px]"
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
              <PatientMeeple patient={activePatient} onClick={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modals */}
      <Importer 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport} 
        isParsing={isParsing}
      />

      <PatientDetails 
        patient={selectedPatient} 
        onClose={() => setSelectedPatient(null)} 
        onDelete={handleDeletePatient}
        onUpdate={handleUpdatePatient}
        roomName={INITIAL_ROOMS.find(r => r.id === selectedPatient?.roomId)?.name}
        onOpenDischarge={(p) => {
            setDischargePatient(p);
            setIsDischargeOpen(true);
        }}
      />
      
      <DischargePaperModal 
        patient={dischargePatient}
        isOpen={isDischargeOpen}
        onClose={() => setIsDischargeOpen(false)}
        onSave={handleSaveDischargeInfo}
        nextPaperNumber={nextPaperNumber}
      />

      <BulkDischargeModal 
        patients={patients}
        isOpen={isBulkDischargeOpen}
        onClose={() => setIsBulkDischargeOpen(false)}
        onSave={handleSaveDischargeInfo}
      />

      {isTempSheetOpen && (
        <TemperatureSheet 
          patients={patients} 
          onClose={() => setIsTempSheetOpen(false)} 
        />
      )}

    </div>
  );
};

export default App;