import React, { useState } from 'react';
import { MOCK_TEXT_INPUT } from '../constants';
import { Sparkles, ClipboardCopy, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => Promise<void>;
  isParsing: boolean;
}

const Importer: React.FC<Props> = ({ isOpen, onClose, onImport, isParsing }) => {
  const [text, setText] = useState(MOCK_TEXT_INPUT);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        <div className="bg-pastel-blue p-4 flex justify-between items-center border-b border-pastel-blueDark">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <ClipboardCopy size={20} />
            Import Patients
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition">
            <X size={20} className="text-blue-900" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-2">Paste your Excel data below (Name, DOB, Rank, Role, Unit, Diagnosis, Date).</p>
          <textarea
            className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-0 font-mono text-xs bg-gray-50 resize-none transition"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw text here..."
          />
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => onImport(text)}
            disabled={isParsing}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white shadow-lg shadow-blue-200
              transition transform active:scale-95
              ${isParsing ? 'bg-gray-400 cursor-wait' : 'bg-blue-500 hover:bg-blue-600'}
            `}
          >
            {isParsing ? (
              <>Processing...</>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze & Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Importer;