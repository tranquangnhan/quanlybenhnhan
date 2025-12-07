import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

const parsePrompt = `
You are a medical data parser helper. 
I will provide a raw text block containing a list of patients.
The columns are roughly: Name, Date of Birth, Rank (h1/h3...), Role (at/cs...), Unit, Diagnosis, Admission Date.
The input might be tab-separated or space-separated.

Extract each line into a JSON object.
Use "waiting" as the default roomId.
Generate a unique random string for "id".

The output structure should be an array of objects.
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
      model: "gemini-2.5-flash",
      contents: `Parse this data:\n${rawText}`,
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
              roomId: { type: Type.STRING, description: "Always set to 'waiting'" },
              id: { type: Type.STRING, description: "A unique random ID" }
            },
            required: ["name", "dob", "diagnosis", "roomId", "id"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text) as Patient[];
    return parsed.map(p => ({ ...p, monitoringType: 'none' }));

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    alert("AI Parsing failed (Check console). Falling back to basic logic.");
    return mockParse(rawText);
  }
};

// Fallback if no API key or error
const mockParse = (text: string): Patient[] => {
  const lines = text.trim().split('\n');
  return lines.map((line) => {
    // Basic split by multiple spaces or tabs
    const parts = line.split(/[\t\s]{2,}/); 
    // Fallback if split failed, try single tab
    const cols = parts.length > 3 ? parts : line.split('\t');

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: cols[0] || 'Unknown',
      dob: cols[1] || '',
      rank: cols[2] || '',
      role: cols[3] || '',
      unit: cols[4] || '',
      diagnosis: cols[5] || '',
      admissionDate: cols[6] || '',
      roomId: 'waiting',
      monitoringType: 'none'
    };
  });
};