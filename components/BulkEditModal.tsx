import * as React from 'react';
import { useState, useMemo } from 'react';
import { X, CircleAlert, Pencil, Type, Hash, Binary, Ban } from 'lucide-react';
import { smartParseValue } from '../utils/jsonHelper';
import { Primitive } from '../types';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  affectedRowCount: number;
  onSave: (newValue: Primitive) => void;
}

type ValueType = 'string' | 'number' | 'boolean' | 'null';

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  columnName,
  affectedRowCount,
  onSave,
}) => {
  const [value, setValue] = useState('');
  const [forcedType, setForcedType] = useState<ValueType | null>(null);

  // Derived result logic (Copied from EditableCell for consistency)
  const derivedResult = useMemo(() => {
    if (forcedType === 'null') return { value: null, type: 'null' as ValueType };
    
    if (forcedType === 'string') return { value: value, type: 'string' as ValueType };

    if (forcedType === 'number') {
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== '') return { value: num, type: 'number' as ValueType };
      return { value: value, type: 'string' as ValueType };
    }

    if (forcedType === 'boolean') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true') return { value: true, type: 'boolean' as ValueType };
      if (lower === 'false') return { value: false, type: 'boolean' as ValueType };
      return { value: value, type: 'string' as ValueType };
    }

    // Default Smart Inference
    const parsed = smartParseValue(value);
    let type: ValueType = 'string';
    if (parsed === null) type = 'null';
    else if (typeof parsed === 'number') type = 'number';
    else if (typeof parsed === 'boolean') type = 'boolean';
    
    return { value: parsed, type };
  }, [value, forcedType]);

  const toggleForceType = (type: ValueType) => {
    if (type === 'null') setValue('');
    setForcedType(prev => prev === type ? null : type);
  };

  const handleSave = () => {
      onSave(derivedResult.value);
      onClose();
      setValue('');
      setForcedType(null);
  };

  if (!isOpen) return null;

  // Helper for type description
  const getTypeDescription = () => {
      if (forcedType) return `强制 ${forcedType === 'string' ? '字符串' : forcedType === 'number' ? '数字' : forcedType === 'boolean' ? '布尔值' : '空值'}`;
      const inferredType = derivedResult.type === 'string' ? '字符串' : derivedResult.type === 'number' ? '数字' : derivedResult.type === 'boolean' ? '布尔值' : '空值';
      return `自动推断: ${inferredType}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[420px] max-w-[90vw] transform transition-all scale-100 border border-zinc-200 dark:border-zinc-800 ring-1 ring-black/5">
        <div className="flex justify-between items-start p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                 <Pencil size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">批量修改</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">一次性更新多条记录</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="text-xs leading-relaxed">
               正在更新列： <strong className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-amber-900 dark:text-amber-100">{columnName}</strong>
               <br/>
               这将覆盖 <strong className="text-amber-900 dark:text-amber-100">{affectedRowCount}</strong> 条记录。
            </div>
          </div>

          <div>
             <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">新值</label>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${forcedType ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                    {getTypeDescription()}
                </span>
             </div>
             
             <div className="relative">
                 <input 
                    type="text" 
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-4 pr-12 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm placeholder-zinc-400"
                    placeholder={forcedType === 'null' ? 'null' : '输入值...'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    autoFocus
                    disabled={forcedType === 'null'}
                 />
                 {/* Floating Type Selector for Input */}
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <button
                        onClick={() => toggleForceType('string')}
                        className={`p-1.5 rounded transition-colors ${forcedType === 'string' || (!forcedType && derivedResult.type === 'string') ? 'bg-white dark:bg-zinc-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        title="字符串"
                    >
                        <Type size={14} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => toggleForceType('number')}
                        className={`p-1.5 rounded transition-colors ${forcedType === 'number' || (!forcedType && derivedResult.type === 'number') ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        title="数字"
                    >
                        <Hash size={14} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => toggleForceType('boolean')}
                        className={`p-1.5 rounded transition-colors ${forcedType === 'boolean' || (!forcedType && derivedResult.type === 'boolean') ? 'bg-white dark:bg-zinc-600 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        title="布尔值"
                    >
                        <Binary size={14} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => toggleForceType('null')}
                        className={`p-1.5 rounded transition-colors ${forcedType === 'null' ? 'bg-white dark:bg-zinc-600 text-rose-500 dark:text-rose-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        title="空值"
                    >
                        <Ban size={14} strokeWidth={2.5} />
                    </button>
                 </div>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
                取消
            </button>
            <button 
                onClick={handleSave}
                className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transform active:scale-95 transition-all"
            >
                应用更改
            </button>
          </div>
      </div>
    </div>
  );
};

export default BulkEditModal;