
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Patient } from '../types';
import { User, Activity, Star } from 'lucide-react';

interface Props {
  patient: Patient;
  onClick: (p: Patient) => void;
  onDoubleClick?: (id: string) => void;
  className?: string;
}

const PatientMeeple: React.FC<Props> = ({ patient, onClick, onDoubleClick, className }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: patient.id,
    data: patient,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.1)`,
    zIndex: 100,
  } : undefined;

  const getMeepleColor = () => {
    if (patient.rank?.toLowerCase().includes('h3')) return 'bg-blue-400';
    if (patient.rank?.toLowerCase().includes('h1')) return 'bg-green-400';
    return 'bg-pink-400';
  };

  const isLongTerm = patient.isLongTerm;
  const lastName = patient.name.trim().split(' ').pop() || patient.name.charAt(0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing
        transition-all duration-200 group
        ${isDragging ? 'opacity-70 scale-105' : 'opacity-100'}
        ${className || ''} 
      `}
      onClick={() => onClick(patient)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick && onDoubleClick(patient.id);
      }}
    >
      <div className={`
        relative w-10 h-10 rounded-full ${getMeepleColor()} border-[3px] shadow-sm flex items-center justify-center z-10 transition-all
        ${isLongTerm ? 'border-yellow-400 scale-105 shadow-yellow-200 shadow-md' : 'border-white'}
      `}>
         <span className="text-[9px] font-black text-white leading-tight px-0.5 text-center break-words w-full">
            {lastName}
         </span>
         
         {isLongTerm && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full z-30 shadow-sm animate-pulse"></div>
         )}
      </div>
      
      <div className={`
        w-12 h-10 -mt-2.5 rounded-b-xl rounded-t-md ${getMeepleColor()} border-[3px] shadow-md flex items-center justify-center z-0 transition-all
        ${isLongTerm ? 'border-yellow-400' : 'border-white'}
      `}>
         {patient.role === 'kđt' ? <Star size={16} className="text-white opacity-90" /> : 
          patient.diagnosis.toLowerCase().includes('sốt') ? <Activity size={16} className="text-white opacity-90" /> :
          <User size={16} className="text-white opacity-90" />
         }
      </div>

      <div className={`
        absolute -bottom-8 px-3 py-1 rounded-lg border shadow-sm whitespace-nowrap z-20 font-bold max-w-[150px] overflow-hidden text-ellipsis
        text-[10px] transition-all tracking-tight
        ${isLongTerm 
            ? 'bg-yellow-50 text-yellow-900 border-yellow-300 scale-105' 
            : 'bg-white/95 text-gray-900 border-gray-200'}
      `}>
        {patient.name}
      </div>
    </div>
  );
};

export default PatientMeeple;
