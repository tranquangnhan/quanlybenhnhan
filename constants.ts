
import { RoomData, RoomType } from './types';

export const INITIAL_ROOMS: RoomData[] = [
  { id: 'isolation', name: 'Cách Ly', type: RoomType.ISOLATION },
  { id: 'emergency', name: 'Cấp Cứu', type: RoomType.EMERGENCY },
  { id: 'ke_bn3', name: 'Kế BN3', type: RoomType.WARD },
  { id: 'bn3', name: 'Phòng BN3', type: RoomType.WARD },
  { id: 'bn2', name: 'Phòng BN2', type: RoomType.WARD },
  { id: 'bn1', name: 'Phòng BN1', type: RoomType.WARD },
  { id: 'officer', name: 'Sĩ Quan', type: RoomType.OFFICE },
  { id: 'injection', name: 'Tiêm', type: RoomType.INJECTION },
  { id: 'post_op', name: 'Hậu Phẫu', type: RoomType.POST_OP },
  { id: 'waiting', name: 'Chờ Xếp Phòng', type: RoomType.WAITING },
];

export const ROOM_COLORS: Record<string, { bg: string, border: string, text: string }> = {
  [RoomType.ISOLATION]: { bg: 'bg-pastel-pink', border: 'border-pastel-pinkDark', text: 'text-red-700' },
  [RoomType.EMERGENCY]: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
  [RoomType.WARD]: { bg: 'bg-pastel-blue', border: 'border-pastel-blueDark', text: 'text-blue-800' },
  [RoomType.OFFICE]: { bg: 'bg-pastel-purple', border: 'border-pastel-purpleDark', text: 'text-purple-800' },
  [RoomType.POST_OP]: { bg: 'bg-pastel-orange', border: 'border-pastel-orangeDark', text: 'text-orange-800' },
  [RoomType.INJECTION]: { bg: 'bg-pastel-green', border: 'border-pastel-greenDark', text: 'text-green-800' },
  [RoomType.WAITING]: { bg: 'bg-pastel-gray', border: 'border-pastel-grayDark', text: 'text-gray-600' },
  // Special color for Ke BN3 if needed, or reuse Ward
  'ke_bn3': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800' }
};

export const MOCK_TEXT_INPUT = `Nguyễn Văn A	21/07/2006	h3	kđt	b.SCT-d8	Sốt, viêm họng cấp N2	20/11/2025
Nguyễn Thanh B	03/10/2006	h3	at	c10-d9	Sốt, viêm họng cấp N2	20/11/2025
Nguyễn Trọng C	22/10/2005	h3	at	c11-d9	Sốt, viêm họng cấp N2	20/11/2025
Nguyễn Quốc D	21/08/2001	h1	cs	c16	Sốt, viêm họng cấp N2	20/11/2025
Thạch Duy E	07/09/2005	h1	cs	c11-d9	Sốt, viêm họng cấp N2	20/11/2025
Doãn Văn F	28/12/2005	h1	cs	c20	Sốt, viêm họng cấp N2	21/11/2025
Đặng Đức G	01/01/2000	h3	at	c7-d8	Sốt, viêm họng cấp N2	21/11/2025
Hoàng Văn H	15/08/2006	h1	cs	c2-d7	Viêm hạch vùng cằm	21/11/2025`;
