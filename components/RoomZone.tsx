import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { RoomData, Patient, RoomType } from '../types';
import { ROOM_COLORS } from '../constants';
import PatientMeeple from './PatientMeeple';

interface Props {
  room: RoomData;
  patients: Patient[];
  onPatientClick: (p: Patient) => void;
  onPatientDoubleClick?: (id: string) => void;
  className?: string;
}

const RoomZone: React.FC<Props> = ({ room, patients, onPatientClick, onPatientDoubleClick, className }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: room.id,
    data: room,
  });

  // Handle custom room color for Ke BN3 explicitly if not in enum
  const colors = ROOM_COLORS[room.id] || ROOM_COLORS[room.type];
  const isWaitingRoom = room.type === RoomType.WAITING;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative rounded-2xl border-2 transition-all duration-300 shadow-sm group/room
        ${colors.bg} ${colors.border}
        ${isOver ? 'ring-2 ring-blue-300 scale-[1.02] shadow-lg' : ''}
        ${isWaitingRoom 
            ? 'flex flex-row items-center px-4 py-2 min-h-[60px] h-auto w-full' // Horizontal Layout for Waiting
            : 'flex flex-col p-2 min-h-[144px] h-full' // Vertical Layout for others
        }
        ${className || ''}
      `}
    >
      {/* Room Header */}
      <div className={`
        flex items-center 
        ${colors.text}
        ${isWaitingRoom 
            ? 'border-r border-black/10 pr-4 mr-4 w-auto mb-0' // Side Header
            : 'w-full justify-between mb-1 pb-1 border-b border-black/5' // Top Header
        }
      `}>
        <h3 className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">{room.name}</h3>
        {!isWaitingRoom && (
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-medium bg-white/50 px-1.5 py-0.5 rounded-full">
               {patients.length}
             </span>
           </div>
        )}
      </div>

      {/* Grid/List for Meeples */}
      <div className={`
         flex-1 
         ${isWaitingRoom 
            ? 'flex flex-row flex-wrap gap-x-12 gap-y-8 items-center' // Increased horizontal and vertical gap
            : 'grid grid-cols-4 gap-1 content-start' // Grid Flow
         }
      `}>
        {patients.map((p) => (
          <PatientMeeple 
            key={p.id} 
            patient={p} 
            onClick={onPatientClick}
            onDoubleClick={onPatientDoubleClick}
            className={isWaitingRoom ? 'mb-0 scale-90 origin-center' : 'mb-4'} // Remove margin in waiting room
          />
        ))}
        
        {patients.length === 0 && (
          <div className={`
            flex items-center justify-center opacity-30 text-[10px] italic
            ${isWaitingRoom ? 'ml-2' : 'col-span-4 h-full'}
          `}>
            Trống
          </div>
        )}
      </div>
      
      {/* Counter for Waiting Room (shown at the end if needed, or just relying on visual) */}
      {isWaitingRoom && patients.length > 0 && (
         <span className="ml-auto text-[10px] font-medium bg-white/50 px-2 py-0.5 rounded-full text-gray-500">
            {patients.length}
         </span>
      )}
    </div>
  );
};

export default RoomZone;