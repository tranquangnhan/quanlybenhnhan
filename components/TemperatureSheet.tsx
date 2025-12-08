
import React, { useRef } from 'react';
import { Patient } from '../types';
import { INITIAL_ROOMS } from '../constants';
import { Printer } from 'lucide-react';

interface Props {
  patients: Patient[];
  onClose: () => void;
}

const TemperatureSheet: React.FC<Props> = ({ patients, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const slotsDay1 = ['23h'];
  const slotsDay2 = ['2h', '5h', '8h', '11h', '14h', '17h', '20h'];
  const stcActiveSlots = ['5h', '11h', '20h'];

  const monitoringPatients = patients.filter(p => 
    p.roomId !== 'waiting' && 
    p.monitoringType !== 'none'
  );

  const roomOrder = INITIAL_ROOMS.map(r => r.id);
  const sortedPatients = [...monitoringPatients].sort((a, b) => {
    const roomIndexA = roomOrder.indexOf(a.roomId);
    const roomIndexB = roomOrder.indexOf(b.roomId);
    if (roomIndexA !== roomIndexB) return roomIndexA - roomIndexB;
    return a.name.localeCompare(b.name);
  });

  const getRoomName = (id: string) => {
    const room = INITIAL_ROOMS.find(r => r.id === id);
    if (!room) return id;
    return room.name.replace('Phòng ', '').replace('Cách Ly', 'CL').replace('Cấp Cứu', 'CC');
  };

  const handlePrint = () => {
    window.print();
  };

  const borderStyle = { border: '0.1mm solid #000' };

  return (
    <div className="fixed inset-0 bg-gray-200 z-[9999] overflow-auto flex flex-col items-center">
      {/* Print Controls - Hidden during print */}
      <div className="w-full bg-white p-4 flex justify-between items-center border-b border-gray-300 shadow-md sticky top-0 z-50 no-print">
        <div className="flex flex-col">
          <h2 className="font-bold text-lg text-gray-800">Bảng Tổng Hợp Thân Nhiệt</h2>
          <p className="text-xs text-gray-500">Xem trước bản in</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition border border-gray-300"
          >
            Đóng
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 transition shadow-md"
          >
            <Printer size={18} />
            In Trực Tiếp
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="py-8 w-full flex justify-center overflow-x-auto print:py-0 print:block">
        <div 
          ref={printRef}
          className="bg-white text-black shadow-xl printable-content"
          style={{ 
            width: '280mm', 
            minHeight: '190mm',
            padding: '15px',
            boxSizing: 'border-box'
          }}
        >
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wide">PHIẾU THEO DÕI THÂN NHIỆT</h1>
            <p className="italic text-sm mt-1 text-gray-600">(Nếu BN có T⁰ ≥ 38,5⁰C thì cho uống 1 viên <strong>Paracetamol 500mg</strong>)</p>
            <p className="font-bold text-sm mt-1 text-red-600">Chú ý: Nếu cho uống Paracetamol 500mg thì ghi rõ vào ô</p>
          </div>

          <table className="w-full border-collapse text-xs table-fixed" style={{ border: '0.1mm solid #000' }}>
            <colgroup>
              <col className="w-[30px]" /> 
              <col className="w-[150px]" /> 
              <col className="w-[50px]" /> 
              <col className="w-[40px]" /> 
              {slotsDay1.map(t => <col key={`c1-${t}`} className="w-[40px]" />)}
              {slotsDay2.map(t => <col key={`c2-${t}`} className="w-[40px]" />)}
            </colgroup>
            <thead>
              <tr className="bg-gray-50">
                <th rowSpan={2} className="p-1 text-center font-bold" style={borderStyle}>STT</th>
                <th rowSpan={2} className="p-1 text-left pl-2 font-bold" style={borderStyle}>Họ và tên</th>
                <th rowSpan={2} className="p-1 text-center font-bold whitespace-nowrap" style={borderStyle}>Phòng</th>
                <th rowSpan={2} className="p-1 text-center font-bold whitespace-nowrap" style={borderStyle}>H/Lần</th>
                <th colSpan={slotsDay1.length} className="p-1 bg-gray-100 text-center font-bold" style={borderStyle}>
                  Đêm {formatDate(today)}
                </th>
                <th colSpan={slotsDay2.length} className="p-1 bg-gray-100 text-center font-bold" style={borderStyle}>
                  Ngày {formatDate(tomorrow)}
                </th>
              </tr>
              <tr className="bg-gray-50">
                {slotsDay1.map(t => (
                  <th key={`d1-${t}`} className="p-1 text-center font-bold" style={borderStyle}>{t}</th>
                ))}
                {slotsDay2.map(t => (
                  <th key={`d2-${t}`} className="p-1 text-center font-bold" style={borderStyle}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((p, index) => {
                const type = p.monitoringType || 'stc'; 
                
                const isCrossedOut = (slot: string) => {
                  if (type === '3h') return false;
                  return !stcActiveSlots.includes(slot);
                };

                const diagonalStyle = {
                  backgroundImage: `linear-gradient(to top right, transparent 48%, #999 49%, #999 51%, transparent 52%)`
                };
                const diagonalClass = "diagonal";
                
                // Rows generation logic
                const rows = [];
                const rowSpan = p.monitorVitals ? 3 : 1;
                
                // Helper to generate monitoring row
                const generateRow = (label: string, isFirstRow: boolean) => {
                  return (
                    <tr key={`${p.id}-${label}`}>
                      {isFirstRow && (
                        <>
                          <td rowSpan={rowSpan} className="p-1 text-center align-middle" style={borderStyle}>{index + 1}</td>
                          <td rowSpan={rowSpan} className="p-1 pl-2 font-semibold align-middle text-left break-words whitespace-normal" style={borderStyle}>
                            {p.name}
                          </td>
                          <td rowSpan={rowSpan} className="p-1 text-center font-bold text-gray-700 align-middle" style={borderStyle}>
                            {getRoomName(p.roomId)}
                          </td>
                          <td rowSpan={1} className="p-1 text-center text-[10px] align-middle" style={borderStyle}>
                            {type === '3h' ? '3h/lần' : label}
                          </td>
                        </>
                      )}
                      
                      {!isFirstRow && (
                         <td className="p-1 text-center text-[10px] align-middle font-bold" style={borderStyle}>
                           {label}
                         </td>
                      )}
                      
                      {slotsDay1.map(t => (
                        <td 
                          key={`c1-${t}-${label}`} 
                          className={`h-8 ${isCrossedOut(t) ? diagonalClass : ''}`}
                          style={{ ...borderStyle, ...(isCrossedOut(t) ? diagonalStyle : {}) }}
                        ></td>
                      ))}
                      
                      {slotsDay2.map(t => (
                        <td 
                          key={`c2-${t}-${label}`} 
                          className={`h-8 ${isCrossedOut(t) ? diagonalClass : ''}`}
                          style={{ ...borderStyle, ...(isCrossedOut(t) ? diagonalStyle : {}) }}
                        ></td>
                      ))}
                    </tr>
                  );
                };

                // Row 1: Temperature (T) or standard
                rows.push(generateRow(p.monitorVitals ? 'T' : (type === '3h' ? '3h' : 'S/T/C'), true));
                
                // Row 2 & 3: Pulse (M) and BP (HA) if enabled
                if (p.monitorVitals) {
                   rows.push(generateRow('M', false));
                   rows.push(generateRow('HA', false));
                }
                
                return rows;
              })}
              
              {/* Empty Rows Filler */}
              {Array.from({ length: Math.max(0, 15 - sortedPatients.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="p-1 text-center h-8" style={borderStyle}>{sortedPatients.length + i + 1}</td>
                  <td className="p-1" style={borderStyle}></td>
                  <td className="p-1" style={borderStyle}></td>
                  <td className="p-1" style={borderStyle}></td>
                  {slotsDay1.map(t => <td key={`e1-${t}`} style={borderStyle}></td>)}
                  {slotsDay2.map(t => <td key={`e2-${t}`} style={borderStyle}></td>)}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex justify-between px-8 text-sm">
            <div></div>
            <div className="text-center">
              <p className="italic">Ngày ..... tháng ..... năm 20...</p>
              <p className="font-bold mt-2">Y tá / Điều dưỡng ký tên</p>
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureSheet;
