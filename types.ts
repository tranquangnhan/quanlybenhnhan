
export interface Patient {
  id: string;
  name: string;
  dob: string;
  rank: string;
  role: string; // e.g., at, cs, kđt
  unit: string;
  diagnosis: string;
  admissionDate: string;
  roomId: string; // The ID of the room they are currently in
  monitoringType?: '3h' | 'stc' | 'none'; // 3 hours, Sang/Trua/Chieu, or None
  isLongTerm?: boolean; // Flag for long-term treatment (red marker)
}

export interface RoomData {
  id: string;
  name: string;
  type: 'ward' | 'isolation' | 'office' | 'post_op' | 'injection' | 'waiting' | 'emergency';
  capacity?: number;
}

export enum RoomType {
  WARD = 'ward',
  ISOLATION = 'isolation',
  OFFICE = 'office',
  POST_OP = 'post_op',
  INJECTION = 'injection',
  WAITING = 'waiting',
  EMERGENCY = 'emergency'
}

export interface FilterState {
  search: string;
  rank: string;
  date: string;
}