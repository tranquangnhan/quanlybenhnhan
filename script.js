









// --- Constants & Data ---
const RoomType = {
    WARD: 'ward',
    ISOLATION: 'isolation',
    OFFICE: 'office',
    POST_OP: 'post_op',
    INJECTION: 'injection',
    WAITING: 'waiting'
};

const ROOMS = [
    { id: 'isolation', name: 'Cách Ly', type: RoomType.ISOLATION },
    { id: 'ke_bn3', name: 'Kế BN3', type: RoomType.WARD },
    { id: 'bn3', name: 'Phòng BN3', type: RoomType.WARD },
    { id: 'bn2', name: 'Phòng BN2', type: RoomType.WARD },
    { id: 'bn1', name: 'Phòng BN1', type: RoomType.WARD },
    { id: 'officer', name: 'Sĩ Quan', type: RoomType.OFFICE },
    { id: 'injection', name: 'Tiêm', type: RoomType.INJECTION },
    { id: 'post_op', name: 'Hậu Phẫu', type: RoomType.POST_OP },
    { id: 'waiting', name: 'Chờ Xếp Phòng', type: RoomType.WAITING },
];

const ROOM_COLORS = {
    [RoomType.ISOLATION]: { bg: 'bg-pastel-pink', border: 'border-pastel-pinkDark', text: 'text-red-700' },
    [RoomType.WARD]: { bg: 'bg-pastel-blue', border: 'border-pastel-blueDark', text: 'text-blue-800' },
    [RoomType.OFFICE]: { bg: 'bg-pastel-purple', border: 'border-pastel-purpleDark', text: 'text-purple-800' },
    [RoomType.POST_OP]: { bg: 'bg-pastel-orange', border: 'border-pastel-orangeDark', text: 'text-orange-800' },
    [RoomType.INJECTION]: { bg: 'bg-pastel-green', border: 'border-pastel-greenDark', text: 'text-green-800' },
    [RoomType.WAITING]: { bg: 'bg-pastel-gray', border: 'border-pastel-grayDark', text: 'text-gray-600' },
};

const MOCK_TEXT = `Nguyễn Văn A	21/07/2006	h3	kđt	b.SCT-d8	Sốt, viêm họng cấp N2	20/11/2025
Nguyễn Thanh B	03/10/2006	h3	at	c10-d9	Sốt, viêm họng cấp N2	20/11/2025
Nguyễn Trọng C	22/10/2005	h3	at	c11-d9	Sốt, viêm họng cấp N2	20/11/2025
Nguyễn Quốc D	21/08/2001	h1	cs	c16	Sốt, viêm họng cấp N2	20/11/2025
Thạch Duy E	07/09/2005	h1	cs	c11-d9	Sốt, viêm họng cấp N2	20/11/2025
Doãn Văn F	28/12/2005	h1	cs	c20	Sốt, viêm họng cấp N2	21/11/2025
Đặng Đức G	01/01/2000	h3	at	c7-d8	Sốt, viêm họng cấp N2	21/11/2025
Hoàng Văn H	15/08/2006	h1	cs	c2-d7	Viêm hạch vùng cằm	21/11/2025`;

// --- State ---
let patients = [];
try {
    const saved = localStorage.getItem('pastel_medimap_patients');
    patients = saved ? JSON.parse(saved) : [];
} catch (e) {
    console.error("Failed to parse patients", e);
    patients = [];
}

let filters = { search: '', rank: '' };
let draggedPatientId = null;
let currentDetailId = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if we should render offline mode
    if (!document.getElementById('root')) {
        document.getElementById('appContainer').classList.remove('hidden');
        injectTrashZone();
        renderApp();
        setupEventListeners();
        initPet();
    }
});

function injectTrashZone() {
    const trash = document.getElementById('trash-zone');
    if (!trash) return; 
    
    trash.ondragover = (e) => {
        e.preventDefault();
        trash.classList.add('active');
    };
    trash.ondragleave = () => {
        trash.classList.remove('active');
    };
    trash.ondrop = (e) => {
        e.preventDefault();
        trash.classList.remove('active');
        
        if (draggedPatientId) {
            // Instant delete without confirmation modal
            patients = patients.filter(p => p.id !== draggedPatientId);
            savePatients();
        }
    };
}

function savePatients() {
    localStorage.setItem('pastel_medimap_patients', JSON.stringify(patients));
    renderApp();
}

// --- Rendering ---
function renderApp() {
    ROOMS.forEach(room => {
        const zoneId = `${room.id}-zone`;
        const container = document.getElementById(zoneId);
        if (!container) return;

        // Filter patients
        const roomPatients = patients.filter(p => {
            if (p.roomId !== room.id) return false;
            
            const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                                p.diagnosis.toLowerCase().includes(filters.search.toLowerCase());
            const matchRank = filters.rank ? (p.rank || '').toLowerCase().includes(filters.rank.toLowerCase()) : true;
            return matchSearch && matchRank;
        });

        const colors = ROOM_COLORS[room.type];
        const isWaiting = room.type === RoomType.WAITING;
        
        let contentHtml = '';
        
        if (isWaiting) {
             contentHtml = `
                <div class="relative flex flex-row items-center px-4 py-2 rounded-3xl border-4 transition-all duration-300 min-h-[60px] w-full shadow-sm group/room ${colors.bg} ${colors.border}"
                     ondragover="event.preventDefault()" ondrop="handleDrop(event, '${room.id}')">
                    <div class="flex items-center border-r border-black/10 pr-4 mr-4 mb-0 ${colors.text}">
                        <h3 class="font-bold text-sm uppercase tracking-wider whitespace-nowrap">${room.name}</h3>
                    </div>
                    <div class="flex-1 flex flex-row flex-wrap gap-x-12 gap-y-8 items-center">
                        ${roomPatients.length === 0 ? '<div class="ml-2 opacity-30 text-xs italic">Trống</div>' : ''}
                        ${roomPatients.map(p => createMeepleHTML(p, true)).join('')}
                    </div>
                     ${roomPatients.length > 0 ? `<span class="ml-auto text-xs font-medium bg-white/50 px-2 py-0.5 rounded-full text-gray-500">${roomPatients.length}</span>` : ''}
                </div>
             `;
        } else {
             const heightClass = ['bn1', 'bn2', 'bn3'].includes(room.id) ? 'min-h-[300px]' : 'min-h-[144px]';
             
             contentHtml = `
                <div class="relative flex flex-col p-2 rounded-3xl border-4 transition-all duration-300 ${heightClass} shadow-sm h-full group/room ${colors.bg} ${colors.border}"
                     ondragover="event.preventDefault()" ondrop="handleDrop(event, '${room.id}')">
                    <div class="flex justify-between items-center mb-1 pb-1 border-b border-black/5 ${colors.text}">
                        <h3 class="font-bold text-xs uppercase tracking-wider">${room.name}</h3>
                        <span class="text-[10px] font-medium bg-white/50 px-1.5 py-0.5 rounded-full">${roomPatients.length}</span>
                    </div>
                    <div class="flex-1 grid grid-cols-4 gap-1 content-start">
                        ${roomPatients.length === 0 ? '<div class="col-span-4 flex items-center justify-center opacity-30 text-[10px] italic h-full">Trống</div>' : ''}
                        ${roomPatients.map(p => createMeepleHTML(p, false)).join('')}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = contentHtml;
    });
}

function createMeepleHTML(p, isWaiting) {
    let colorClass = 'bg-pink-400';
    if ((p.rank || '').toLowerCase().includes('h3')) colorClass = 'bg-blue-400';
    if ((p.rank || '').toLowerCase().includes('h1')) colorClass = 'bg-green-400';

    let icon = '<i class="fas fa-user text-white opacity-80" style="font-size:10px"></i>';
    if (p.role === 'kđt') icon = '<i class="fas fa-star text-white opacity-80" style="font-size:10px"></i>';
    if (p.diagnosis.toLowerCase().includes('sốt')) icon = '<i class="fas fa-heartbeat text-white opacity-80" style="font-size:10px"></i>';

    const marginClass = isWaiting ? 'mb-0 scale-90 origin-center' : 'mb-4';
    const isLongTerm = p.isLongTerm === true;
    
    const borderClass = isLongTerm ? 'border-red-600 ring-4 ring-red-200' : 'border-white';
    const bodyBorderClass = isLongTerm ? 'border-red-600' : 'border-white';
    const nameClass = isLongTerm 
        ? 'bg-red-100 text-red-700 border-red-500 shadow-red-200' 
        : 'bg-white/95 text-gray-900 border-gray-300';

    // Last name logic
    const lastName = p.name.trim().split(' ').pop() || p.name.charAt(0);

    return `
        <div class="patient-meeple relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-transform hover:scale-105 ${marginClass}"
             draggable="true" 
             data-id="${p.id}"
             onclick="openDetails('${p.id}')"
             ondblclick="toggleLongTerm('${p.id}')">
            <div class="w-9 h-9 rounded-full ${colorClass} border-[3px] ${borderClass} shadow-sm flex items-center justify-center z-10 transition-all overflow-hidden">
                <span class="text-[8px] font-extrabold text-white leading-tight px-0.5 text-center break-words w-full">${lastName}</span>
            </div>
            <div class="w-11 h-9 -mt-2 rounded-b-xl rounded-t-md ${colorClass} border-[3px] ${bodyBorderClass} shadow-md flex items-center justify-center z-0 transition-colors">
                ${icon}
            </div>
            <div class="absolute -bottom-7 px-2 py-1 rounded-md border-2 shadow-sm whitespace-nowrap z-20 font-extrabold max-w-[140px] overflow-hidden text-ellipsis text-xs ${nameClass}">
                ${p.name}
            </div>
        </div>
    `;
}

// --- Toggle Long Term ---
window.toggleLongTerm = (id) => {
    const pIdx = patients.findIndex(p => p.id === id);
    if (pIdx > -1) {
        patients[pIdx].isLongTerm = !patients[pIdx].isLongTerm;
        savePatients();
    }
};

// --- Drag & Drop (Native) ---
window.handleDragStart = (e) => {
    draggedPatientId = e.target.closest('.patient-meeple').getAttribute('data-id');
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
    // Show trash zone
    const trash = document.getElementById('trash-zone');
    if (trash) trash.classList.add('visible');
};

window.handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    // Hide trash zone
    const trash = document.getElementById('trash-zone');
    if (trash) trash.classList.remove('visible');
    // draggedPatientId is NOT cleared here because dragEnd fires after drop, 
    // and we need the ID for the drop handler. It will be cleared in drop or by next start.
};

window.handleDrop = (e, roomId) => {
    e.preventDefault();
    if (draggedPatientId) {
        const idx = patients.findIndex(p => p.id === draggedPatientId);
        if (idx !== -1 && patients[idx].roomId !== roomId) {
            patients[idx].roomId = roomId;
            savePatients();
        }
    }
    draggedPatientId = null;
};

document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.patient-meeple')) window.handleDragStart(e);
});
document.addEventListener('dragend', (e) => {
    if (e.target.closest('.patient-meeple')) window.handleDragEnd(e);
});

// --- Modals & Interactions ---
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filters.search = e.target.value;
        renderApp();
    });
    document.getElementById('rankFilter').addEventListener('change', (e) => {
        filters.rank = e.target.value;
        renderApp();
    });

    document.getElementById('importBtn').onclick = () => {
        document.getElementById('importModal').classList.remove('hidden');
        document.getElementById('importText').value = MOCK_TEXT;
    };
    document.getElementById('closeImport').onclick = () => document.getElementById('importModal').classList.add('hidden');
    document.getElementById('cancelImport').onclick = () => document.getElementById('importModal').classList.add('hidden');
    document.getElementById('runImport').onclick = handleImport;

    document.getElementById('closeDetails').onclick = closeDetails;
    document.getElementById('deleteBtn').onclick = () => {
        document.getElementById('deleteBtn').classList.add('hidden');
        document.getElementById('deleteConfirmUI').classList.remove('hidden');
    };
    document.getElementById('cancelDelete').onclick = () => {
        document.getElementById('deleteConfirmUI').classList.add('hidden');
        document.getElementById('deleteBtn').classList.remove('hidden');
    };
    document.getElementById('confirmDelete').onclick = () => {
        patients = patients.filter(p => p.id !== currentDetailId);
        savePatients();
        closeDetails();
    };
    document.getElementById('detailMonitoring').onchange = (e) => {
        const p = patients.find(p => p.id === currentDetailId);
        if (p) {
            p.monitoringType = e.target.value;
            savePatients();
        }
    };
    document.getElementById('downloadDischargeBtn').onclick = downloadDischargePaper;

    document.getElementById('printBtn').onclick = generatePrintView;
    document.getElementById('closePrint').onclick = () => document.getElementById('printModal').classList.add('hidden');
    document.getElementById('downloadPdfBtn').onclick = downloadWord;
}

// --- Import Logic ---
function handleImport() {
    const text = document.getElementById('importText').value;
    const btn = document.getElementById('runImport');
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    setTimeout(() => {
        try {
            let newPatients = mockParse(text);
            newPatients = newPatients.map(p => ({
                ...p, 
                id: p.id || Math.random().toString(36).substr(2, 9),
                roomId: 'waiting',
                monitoringType: 'none',
                isLongTerm: false
            }));
            patients = [...patients, ...newPatients];
            savePatients();
            document.getElementById('importModal').classList.add('hidden');
        } catch (e) {
            alert("Lỗi nhập dữ liệu.");
        } finally {
            btn.innerHTML = '<i class="fas fa-magic"></i> Phân tích & Nhập';
            btn.disabled = false;
        }
    }, 500);
}

function mockParse(text) {
    return text.trim().split('\n').map(line => {
        const parts = line.split(/[\t\s]{2,}/); 
        const cols = parts.length > 3 ? parts : line.split('\t');
        return {
            name: cols[0] || 'Unknown',
            dob: cols[1] || '',
            rank: cols[2] || '',
            role: cols[3] || '',
            unit: cols[4] || '',
            diagnosis: cols[5] || '',
            admissionDate: cols[6] || ''
        };
    }).filter(p => p.name !== 'Unknown');
}

// --- Details Logic ---
window.openDetails = (id) => {
    const p = patients.find(pat => pat.id === id);
    if (!p) return;
    currentDetailId = id;

    document.getElementById('detailName').innerText = p.name;
    document.getElementById('detailId').innerText = p.id.slice(0, 8);
    document.getElementById('detailDob').innerText = p.dob;
    document.getElementById('detailRankRole').innerText = `${p.rank || '-'} / ${p.role || '-'}`;
    document.getElementById('detailUnit').innerText = p.unit;
    document.getElementById('detailDiagnosis').innerText = p.diagnosis;
    document.getElementById('detailMonitoring').value = p.monitoringType || 'none';
    
    let avatar = '🧑‍⚕️';
    if ((p.rank || '').includes('h1')) avatar = '👶';
    else if ((p.rank || '').includes('h3')) avatar = '🧑‍🎓';
    document.getElementById('detailAvatar').innerText = avatar;

    // Reset Discharge Info
    document.getElementById('dischargeHometown').value = '';
    document.getElementById('dischargeDate').value = new Date().toISOString().split('T')[0];
    
    // Auto-fill meds/condition
    const d = (p.diagnosis || '').toLowerCase();
    let meds = '';
    let cond = 'Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, ăn ngủ sinh hoạt bình thường.';

    if (d.includes('sốt')) {
        meds = "- Kháng sinh\n- Giảm ho\n- Giảm đau, hạ sốt\n- Kháng histamin\n- Sinh tố";
    } else {
        meds = "- Kháng sinh\n- Giảm đau, hạ sốt\n- Sinh tố";
    }

    if ((d.includes('viêm họng') || d.includes('họng')) && d.includes('sốt')) {
        cond = "Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết sổ mũi, hết đau họng, ăn ngủ sinh hoạt bình thường.";
    } else if (d.includes('amydal') || d.includes('amidan')) {
        cond = "Tỉnh táo, tiếp xúc tốt, dấu hiệu sinh tồn ổn định. Toàn trạng ổn định, hết sốt, hết ho, hết đau đầu, hết đau họng, amydal hết sưng đau, ăn ngủ sinh hoạt bình thường.";
    }

    document.getElementById('dischargeMeds').value = meds;
    document.getElementById('dischargeCondition').value = cond;

    document.getElementById('deleteBtn').classList.remove('hidden');
    document.getElementById('deleteConfirmUI').classList.add('hidden');
    document.getElementById('detailsModal').classList.remove('hidden');
};

function closeDetails() {
    document.getElementById('detailsModal').classList.add('hidden');
    currentDetailId = null;
}

// --- Discharge Paper Generator (Standalone) ---
function downloadDischargePaper() {
    const p = patients.find(pat => pat.id === currentDetailId);
    if (!p) return;

    const hometown = document.getElementById('dischargeHometown').value;
    const dischargeDateVal = document.getElementById('dischargeDate').value;
    const meds = document.getElementById('dischargeMeds').value;
    const condition = document.getElementById('dischargeCondition').value;

    const mapRank = (r) => {
        const lower = (r || '').toLowerCase();
        // Officers (Tá) - Check double slashes first
        if (lower.includes('4//')) return 'Đại tá';
        if (lower.includes('3//')) return 'Thượng tá';
        if (lower.includes('2//')) return 'Trung tá';
        if (lower.includes('1//')) return 'Thiếu tá';
        
        // Officers (Úy)
        if (lower.includes('4/')) return 'Đại úy';
        if (lower.includes('3/')) return 'Thượng úy';
        if (lower.includes('2/')) return 'Trung úy';
        if (lower.includes('1/')) return 'Thiếu úy';

        // NCOs & Enlisted
        if (lower.includes('h3')) return 'Thượng sĩ';
        if (lower.includes('h2')) return 'Trung sĩ';
        if (lower.includes('h1')) return 'Hạ sĩ';
        if (lower.includes('b1')) return 'Binh nhất';
        if (lower.includes('b2')) return 'Binh nhì';
        
        return r;
    };
    
    const mapRole = (r) => {
        const lower = (r || '').toLowerCase().trim();
        const roleMap = {
            'cs': 'Chiến sĩ',
            'at': 'Tiểu đội trưởng',
            'kđt': 'Khẩu đội trưởng',
            'ctv': 'Chính trị viên',
            'ctvp': 'Chính trị viên phó',
            'ct': 'Đại đội trưởng',
            'pct': 'Phó đại đội trưởng',
            'tx': 'Trưởng xe',
            'tlqc': 'Trợ lý quần chúng',
            'nvcntt': 'Nhân viên CNTT',
            'nvtk': 'Nhân viên thống kê',
            'tltc': 'Trợ lý tác chiến',
            'pcnct': 'Phó chủ nhiệm chính trị',
            'nvna': 'Nhân viên nấu ăn',
            'nđ': 'Nạp đạn',
            'pt': 'Pháo thủ',
            'csm': 'Chiến sĩ mới',
            'lxe': 'Lái xe',
            'tsc': 'Thợ sửa chữa',
            'dt': 'Tiểu đoàn trưởng',
            'pdt': 'Tiểu đoàn phó',
            'nvql': 'Nhân viên quản lý',
            'bt': 'Trung đội trưởng',
            'tlhc': 'Trợ lý hậu cần',
            'tlbvệ': 'Trợ lý bảo vệ',
            'nvqn': 'Nhân viên quân nhu',
            'tlth': 'Trợ lý tuyên huấn',
            'nv cơ yếu': 'Nhân viên cơ yếu'
        };
        return roleMap[lower] || r;
    };

    const mapUnit = (u) => {
        let mapped = u || '';
        mapped = mapped.replace(/c(\d+)/gi, 'Đại đội $1');
        mapped = mapped.replace(/d(\d+)/gi, 'Tiểu đoàn $1');
        mapped = mapped.replace(/-/g, ' - ');
        return mapped;
    };

    const today = new Date();
    const dD = new Date(dischargeDateVal);
    const dDay = dD.getDate(); const dMonth = dD.getMonth() + 1; const dYear = dD.getFullYear();
    const formattedDate = `${dDay < 10 ? '0'+dDay : dDay}/${dMonth < 10 ? '0'+dMonth : dMonth}/${dYear}`;

    const medsHtml = meds.split('\n').map(line => `<div style="margin-bottom: 2px;">${line}</div>`).join('');
    
    // A5: 148mm x 210mm (~420pt x 595pt)
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
           <meta charset="utf-8">
           <title>Giấy Ra Viện</title>
           <style>
             /* Page Setup: A5 Portrait */
             @page Section1 { size: 419.55pt 595.3pt; margin: 1.27cm 1.0cm 1.27cm 2.0cm; }
             div.Section1 { page: Section1; }
             body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.3; }
             .header-table td { border: none; padding: 0; vertical-align: top; }
             .center { text-align: center; }
             .bold { font-weight: bold; }
             .italic { font-style: italic; }
             .uppercase { text-transform: uppercase; }
             .indent { margin-left: 20px; }
             .underline { text-decoration: underline; }
             .content-line { margin-bottom: 4px; }
             p { margin: 0; padding: 0; }
           </style>
        </head>
        <body>
           <div class="Section1">
              <table class="header-table" style="width: 100%; margin-bottom: 15px;">
                 <tr>
                    <td class="center" style="width: 45%;">
                       <p style="margin: 0; line-height: 1.2;" class="uppercase">TRUNG ĐOÀN 66</p>
                       <p style="margin: 0; line-height: 1.2;" class="bold underline uppercase">ĐẠI ĐỘI 24</p>
                       <p style="margin: 0; line-height: 1.2;" class="italic">Số: 02</p>
                    </td>
                    <td class="center" style="width: 55%;">
                       <p class="bold uppercase" style="margin: 0; line-height: 1.2;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                       <p class="bold underline" style="margin: 0; line-height: 1.2;">Độc lập – Tự do – Hạnh phúc</p>
                    </td>
                 </tr>
              </table>

              <h1 class="center bold uppercase" style="font-size: 16pt; margin: 20px 0 15px 0;">GIẤY RA VIỆN</h1>

              <div style="text-align: justify;">
                 <div class="content-line">Họ và tên: <span class="bold uppercase" style="font-size: 14pt;">${p.name}</span></div>
                 <div class="content-line">Năm sinh: ${p.dob}</div>
                 <div class="content-line">Quân hàm: ${mapRank(p.rank)} <span style="margin-left: 30px;">Chức vụ: ${mapRole(p.role)}</span></div>
                 <div class="content-line">Đơn vị: ${mapUnit(p.unit)}</div>
                 <div class="content-line">Quê quán: ${hometown}</div>
                 <div class="content-line">Ngày vào viện: ${p.admissionDate} – Ngày ra viện: ${formattedDate}</div>
                 <div class="content-line">Chẩn đoán: <span class="italic">${p.diagnosis} đã ổn định</span></div>
                 
                 <div class="content-line">Thuốc điều trị:</div>
                 <div class="indent" style="margin-bottom: 5px;">
                    ${medsHtml}
                 </div>
                 
                 <div class="content-line">Tình trạng bệnh nhân lúc ra viện: ${condition}</div>
                 <div class="content-line">Ý kiến đề nghị: <span class="italic">Về đơn vị công tác.</span></div>
                 <div class="content-line">Chấp hành kỷ luật của bệnh nhân khi nằm bệnh xá: <span class="bold">Tốt.</span></div>
              </div>

              <table class="header-table" style="width: 100%; margin-top: 30px;">
                 <tr>
                    <td class="center bold" style="width: 50%; font-size: 14pt;">
                       Y TÁ HÀNH CHÍNH
                    </td>
                    <td class="center bold" style="width: 50%; font-size: 14pt;">
                       <div class="italic" style="font-weight: normal; margin-bottom: 3px;">Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</div>
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
    link.download = `giay-ra-vien-${p.name}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Print Logic ---
function generatePrintView() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

    const slots1 = ['23h'];
    const slots2 = ['2h', '5h', '8h', '11h', '14h', '17h', '20h'];
    
    // Sort logic
    const list = patients.filter(p => p.roomId !== 'waiting' && p.monitoringType !== 'none');
    const roomOrder = ROOMS.map(r => r.id);
    list.sort((a, b) => {
        const ra = roomOrder.indexOf(a.roomId);
        const rb = roomOrder.indexOf(b.roomId);
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
    });

    const btn = document.getElementById('downloadPdfBtn');
    if (btn) btn.innerHTML = '<i class="fas fa-file-word"></i> Tải Word (.doc)';

    // Column groups for visual preview
    const timeCol = '<col style="width: 40px;" />';
    const colGroupHTML = `
        <colgroup>
            <col style="width: 30px;" />
            <col style="width: 150px;" />
            <col style="width: 50px;" />
            <col style="width: 40px;" />
            ${slots1.map(() => timeCol).join('')}
            ${slots2.map(() => timeCol).join('')}
        </colgroup>
    `;

    let html = `
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold uppercase tracking-wide">PHIẾU THEO DÕI THÂN NHIỆT</h1>
            <p class="italic text-sm mt-1 text-gray-600">(Nếu BN có T⁰ ≥ 38,5⁰C thì cho uống 1 viên <strong>Paracetamol 500mg</strong>)</p>
            <p class="font-bold text-sm mt-1 text-red-600">Chú ý: Nếu cho uống Paracetamol 500mg thì ghi rõ vào ô</p>
        </div>
        <table class="pdf-table table-fixed w-full" style="border: 0.1mm solid #000;">
            ${colGroupHTML}
            <thead>
                <tr class="bg-gray-100">
                    <th rowspan="2" class="p-1 text-center font-bold">STT</th>
                    <th rowspan="2" class="p-1 text-left pl-2 font-bold">Họ và tên</th>
                    <th rowspan="2" class="p-1 text-center font-bold whitespace-nowrap">Phòng</th>
                    <th rowspan="2" class="p-1 text-center font-bold whitespace-nowrap">H/Lần</th>
                    <th colspan="${slots1.length}" class="p-1 text-center font-bold">Đêm ${dateStr(today)}</th>
                    <th colspan="${slots2.length}" class="p-1 text-center font-bold">Ngày ${dateStr(tomorrow)}</th>
                </tr>
                <tr class="bg-gray-50">
                    ${slots1.map(s => `<th class="p-1 text-center font-bold">${s}</th>`).join('')}
                    ${slots2.map(s => `<th class="p-1 text-center font-bold">${s}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    const getRoomName = (id) => {
        const r = ROOMS.find(room => room.id === id);
        return r ? r.name.replace('Phòng ', '').replace('Cách Ly', 'CL') : id;
    };

    const activeSlots = ['5h', '11h', '20h'];

    list.forEach((p, idx) => {
        const type = p.monitoringType || 'stc';
        const displayType = type === '3h' ? '3h' : 'S/T/C';
        const renderCell = (slot) => {
            const isCrossed = type !== '3h' && !activeSlots.includes(slot);
            return `<td class="h-8 ${isCrossed ? 'pdf-diagonal' : ''}"></td>`;
        };

        html += `
            <tr>
                <td class="text-center p-1">${idx + 1}</td>
                <td class="font-semibold p-1 pl-2 text-left break-words whitespace-normal">${p.name}</td>
                <td class="text-center font-bold p-1">${getRoomName(p.roomId)}</td>
                <td class="text-center text-[10px] p-1 uppercase">${displayType}</td>
                ${slots1.map(renderCell).join('')}
                ${slots2.map(renderCell).join('')}
            </tr>
        `;
    });

    for (let i = 0; i < Math.max(0, 15 - list.length); i++) {
        html += `<tr><td class="text-center h-8 p-1">${list.length + i + 1}</td><td class="p-1"></td><td class="p-1"></td><td class="p-1"></td>
                 ${slots1.map(()=>'<td class="p-1"></td>').join('')}${slots2.map(()=>'<td class="p-1"></td>').join('')}</tr>`;
    }

    html += `</tbody></table>
        <div class="mt-8 flex justify-between px-8 text-sm">
            <div></div>
            <div class="text-center">
                <p class="italic">Ngày ..... tháng ..... năm 20...</p>
                <p class="font-bold mt-2">Y tá / Điều dưỡng ký tên</p>
            </div>
        </div>
    `;

    // Only set the preview area
    document.getElementById('printableArea').innerHTML = html;
    document.getElementById('printModal').classList.remove('hidden');
}

function downloadWord() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
    
    // Sort logic
    const list = patients.filter(p => p.roomId !== 'waiting' && p.monitoringType !== 'none');
    const roomOrder = ROOMS.map(r => r.id);
    list.sort((a, b) => {
        const ra = roomOrder.indexOf(a.roomId);
        const rb = roomOrder.indexOf(b.roomId);
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
    });

    const slots1 = ['23h'];
    const slots2 = ['2h', '5h', '8h', '11h', '14h', '17h', '20h'];
    const activeSlots = ['5h', '11h', '20h'];
    
    const getRoomName = (id) => {
        const r = ROOMS.find(room => room.id === id);
        return r ? r.name.replace('Phòng ', '').replace('Cách Ly', 'CL') : id;
    };

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
          table { border-collapse: collapse; width: 100%; table-layout: fixed; }
          td, th { border: 1px solid black; padding: 3px; font-size: 11pt; vertical-align: middle; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .italic { font-style: italic; }
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
                <th colspan="${slots1.length}" style="text-align: center;">Đêm ${dateStr(today)}</th>
                <th colspan="${slots2.length}" style="text-align: center;">Ngày ${dateStr(tomorrow)}</th>
              </tr>
              <tr style="background-color: #f3f4f6;">
                ${slots1.map(t => `<th style="width: 40px;">${t}</th>`).join('')}
                ${slots2.map(t => `<th style="width: 40px;">${t}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
    `;

    let rows = list.map((p, index) => {
         const type = p.monitoringType || 'stc'; 
         const displayType = type === '3h' ? '3h' : 'S/T/C';
         
         let row = `<tr>
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: left; padding-left: 5px; word-wrap: break-word;">${p.name}</td>
            <td style="text-align: center;">${getRoomName(p.roomId)}</td>
            <td style="text-align: center; font-size: 9pt;">${displayType}</td>`;
         
         slots1.forEach(t => {
            const isCrossed = type !== '3h' && !activeSlots.includes(t);
            row += `<td style="height: 30px; ${isCrossed ? 'background-color: #e5e7eb;' : ''}"></td>`;
         });
         slots2.forEach(t => {
            const isCrossed = type !== '3h' && !activeSlots.includes(t);
            row += `<td style="height: 30px; ${isCrossed ? 'background-color: #e5e7eb;' : ''}"></td>`;
         });
         
         row += `</tr>`;
         return row;
    }).join('');

    // Empty rows
    for (let i = 0; i < Math.max(0, 15 - list.length); i++) {
        rows += `<tr>
            <td style="text-align: center; height: 30px;">${list.length + i + 1}</td>
            <td></td><td></td><td></td>
            ${slots1.map(() => '<td></td>').join('')}
            ${slots2.map(() => '<td></td>').join('')}
         </tr>`;
    }

    const postHtml = `
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
    
    const blob = new Blob(['\ufeff', preHtml + rows + postHtml], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theo-doi-than-nhiet.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Pet Logic ---
function initPet() {
    const container = document.getElementById('petContainer');
    if (!container) return;

    container.innerHTML = `
        <div id="dog" class="absolute transition-transform duration-100 ease-linear flex flex-col items-center" 
             style="left: 50%; top: 50%; transform: translate(-50%, -50%);">
            <div class="relative group">
                <div id="dogSvg" class="w-24 h-24 drop-shadow-xl animate-breathe transition-transform duration-200">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
                        <!-- SVG Content (same as React) -->
                        <path d="M15 45 Q 10 30 15 20" stroke="#ea580c" stroke-width="6" stroke-linecap="round" class="animate-wiggle"><animate attributeName="d" values="M15 45 Q 10 30 15 20; M15 45 Q 20 30 15 20; M15 45 Q 10 30 15 20" dur="0.5s" repeatCount="indefinite" /></path>
                        <ellipse cx="30" cy="75" rx="6" ry="10" fill="#c2410c"></ellipse>
                        <ellipse cx="70" cy="75" rx="6" ry="10" fill="#c2410c"></ellipse>
                        <rect x="20" y="40" width="60" height="35" rx="15" fill="#f97316"></rect>
                        <path d="M25 60 Q 50 75 75 60 L 75 65 Q 50 80 25 65 Z" fill="#ffedd5"></path>
                        <ellipse cx="35" cy="78" rx="5" ry="8" fill="#fb923c"></ellipse>
                        <ellipse cx="65" cy="78" rx="5" ry="8" fill="#fb923c"></ellipse>
                        <g transform="translate(60, 25)">
                            <path d="M5 -5 L 15 -15 L 20 0 Z" fill="#c2410c"></path>
                            <path d="M25 -5 L 35 -15 L 30 5 Z" fill="#c2410c"></path>
                            <circle cx="20" cy="10" r="18" fill="#f97316"></circle>
                            <path d="M10 15 Q 20 25 30 15 Q 25 5 20 5 Q 15 5 10 15" fill="#ffedd5"></path>
                            <circle cx="14" cy="10" r="2.5" fill="#1f2937"></circle>
                            <circle cx="26" cy="10" r="2.5" fill="#1f2937"></circle>
                            <circle cx="15" cy="9" r="0.8" fill="white"></circle>
                            <circle cx="27" cy="9" r="0.8" fill="white"></circle>
                            <ellipse cx="20" cy="16" rx="3" ry="2" fill="#374151"></ellipse>
                            <path d="M18 20 Q 20 24 22 20" fill="#ef4444" opacity="0.8"></path>
                        </g>
                        <rect x="62" y="42" width="4" height="12" rx="2" fill="#ef4444" transform="rotate(-15 64 48)"></rect>
                        <circle cx="65" cy="52" r="3" fill="#fbbf24"></circle>
                    </svg>
                </div>
                <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/90 text-orange-600 text-xs px-2 py-0.5 rounded-full border-2 border-orange-300 font-bold whitespace-nowrap shadow-md">My 🐶</div>
            </div>
        </div>
    `;

    let petPos = { x: 50, y: 50 };
    let moveTimer = null;
    window.addEventListener('keydown', (e) => {
        const dogEl = document.getElementById('dog');
        const svg = document.getElementById('dogSvg');
        if (!dogEl || !svg) return;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        
        const step = 1.5;
        let moved = false;
        let scaleX = 1;

        if (e.key === 'ArrowUp') { petPos.y = Math.max(0, petPos.y - step); moved = true; }
        if (e.key === 'ArrowDown') { petPos.y = Math.min(100, petPos.y + step); moved = true; }
        if (e.key === 'ArrowLeft') { petPos.x = Math.max(0, petPos.x - step); scaleX = -1; moved = true; }
        if (e.key === 'ArrowRight') { petPos.x = Math.min(100, petPos.x + step); scaleX = 1; moved = true; }

        if (moved) {
            dogEl.style.left = `${petPos.x}%`;
            dogEl.style.top = `${petPos.y}%`;
            svg.style.transform = `scaleX(${scaleX})`;
            svg.classList.remove('animate-breathe');
            svg.classList.add('animate-bounce-run');
            
            clearTimeout(moveTimer);
            moveTimer = setTimeout(() => {
                svg.classList.remove('animate-bounce-run');
                svg.classList.add('animate-breathe');
            }, 150);
        }
    });
}
