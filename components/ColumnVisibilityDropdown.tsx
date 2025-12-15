import * as React from 'react';
import { useState, useMemo } from 'react';
import { Columns, Search, Check, Eye, EyeOff } from 'lucide-react';
import { ColumnMeta } from '../types';

interface ColumnVisibilityDropdownProps {
  columns: ColumnMeta[];
  hiddenColumns: Set<string>;
  onToggleColumn: (key: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const ColumnVisibilityDropdown: React.FC<ColumnVisibilityDropdownProps> = ({
  columns,
  hiddenColumns,
  onToggleColumn,
  onShowAll,
  onHideAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredColumns = useMemo(() => {
    if (!searchText) return columns;
    return columns.filter(col => 
      col.key.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [columns, searchText]);

  const visibleCount = columns.length - hiddenColumns.size;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border border-transparent text-xs font-medium ${
          isOpen 
            ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-sm' 
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        title="Manage Columns"
      >
        <Columns size={14} />
        <span className="hidden sm:inline">Columns</span>
        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full text-[10px]">
            {visibleCount}/{columns.length}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl z-50 flex flex-col text-sm text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden ring-1 ring-black/5">
            
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Find column..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs transition-all placeholder-zinc-400 text-zinc-900 dark:text-white"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                 <button 
                    onClick={onShowAll}
                    className="flex-1 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1"
                 >
                    <Eye size={12} /> Show All
                 </button>
                 <button 
                    onClick={onHideAll}
                    className="flex-1 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1"
                 >
                    <EyeOff size={12} /> Hide All
                 </button>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
              {filteredColumns.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-zinc-400 italic">No columns found</div>
              )}

              {filteredColumns.map((col) => {
                const isVisible = !hiddenColumns.has(col.key);
                return (
                  <div
                    key={col.key}
                    className="flex items-center px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors select-none group"
                    onClick={() => onToggleColumn(col.key)}
                  >
                    <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center shrink-0 transition-colors ${isVisible ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'}`}>
                        {isVisible && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className={`truncate font-mono text-xs ${isVisible ? 'text-zinc-700 dark:text-zinc-300 font-medium' : 'text-zinc-400 dark:text-zinc-600'}`}>{col.key}</span>
                    </div>
                    {col.isParent && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 shrink-0" title="Parent Property"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColumnVisibilityDropdown;