import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Check, Regex, Trash2 } from 'lucide-react';
import { Primitive } from '../types';

interface FilterDropdownProps {
  columnKey: string;
  options: Primitive[];
  allPossibleOptions: Primitive[];
  activeSelection: Set<Primitive>;
  onApply: (columnKey: string, selection: Set<Primitive>) => void;
  activeMenuColumn?: string | null;
  onOpenChange?: (isOpen: boolean) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  columnKey,
  options,
  allPossibleOptions,
  activeSelection,
  onApply,
  activeMenuColumn,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  
  const [tempSelection, setTempSelection] = useState<Set<Primitive>>(new Set(activeSelection));
  const isActive = activeSelection.size !== allPossibleOptions.length;

  // Sync local open state with global active menu column
  useEffect(() => {
    if (isOpen && activeMenuColumn !== undefined && activeMenuColumn !== columnKey) {
      setIsOpen(false);
    }
  }, [activeMenuColumn, columnKey, isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    
    if (newOpen) {
      // Reset temp state when opening
      setTempSelection(new Set(activeSelection));
      setSearchText('');
    }
  };

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    if (isRegex) {
      try {
        const regex = new RegExp(searchText, 'i');
        return options.filter((opt) => regex.test(String(opt)));
      } catch (e) {
        return options;
      }
    }
    return options.filter((opt) => String(opt).toLowerCase().includes(searchText.toLowerCase()));
  }, [options, searchText, isRegex]);

  const isAllVisibleSelected = useMemo(() => {
     return filteredOptions.every(opt => tempSelection.has(opt));
  }, [filteredOptions, tempSelection]);

  const toggleOption = (val: Primitive) => {
    const newSet = new Set(tempSelection);
    if (newSet.has(val)) newSet.delete(val);
    else newSet.add(val);
    setTempSelection(newSet);
  };

  const toggleAllVisible = () => {
    const newSet = new Set(tempSelection);
    if (isAllVisibleSelected) {
      filteredOptions.forEach(opt => newSet.delete(opt));
    } else {
      filteredOptions.forEach(opt => newSet.add(opt));
    }
    setTempSelection(newSet);
  };

  const handleApply = () => {
    if (searchText) {
        const visibleOptionsSet = new Set(filteredOptions);
        const finalSelection = new Set<Primitive>();
        tempSelection.forEach(val => {
            if (visibleOptionsSet.has(val)) finalSelection.add(val);
        });
        onApply(columnKey, finalSelection);
    } else {
        onApply(columnKey, tempSelection);
    }
    handleOpenChange(false);
  };

  const handleClear = () => {
    const allSet = new Set(allPossibleOptions);
    onApply(columnKey, allSet);
    handleOpenChange(false);
  };

  const displayValue = (val: Primitive) => (val === null ? '(Blanks)' : String(val));

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={(e) => {
            e.stopPropagation();
            handleOpenChange(!isOpen);
        }}
        className={`p-1 rounded transition-colors duration-200 ${
          isActive 
          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
          : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
        }`}
      >
        <Filter size={12} fill={isActive ? 'currentColor' : 'none'} strokeWidth={isActive ? 2.5 : 2} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); handleOpenChange(false); }}></div>
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl z-50 flex flex-col text-sm text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden ring-1 ring-black/5">
            
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
              <div className="relative flex items-center gap-1">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
                    <input
                    type="text"
                    placeholder={`Search... ${isRegex ? '(Regex)' : ''}`}
                    className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs transition-all placeholder-zinc-400 text-zinc-900 dark:text-white ${isRegex ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-100 dark:ring-indigo-900' : 'border-zinc-200 dark:border-zinc-700'}`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    />
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsRegex(!isRegex); }}
                    className={`p-2 rounded-lg border transition-all ${isRegex ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                    title="Toggle Regex Search"
                >
                    <Regex size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
               <div
                className="flex items-center px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors select-none"
                onClick={(e) => { e.stopPropagation(); toggleAllVisible(); }}
              >
                <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors ${isAllVisibleSelected ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'}`}>
                    {isAllVisibleSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="font-medium text-indigo-900 dark:text-indigo-300 text-xs uppercase tracking-wide">(Select All Visible)</span>
              </div>
              
              {filteredOptions.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-zinc-400 italic">No matches found</div>
              )}

              {filteredOptions.map((opt, idx) => {
                const isSelected = tempSelection.has(opt);
                return (
                  <div
                    key={idx}
                    className="flex items-center px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors select-none"
                    onClick={(e) => { e.stopPropagation(); toggleOption(opt); }}
                  >
                    <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'}`}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-400">{displayValue(opt)}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <button
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                >
                  <Trash2 size={12} />
                  Reset
                </button>
              
              <button
                className="px-4 py-1.5 text-xs font-bold bg-zinc-900 dark:bg-indigo-600 text-white rounded-md hover:opacity-90 shadow-md transition-all"
                onClick={(e) => { e.stopPropagation(); handleApply(); }}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;