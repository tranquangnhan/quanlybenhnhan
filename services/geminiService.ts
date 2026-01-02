
import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

const parsePrompt = `
You are a medical data parser helper for a Vietnamese military clinic. 
I will provide raw text extracted from an Excel sheet.
The data represents a report with multiple sections (e.g., "Bệnh xá e", "Viện 211", "Viện 175", "Tuyến trên", "Quân số điều trị dài ngày").

CRITICAL FILTERING RULES:
1. **ONLY EXTRACT** patients listed under the section header containing **"Bệnh xá"** (e.g., "I. Bệnh xá e", "Bệnh xá trung đoàn").
2. **STRICTLY EXCLUDE/IGNORE** any patients listed under headers containing: "Viện 211", "Viện 175", "Viện 108", "Viện 13", "Tuyến trên", "Đi viện", "Điều trị ngoại trú".
3. Process the text sequentially. If you see a header like "Viện 211", stop extracting until you see a header like "Bệnh xá" again.
4. **MANDATORY DATA CHECK**: 
   - IGNORE any row that does not have a Sequence Number (STT).
   - IGNORE any row where Rank (CB), Role (CV), or Unit (ĐV) is missing or empty.
   - Only extract rows that represent a full patient record.

Data Extraction Rules:
- Columns usually are: Name (Họ tên), DOB, Rank (Cấp bậc - CB), Role (Chức vụ - CV), Unit (Đơn vị - ĐV), Diagnosis (Chẩn đoán), Admission Date (Ngày vào).
- If a column is missing, use an empty string.
- Use "waiting" as the default roomId.
- Generate a unique random string for "id".
- Return ONLY a JSON array of objects.
`;

export const parsePatientData = async (rawText: string): Promise<Patient[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("No API Key found, using mock parsing fallback.");
      return mockParse(rawText);
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this Excel data into JSON (Apply filtering rules strictly):\n${rawText}`,
      config: {
        systemInstruction: parsePrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dob: { type: Type.STRING },
              rank: { type: Type.STRING },
              role: { type: Type.STRING },
              unit: { type: Type.STRING },
              diagnosis: { type: Type.STRING },
              admissionDate: { type: Type.STRING },
              roomId: { type: Type.STRING },
              id: { type: Type.STRING }
            },
            required: ["name", "dob", "diagnosis", "roomId", "id"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text) as Patient[];
    
    // Fix: Explicitly narrow 'none' to a literal type to satisfy the Patient interface
    return parsed.map(p => ({ 
      ...p, 
      roomId: p.roomId || 'waiting',
      monitoringType: 'none' as const,
      isLongTerm: false 
    }));

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return mockParse(rawText);
  }
};

export const generateDischargeCondition = async (diagnosis: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "";

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Dựa trên chẩn đoán y tế: "${diagnosis}", hãy viết một cụm từ mô tả các triệu chứng lâm sàng đã hết hoặc ổn định (ví dụ: 'hết sốt, hết đau họng, họng hết sưng đỏ' hoặc 'vết mổ khô, không còn đau bụng'). 
    Yêu cầu:
    - Chỉ trả về cụm từ mô tả lâm sàng đặc thù.
    - KHÔNG bao gồm các cụm từ: 'Tỉnh táo', 'tiếp xúc tốt', 'dấu hiệu sinh tồn ổn định', 'toàn trạng ổn định', 'ăn ngủ sinh hoạt bình thường'.
    - KHÔNG thêm dấu chấm ở cuối. Trả về trực tiếp văn bản.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.6,
      },
    });

    let result = response.text?.trim() || "";
    if (result.endsWith('.')) {
      result = result.slice(0, -1);
    }
    return result;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "";
  }
};

const mockParse = (text: string): Patient[] => {
  const lines = text.trim().split('\n');
  return lines
    .filter(line => line.trim().length > 0)
    // Fix: Explicitly type the return of the map function to ensure object literal properties match the Patient interface
    .map((line): Patient => {
      const parts = line.split(/[\t]{1,}/); 
      // Basic heuristic for tab-separated data from Excel
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: parts[0] || 'Unknown',
        dob: parts[1] || '',
        rank: parts[2] || '',
        role: parts[3] || '',
        unit: parts[4] || '',
        diagnosis: parts[5] || '',
        admissionDate: parts[6] || '',
        roomId: 'waiting',
        monitoringType: 'none',
        isLongTerm: false
      };
    })
    .filter(p => p.name !== 'Họ và tên' && p.name !== 'STT' && p.name !== 'Unknown');
};
