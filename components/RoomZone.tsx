
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

  const colors = ROOM_COLORS[room.id] || ROOM_COLORS[room.type];
  const isWaitingRoom = room.type === RoomType.WAITING;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative rounded-[1.5rem] border-2 transition-all duration-300 shadow-sm group/room
        ${colors.bg} ${colors.border}
        ${isOver ? 'ring-2 ring-blue-300 scale-[1.01] shadow-lg' : ''}
        ${isWaitingRoom 
            ? 'flex flex-row items-center px-5 py-3 min-h-[70px] h-auto w-full' 
            : 'flex flex-col p-4 min-h-[180px] h-full' 
        }
        ${className || ''}
      `}
    >
      {/* Room Header */}
      <div className={`
        flex items-center 
        ${colors.text}
        ${isWaitingRoom 
            ? 'border-r border-black/10 pr-5 mr-5 w-auto mb-0' 
            : 'w-full justify-between mb-4 pb-1 border-b border-black/5' 
        }
      `}>
        <h3 className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">{room.name}</h3>
        {!isWaitingRoom && (
           <div className="flex items-center gap-1.5">
             <span className="text-[10px] font-bold bg-white/60 px-2 py-0.5 rounded-full shadow-sm">
               {patients.length} BN
             </span>
           </div>
        )}
      </div>

      {/* Balanced Grid for Patients */}
      <div className={`
         flex-1 
         ${isWaitingRoom 
            ? 'flex flex-row flex-wrap gap-x-12 gap-y-8 items-center' 
            : 'grid grid-cols-2 gap-x-8 gap-y-10 justify-items-center content-start' 
         }
      `}>
        {patients.map((p) => (
          <PatientMeeple 
            key={p.id} 
            patient={p} 
            onClick={onPatientClick}
            onDoubleClick={onPatientDoubleClick}
            className={isWaitingRoom ? 'mb-0 scale-100 origin-center' : ''} 
          />
        ))}
        
        {patients.length === 0 && (
          <div className={`
            flex items-center justify-center opacity-30 text-xs font-semibold italic
            ${isWaitingRoom ? 'ml-3' : 'col-span-2 h-full py-12'}
          `}>
            Trống
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomZone;
