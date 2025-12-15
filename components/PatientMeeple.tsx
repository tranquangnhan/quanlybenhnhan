
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
    zIndex: 50,
  } : undefined;

  // Determine meeple color based on role or rank for visual variety
  const getMeepleColor = () => {
    if (patient.rank?.toLowerCase().includes('h3')) return 'bg-blue-400';
    if (patient.rank?.toLowerCase().includes('h1')) return 'bg-green-400';
    return 'bg-pink-400';
  };

  const isLongTerm = patient.isLongTerm;
  
  // Get last word of name for the head circle (e.g., "Nguyễn Văn A" -> "A")
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
        ${isDragging ? 'opacity-90' : 'opacity-100'}
        ${className || 'mb-4'} 
      `}
      onClick={() => onClick(patient)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick && onDoubleClick(patient.id);
      }}
    >
      {/* Meeple Head */}
      <div className={`
        relative w-9 h-9 rounded-full ${getMeepleColor()} border-[3px] shadow-sm flex items-center justify-center z-10 transition-colors
        ${isLongTerm ? 'border-yellow-400' : 'border-white'}
      `}>
         <span className="text-[8px] font-extrabold text-white leading-tight px-0.5 text-center break-words w-full">
            {lastName}
         </span>
         
         {/* Red Dot for Employee/LongTerm */}
         {isLongTerm && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full z-30 shadow-sm animate-pop-in"></div>
         )}
      </div>
      
      {/* Meeple Body */}
      <div className={`
        w-11 h-9 -mt-2 rounded-b-xl rounded-t-md ${getMeepleColor()} border-[3px] shadow-md flex items-center justify-center z-0 transition-colors
        ${isLongTerm ? 'border-yellow-400' : 'border-white'}
      `}>
         {/* Tiny icon based on diagnosis severity or role */}
         {patient.role === 'kđt' ? <Star size={14} className="text-white opacity-90" /> : 
          patient.diagnosis.toLowerCase().includes('sốt') ? <Activity size={14} className="text-white opacity-90" /> :
          <User size={14} className="text-white opacity-90" />
         }
      </div>

      {/* Name Label */}
      <div className={`
        absolute -bottom-7 px-2 py-1 rounded-md border-2 shadow-sm whitespace-nowrap z-20 font-extrabold max-w-[140px] overflow-hidden text-ellipsis
        text-xs transition-colors
        ${isLongTerm 
            ? 'bg-yellow-50 text-yellow-800 border-yellow-400 shadow-yellow-100' 
            : 'bg-white text-gray-900 border-gray-300'}
      `}>
        {patient.name}
      </div>
    </div>
  );
};

export default PatientMeeple;