import * as React from 'react';
import { useState } from 'react';
import { Clipboard, ArrowRight, X, AlertCircle, FileJson } from 'lucide-react';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (json: any, name: string) => void;
}

const PasteModal: React.FC<PasteModalProps> = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!text.trim()) {
        onClose();
        return;
    }

    try {
      const json = JSON.parse(text);
      // Give it a generic name or try to infer from content if possible (simplified here)
      onImport(json, 'clipboard-data.json');
      onClose();
      setText('');
      setError(null);
    } catch (e) {
      setError('无效的 JSON 格式，请检查您的输入。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[600px] max-w-[95vw] border border-zinc-200 dark:border-zinc-800 ring-1 ring-black/5 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Clipboard size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">粘贴 JSON</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">直接输入或粘贴 JSON 文本内容</p>
             </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col min-h-0">
            <div className="relative flex-1">
                <textarea
                    className={`w-full h-full p-4 bg-zinc-50 dark:bg-zinc-950 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed custom-scrollbar text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 ${error ? 'border-red-300 dark:border-red-900 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-indigo-500'}`}
                    placeholder={`[\n  {\n    "id": 1,\n    "name": "示例数据"\n  }\n]`}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (error) setError(null);
                    }}
                    autoFocus
                />
                 {text.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <FileJson size={48} className="text-zinc-300 dark:text-zinc-700" />
                    </div>
                )}
            </div>
            
            {error && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg animate-in slide-in-from-top-1">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl shrink-0">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
                取消
            </button>
            <button 
                onClick={handleImport}
                disabled={!text.trim()}
                className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
                <span>解析并导入</span>
                <ArrowRight size={14} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default PasteModal;