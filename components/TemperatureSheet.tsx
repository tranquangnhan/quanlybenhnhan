
import React, { useRef } from 'react';
import { Patient } from '../types';
import { INITIAL_ROOMS } from '../constants';
import { FileText } from 'lucide-react';

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

  // Define new slot structure
  const slotsDay1 = ['23h'];
  const slotsDay2 = ['2h', '5h', '8h', '11h', '14h', '17h', '20h'];
  
  // Define which slots are active for STC (Sang/Trua/Chieu)
  const stcActiveSlots = ['5h', '11h', '20h'];

  // 1. Filter out 'waiting' room patients AND 'none' monitoring type
  const monitoringPatients = patients.filter(p => 
    p.roomId !== 'waiting' && 
    p.monitoringType !== 'none'
  );

  // 2. Sort patients by Room Order (as defined in INITIAL_ROOMS) then by Name
  const roomOrder = INITIAL_ROOMS.map(r => r.id);
  const sortedPatients = [...monitoringPatients].sort((a, b) => {
    const roomIndexA = roomOrder.indexOf(a.roomId);
    const roomIndexB = roomOrder.indexOf(b.roomId);
    if (roomIndexA !== roomIndexB) return roomIndexA - roomIndexB;
    return a.name.localeCompare(b.name);
  });

  // Helper to get Short Room Name
  const getRoomName = (id: string) => {
    const room = INITIAL_ROOMS.find(r => r.id === id);
    if (!room) return id;
    return room.name.replace('Phòng ', '').replace('Cách Ly', 'CL');
  };

  const handleDownloadWord = () => {
    if (!printRef.current) return;

    // Use specific widths for Word Export to force alignment
    // STT: 30px, Name: 150px, Room: 50px, H/L: 40px, Slots: 40px each
    // Total approx: 30 + 150 + 50 + 40 + (8 * 40) = 590px (fits easily on A4 Landscape)
    
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Theo Dõi Thân Nhiệt</title>
        <style>
          @page Section1 {
            size: 841.9pt 595.3pt; /* A4 Landscape */
            mso-page-orientation: landscape;
            margin: 1.0cm;
          }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; }
          /* CRITICAL: table-layout: fixed ensures Word respects column widths */
          table { border-collapse: collapse; width: 100%; table-layout: fixed; }
          td, th { border: 1px solid black; padding: 3px; font-size: 11pt; vertical-align: middle; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .diagonal { background-color: #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 18pt; font-weight: bold; text-transform: uppercase; margin: 0;">PHIẾU THEO DÕI THÂN NHIỆT</p>
            <p style="font-style: italic; margin: 5px 0;">(Nếu BN có T⁰ ≥ 38,5⁰C thì cho uống 1 viên <strong>Paracetamol 500mg</strong>)</p>
            <p style="color: red; font-weight: bold; margin: 5px 0;">Chú ý: Nếu cho uống Paracetamol 500mg thì ghi rõ vào ô</p>
          </div>
          <table>
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th rowspan="2" style="width: 30px;">STT</th>
                <th rowspan="2" style="width: 150px; text-align: left; padding-left: 5px;">Họ và tên</th>
                <th rowspan="2" style="width: 50px;">Phòng</th>
                <th rowspan="2" style="width: 40px;">H/Lần</th>
                <th colspan="${slotsDay1.length}" style="text-align: center;">Đêm ${formatDate(today)}</th>
                <th colspan="${slotsDay2.length}" style="text-align: center;">Ngày ${formatDate(tomorrow)}</th>
              </tr>
              <tr style="background-color: #f3f4f6;">
                ${slotsDay1.map(t => `<th style="width: 40px;">${t}</th>`).join('')}
                ${slotsDay2.map(t => `<th style="width: 40px;">${t}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${sortedPatients.map((p, index) => {
                 const type = p.monitoringType || 'stc'; 
                 const displayType = type === '3h' ? '3h' : 'S/T/C';
                 
                 let rowHtml = `<tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="text-align: left; padding-left: 5px; word-wrap: break-word;">${p.name}</td>
                    <td style="text-align: center;">${getRoomName(p.roomId)}</td>
                    <td style="text-align: center; font-size: 9pt;">${displayType}</td>`;
                 
                 // Slots Day 1
                 slotsDay1.forEach(t => {
                    const isCrossed = type !== '3h' && !stcActiveSlots.includes(t);
                    rowHtml += `<td style="height: 30px; ${isCrossed ? 'background-color: #e5e7eb;' : ''}"></td>`;
                 });
                 // Slots Day 2
                 slotsDay2.forEach(t => {
                    const isCrossed = type !== '3h' && !stcActiveSlots.includes(t);
                    rowHtml += `<td style="height: 30px; ${isCrossed ? 'background-color: #e5e7eb;' : ''}"></td>`;
                 });
                 
                 rowHtml += `</tr>`;
                 return rowHtml;
              }).join('')}
              
              ${Array.from({ length: Math.max(0, 15 - sortedPatients.length) }).map((_, i) => {
                 return `<tr>
                    <td style="text-align: center; height: 30px;">${sortedPatients.length + i + 1}</td>
                    <td></td><td></td><td></td>
                    ${slotsDay1.map(() => '<td></td>').join('')}
                    ${slotsDay2.map(() => '<td></td>').join('')}
                 </tr>`;
              }).join('')}
            </tbody>
          </table>
          <br/><br/>
          <table style="border: none;">
             <tr style="border: none;">
                <td style="border: none; width: 50%;"></td>
                <td style="border: none; width: 50%; text-align: center;">
                   <p style="font-style: italic; margin: 0;">Ngày ..... tháng ..... năm 20...</p>
                   <p style="font-weight: bold; margin-top: 5px;">Y tá / Điều dưỡng ký tên</p>
                </td>
             </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    // Create Blob
    const blob = new Blob(['\ufeff', preHtml], {
        type: 'application/msword'
    });
    
    // Download Link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theo-doi-than-nhiet-${formatDate(today).replace('/', '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom border style for ON-SCREEN display
  const borderStyle = { border: '0.1mm solid #000' };

  return (
    <div className="fixed inset-0 bg-gray-200 z-[9999] overflow-auto flex flex-col items-center">
      {/* Print Controls */}
      <div className="w-full bg-white p-4 flex justify-between items-center border-b border-gray-300 shadow-md sticky top-0 z-50">
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
            onClick={handleDownloadWord}
            // Add sandbox="allow-modals" to help in restricted environments even if just a button
            {...({ sandbox: "allow-modals" } as any)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 transition shadow-md"
          >
            <FileText size={18} />
            Tải Word (.doc)
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper (Centers the A4 sheet) - Only for Visual Preview */}
      <div className="py-8 w-full flex justify-center overflow-x-auto">
        <div 
          ref={printRef}
          className="bg-white text-black shadow-xl"
          style={{ 
            width: '280mm', // Explicit width close to A4 Landscape
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
              <col className="w-[30px]" /> {/* STT */}
              <col className="w-[150px]" /> {/* Name */}
              <col className="w-[50px]" /> {/* Room */}
              <col className="w-[40px]" /> {/* Freq */}
              {/* Dynamic cols for times */}
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
                const displayType = type === '3h' ? '3h' : 'S/T/C';
                
                const isCrossedOut = (slot: string) => {
                  if (type === '3h') return false;
                  return !stcActiveSlots.includes(slot);
                };

                const diagonalStyle = {
                  backgroundImage: `linear-gradient(to top right, transparent 48%, #999 49%, #999 51%, transparent 52%)`
                };
                const diagonalClass = "diagonal";

                return (
                  <tr key={p.id}>
                    <td className="p-1 text-center align-middle" style={borderStyle}>{index + 1}</td>
                    <td className="p-1 pl-2 font-semibold align-middle text-left break-words whitespace-normal" style={borderStyle}>
                      {p.name}
                    </td>
                    <td className="p-1 text-center font-bold text-gray-700 align-middle" style={borderStyle}>
                      {getRoomName(p.roomId)}
                    </td>
                    <td className="p-1 text-center uppercase text-[10px] align-middle" style={borderStyle}>
                      {displayType}
                    </td>
                    
                    {slotsDay1.map(t => (
                      <td 
                        key={`c1-${t}`} 
                        className={`h-8 ${isCrossedOut(t) ? diagonalClass : ''}`}
                        style={{ ...borderStyle, ...(isCrossedOut(t) ? diagonalStyle : {}) }}
                      ></td>
                    ))}
                    
                    {slotsDay2.map(t => (
                      <td 
                        key={`c2-${t}`} 
                        className={`h-8 ${isCrossedOut(t) ? diagonalClass : ''}`}
                        style={{ ...borderStyle, ...(isCrossedOut(t) ? diagonalStyle : {}) }}
                      ></td>
                    ))}
                  </tr>
                );
              })}
              
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
