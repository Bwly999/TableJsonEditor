import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Upload, Download, RotateCcw, Layers, Pencil, FileJson, SquareCheck, Square, ChevronRight, TableProperties, Sparkles, Filter, FolderOpen, Columns, Moon, Sun, Check, Command, Undo, Redo, RotateCw, Type, HelpCircle, ScanEye, Clipboard, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { flattenJSON, unflattenJSON, smartParseValue } from './utils/jsonHelper';
import { FlatRow, ColumnMeta, FilterState, Primitive } from './types';
import FilterDropdown from './components/FilterDropdown';
import BulkEditModal from './components/BulkEditModal';
import JsonDiff from './components/JsonDiff';
import EditableCell from './components/EditableCell';
import ColumnVisibilityDropdown from './components/ColumnVisibilityDropdown';
import ExportModal from './components/ExportModal';
import HelpModal from './components/HelpModal';
import PasteModal from './components/PasteModal';
import DragDropOverlay from './components/DragDropOverlay';

// Virtual Scroll Constants
const ROW_HEIGHT = 40;
const OVERSCAN = 5;
const DEFAULT_COL_WIDTH = 180;
const STORAGE_KEY_HIDDEN_COLS = 'json-grid-hidden-columns';
const STORAGE_KEY_THEME = 'json-grid-theme';

// Notification Types
type NotificationType = 'success' | 'error' | 'info';
interface Notification {
    id: number;
    type: NotificationType;
    message: string;
}

// Spotlight Prism Logo — diamond formed by JSON brackets
const SwiftLogo = () => (
  <div className="relative w-10 h-10 group shrink-0">
    {/* Gradient glow halo */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#00f2ff] via-[#0066ff] to-[#ff9500] rounded-xl blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>

    {/* Icon container */}
    <div className="relative w-full h-full bg-[#0a0a0c] rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
      <svg viewBox="0 0 40 40" className="w-7 h-7 group-hover:scale-105 transition-transform duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="prism-grad" x1="6" y1="20" x2="34" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f2ff" />
            <stop offset="50%" stopColor="#0066ff" />
            <stop offset="100%" stopColor="#ff9500" />
          </linearGradient>
        </defs>

        {/* Left prism half — cyan tint */}
        <path d="M20 6 L6 20 L20 34 Z" fill="#00f2ff" opacity="0.2" />

        {/* Right prism half — orange tint */}
        <path d="M20 6 L34 20 L20 34 Z" fill="#ff9500" opacity="0.2" />

        {/* Prism/Diamond outline */}
        <path d="M20 6 L34 20 L20 34 L6 20 Z"
              stroke="url(#prism-grad)"
              strokeWidth="1.8"
              strokeLinejoin="round" />

        {/* Center spotlight beam */}
        <line x1="20" y1="6" x2="20" y2="34" stroke="white" strokeWidth="1" opacity="0.25" />

        {/* { bracket nib */}
        <path d="M13 14 L17 20 L13 26"
              stroke="#00f2ff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round" />

        {/* } bracket nib */}
        <path d="M27 14 L23 20 L27 26"
              stroke="#ff9500"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round" />

        {/* Spotlight focus point */}
        <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.85" />
      </svg>

      {/* Light sweep on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
    </div>
  </div>
);

function App() {
  // -- State: Data --
  const [originalJson, setOriginalJson] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  
  // -- State: History Management --
  const [history, setHistory] = useState<FlatRow[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [flatRows, setFlatRows] = useState<FlatRow[]>([]);
  
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  
  // -- State: UI & Filters --
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [viewMode, setViewMode] = useState<'edit' | 'diff'>('edit');
  const [bulkEditCol, setBulkEditCol] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [activeMenuColumn, setActiveMenuColumn] = useState<string | null>(null);
  const [isTypeSelectorEnabled, setIsTypeSelectorEnabled] = useState(false);
  
  // -- State: Modals & Feedback --
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // -- State: Theme --
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // -- Effect: Apply Theme --
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // -- Notification Logic --
  const notify = useCallback((message: string, type: NotificationType = 'info') => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
      }, 4000);
  }, []);

  // -- State: Column Visibility --
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_HIDDEN_COLS);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
        return new Set();
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY_HIDDEN_COLS, JSON.stringify(Array.from(hiddenColumns)));
    } catch (e) {
        console.error("Failed to save column settings", e);
    }
  }, [hiddenColumns]);

  // -- State: Column Widths --
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  // -- Refs --
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // -- Virtual Scroll --
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, [viewMode]);

  // -- Undo/Redo Logic --
  const pushToHistory = useCallback((newRows: FlatRow[]) => {
    setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newRows);
        return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
    setFlatRows(newRows);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setFlatRows(history[newIndex]);
        notify('已撤销上一步操作', 'info');
    }
  }, [history, historyIndex, notify]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setFlatRows(history[newIndex]);
        notify('已重做操作', 'info');
    }
  }, [history, historyIndex, notify]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) handleRedo(); else handleUndo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);


  // -- Resize Logic --
  useEffect(() => {
    const handleMouseUp = () => { resizingRef.current = null; document.body.style.cursor = 'default'; };
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingRef.current) {
        const { key, startX, startWidth } = resizingRef.current;
        const diff = e.clientX - startX;
        setColumnWidths(prev => ({ ...prev, [key]: Math.max(80, startWidth + diff) }));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  const handleResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    const currentWidth = columnWidths[key] || DEFAULT_COL_WIDTH;
    resizingRef.current = { key, startX: e.clientX, startWidth: currentWidth };
    document.body.style.cursor = 'col-resize';
  };

  // -- Data Logic: Load --
  const loadJsonData = (json: any, name: string) => {
      try {
          setFileName(name);
          setOriginalJson(json);
          setFlatRows([]);
          setColumns([]);
          setActiveFilters({});
          setColumnWidths({});
          setActiveMenuColumn(null);
          setHistory([]);
          setHistoryIndex(-1);
          
          setTimeout(() => {
              const { rows, columns: cols } = flattenJSON(json);
              setHistory([rows]);
              setHistoryIndex(0);
              setFlatRows(rows);
              setColumns(cols);
              setSelectedRowIds(new Set());
              
              setActiveFilters({});
              setViewMode('edit');
              notify(`成功载入数据集: ${name}`, 'success');
          }, 0);
      } catch (err) {
          notify('解析 JSON 数据失败', 'error');
      }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        loadJsonData(json, file.name);
      } catch (err) { notify("文件内容不是有效的 JSON 格式", "error"); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const openFileSelector = () => fileInputRef.current?.click();

  const visibleColumns = useMemo(() => columns.filter(col => !hiddenColumns.has(col.key)), [columns, hiddenColumns]);
  const filteredRows = useMemo(() => {
    return flatRows.filter(row => {
      for (const col of columns) {
        const allowed = activeFilters[col.key];
        if (allowed && !allowed.has(row[col.key])) return false;
      }
      return true;
    });
  }, [flatRows, activeFilters, columns]);

  const getOptionsForColumn = useCallback((columnKey: string) => {
      const rowsForThisColumn = flatRows.filter(row => {
          for (const col of columns) {
              if (col.key === columnKey) continue; 
              const allowed = activeFilters[col.key];
              if (allowed && !allowed.has(row[col.key])) return false;
          }
          return true;
      });
      return Array.from(new Set(rowsForThisColumn.map(r => r[columnKey]))).sort();
  }, [flatRows, activeFilters, columns]);

  // -- Virtualization --
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop), []);
  const visibleRange = useMemo(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
      const endIndex = Math.min(filteredRows.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
      return { startIndex, endIndex };
  }, [scrollTop, containerHeight, filteredRows.length]);
  const visibleRows = useMemo(() => filteredRows.slice(visibleRange.startIndex, visibleRange.endIndex), [filteredRows, visibleRange]);
  const paddingTop = visibleRange.startIndex * ROW_HEIGHT;
  const paddingBottom = (filteredRows.length - visibleRange.endIndex) * ROW_HEIGHT;

  // -- Selection --
  const isAllSelected = useMemo(() => filteredRows.length > 0 && filteredRows.every(r => selectedRowIds.has(r._id)), [filteredRows, selectedRowIds]);
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) setSelectedRowIds(new Set());
    else {
        const newSet = new Set(selectedRowIds);
        filteredRows.forEach(r => newSet.add(r._id));
        setSelectedRowIds(newSet);
    }
  }, [isAllSelected, filteredRows, selectedRowIds]);
  const toggleRow = useCallback((id: string) => {
      setSelectedRowIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
          return newSet;
      });
  }, []);

  // -- Filter Handlers --
  const handleFilterChange = useCallback((columnKey: string, selection: Set<Primitive>) => {
    setActiveFilters(prev => {
      const allPossible = new Set(flatRows.map(r => r[columnKey]));
      const next = { ...prev };
      
      let isAllSelected = true;
      for (const val of allPossible) {
        if (!selection.has(val)) {
          isAllSelected = false;
          break;
        }
      }
      
      if (isAllSelected) {
        delete next[columnKey];
      } else {
        next[columnKey] = selection;
      }
      return next;
    });
  }, [flatRows]);

  // -- Edit Handlers --
  const handleCellChange = useCallback((id: string, key: string, newValue: Primitive) => {
    const targetRow = flatRows.find(r => r._id === id);
    if (!targetRow) return;

    const targetPathId = targetRow._propPathIds[key];
    const newRows = flatRows.map(row => {
      if (row._propPathIds && row._propPathIds[key] === targetPathId) {
          if (row[key] === newValue) return row;
          return { ...row, [key]: newValue };
      }
      return row;
    });
    pushToHistory(newRows);
  }, [flatRows, pushToHistory]);

  const handleBulkEdit = (newValue: Primitive) => {
    if (!bulkEditCol) return;
    const targetPathIds = new Set<string>();
    const rowsToIterate = selectedRowIds.size > 0 ? flatRows.filter(r => selectedRowIds.has(r._id)) : filteredRows;
    rowsToIterate.forEach(r => targetPathIds.add(r._propPathIds[bulkEditCol]));
    const newRows = flatRows.map(row => {
      if (row._propPathIds && targetPathIds.has(row._propPathIds[bulkEditCol])) return { ...row, [bulkEditCol]: newValue };
      return row;
    });
    pushToHistory(newRows);
    notify(`批量更新了 ${rowsToIterate.length} 条记录`, 'success');
  };

  const handleToggleColumn = (key: string) => {
      setHiddenColumns(prev => {
          const newSet = new Set(prev);
          if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
          return newSet;
      });
  };

  const diffJson = useMemo(() => (viewMode === 'diff' && originalJson) ? unflattenJSON(originalJson, flatRows) : null, [viewMode, originalJson, flatRows]);

  return (
    <div className={`h-screen flex flex-col font-sans text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 overflow-hidden`}>
      <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <DragDropOverlay onFileDrop={loadJsonData} onNotify={notify} />

      {/* App Header */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl flex items-center justify-between px-6 shadow-sm z-30 relative shrink-0">
        <div className="flex items-center gap-4 animate-in slide-in-from-left-4 fade-in duration-500">
          <SwiftLogo />
          
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-black tracking-tight leading-none mb-1 flex items-baseline gap-1">
              <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-1.5 py-0.5 rounded-sm text-[15px]">JSON</span>
              <span className="bg-gradient-to-r from-[#00f2ff] to-[#ff9500] bg-clip-text text-transparent italic drop-shadow-sm">Spotlight</span>
            </h1>
             <div className="flex items-center gap-2">
               <span className="text-[8px] font-bold text-indigo-600 dark:text-[#00f2ff] uppercase tracking-[0.3em] bg-indigo-50 dark:bg-[#00f2ff]/10 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-[#00f2ff]/20">SWIFT EDITOR</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 animate-in slide-in-from-right-4 fade-in duration-500">
          {!originalJson ? (
             <div className="flex items-center gap-2">
                <button onClick={() => setIsPasteModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700 text-xs font-semibold shadow-sm">
                    <Clipboard size={14} /> <span>粘贴文本</span>
                </button>
                <button onClick={openFileSelector} className="group flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg shadow-zinc-900/10 text-xs font-semibold">
                    <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" /> <span>导入 JSON 文件</span>
                </button>
             </div>
          ) : (
            <>
               <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                  <button onClick={() => setViewMode('edit')} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}>
                    <TableProperties size={14} /> 数据
                  </button>
                  <button onClick={() => setViewMode('diff')} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${viewMode === 'diff' ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}>
                    <RotateCcw size={14} /> 变更
                  </button>
               </div>

               <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

               <div className="flex items-center gap-1">
                   <button onClick={handleUndo} disabled={historyIndex <= 0} className={`p-2 rounded-lg transition-colors ${historyIndex > 0 ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600' : 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'}`} title="撤销 (Ctrl+Z)">
                        <Undo size={16} />
                   </button>
                   <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`p-2 rounded-lg transition-colors ${historyIndex < history.length - 1 ? 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600' : 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'}`} title="重做 (Ctrl+Shift+Z)">
                        <Redo size={16} />
                   </button>
               </div>

               <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

               {viewMode === 'edit' && (
                   <>
                       <ColumnVisibilityDropdown columns={columns} hiddenColumns={hiddenColumns} onToggleColumn={handleToggleColumn} onShowAll={() => setHiddenColumns(new Set())} onHideAll={() => setHiddenColumns(new Set(columns.map(c => c.key)))} />
                       <button onClick={() => setIsTypeSelectorEnabled(!isTypeSelectorEnabled)} className={`p-2 rounded-lg transition-all border ${isTypeSelectorEnabled ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white border-zinc-200 dark:border-zinc-600' : 'border-transparent text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100'}`} title={isTypeSelectorEnabled ? "类型选择器: 开" : "类型选择器: 关"}>
                           <Type size={16} strokeWidth={2.5} />
                       </button>
                   </>
               )}

               <button onClick={openFileSelector} className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="导入新文件">
                  <FolderOpen size={18} />
               </button>

               <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-[#00f2ff]/80 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 shadow-lg shadow-indigo-500/30 transition-all active:scale-95 text-xs font-bold border border-transparent">
                 <Download size={14} /> <span>导出</span>
               </button>
            </>
          )}
          
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          
          <button onClick={() => setIsHelpModalOpen(true)} className="p-2 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-[#00f2ff] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="帮助与指南">
             <HelpCircle size={18} />
          </button>

          <button onClick={toggleTheme} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-zinc-50/50 dark:bg-zinc-950">
        {!originalJson ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500">
             <div className="relative group">
                {/* Visual anchor referencing the logo design */}
                <div className="absolute -inset-8 bg-gradient-to-r from-[#00f2ff]/30 via-[#0066ff]/20 to-[#ff9500]/30 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative w-28 h-28 bg-white dark:bg-zinc-900 rounded-3xl flex items-center justify-center shadow-2xl border border-zinc-100 dark:border-zinc-800 ring-1 ring-black/5 group-hover:scale-[1.03] transition-transform duration-500">
                   <svg viewBox="0 0 40 40" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <defs>
                       <linearGradient id="landing-prism-grad" x1="6" y1="20" x2="34" y2="20" gradientUnits="userSpaceOnUse">
                         <stop offset="0%" stopColor="#00f2ff" />
                         <stop offset="50%" stopColor="#0066ff" />
                         <stop offset="100%" stopColor="#ff9500" />
                       </linearGradient>
                     </defs>
                     <path d="M20 6 L6 20 L20 34 Z" fill="#00f2ff" opacity="0.2" />
                     <path d="M20 6 L34 20 L20 34 Z" fill="#ff9500" opacity="0.2" />
                     <path d="M20 6 L34 20 L20 34 L6 20 Z" stroke="url(#landing-prism-grad)" strokeWidth="1.2" strokeLinejoin="round" />
                     <line x1="20" y1="6" x2="20" y2="34" stroke="white" strokeWidth="0.8" opacity="0.2" />
                     <path d="M13 14 L17 20 L13 26" stroke="#00f2ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                     <path d="M27 14 L23 20 L27 26" stroke="#ff9500" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                     <rect x="17" y="17" width="3" height="3" rx="0.5" fill="#00f2ff" opacity="0.5" />
                     <rect x="21" y="17" width="3" height="3" rx="0.5" fill="#0066ff" opacity="0.4" />
                     <rect x="17" y="21" width="3" height="3" rx="0.5" fill="#0066ff" opacity="0.4" />
                     <rect x="21" y="21" width="3" height="3" rx="0.5" fill="#ff9500" opacity="0.5" />
                     <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.85" />
                   </svg>
                </div>
             </div>
             <h2 className="mt-8 text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">未加载数据集</h2>
             <p className="mt-3 text-zinc-500 dark:text-zinc-400 max-w-sm text-center text-sm leading-relaxed">导入 JSON 文件或粘贴文本以开始。变更将实时在“变更”面板中生成对比。</p>
             <div className="mt-8 flex gap-4">
                 <button onClick={() => setIsPasteModalOpen(true)} className="px-6 py-2.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm border border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                    <Clipboard size={16} /> 粘贴文本
                 </button>
                 <button onClick={openFileSelector} className="px-6 py-2.5 bg-indigo-600 dark:bg-[#00f2ff] text-white dark:text-zinc-900 text-sm font-semibold rounded-lg hover:translate-y-[-1px] transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2">
                    <Upload size={16} /> 选择文件
                 </button>
             </div>
             <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">或拖放文件到窗口任意位置</p>
          </div>
        ) : (
          <>
            {viewMode === 'edit' && (
               <div className="h-full overflow-auto custom-scrollbar relative bg-white dark:bg-zinc-950 animate-in fade-in duration-500" ref={scrollContainerRef} onScroll={handleScroll}>
                 <table className="border-collapse table-fixed text-sm min-w-full" style={{ width: 'max-content' }}>
                   <thead className="sticky top-0 z-20 shadow-sm shadow-zinc-900/5">
                     <tr>
                        <th className="border-b border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 w-10 text-center p-0 sticky top-0 z-30 h-10">
                            <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-indigo-600 flex items-center justify-center w-full h-full">
                                {isAllSelected ? <SquareCheck size={16} className="text-indigo-600"/> : <Square size={16} />}
                            </button>
                        </th>
                        <th className="border-b border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 w-12 text-center text-[10px] text-zinc-500 font-semibold sticky top-0 z-30 h-10 uppercase tracking-wider">#</th>
                        {visibleColumns.map((col) => {
                             const colWidth = columnWidths[col.key] || DEFAULT_COL_WIDTH;
                             const allPossibleOptions = Array.from(new Set(flatRows.map(r => r[col.key]))).sort();
                             const activeSet = activeFilters[col.key] || new Set(allPossibleOptions);
                             const isFiltered = activeSet.size !== allPossibleOptions.length;
                             return (
                               <th key={col.key} className={`border-b border-r border-zinc-200 dark:border-zinc-800 text-left sticky top-0 z-30 h-10 transition-colors group relative ${col.isParent ? 'bg-amber-50/80 dark:bg-amber-950/30' : 'bg-zinc-50 dark:bg-zinc-900'}`} style={{ width: colWidth }}>
                                 <div className="flex items-center justify-between px-3 w-full h-full">
                                   <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                                       <span className={`truncate font-semibold text-xs ${isFiltered ? 'text-indigo-600' : 'text-zinc-700 dark:text-zinc-300'}`}>{col.key}</span>
                                       {col.isParent && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="父级共享属性"></div>}
                                   </div>
                                   <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded p-0.5 border border-zinc-100 dark:border-zinc-700 ${activeMenuColumn === col.key ? 'opacity-100' : ''}`}>
                                      <button title="批量编辑" onClick={() => setBulkEditCol(col.key)} className="text-zinc-400 hover:text-indigo-600 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"><Pencil size={11} /></button>
                                      <FilterDropdown columnKey={col.key} options={getOptionsForColumn(col.key)} allPossibleOptions={allPossibleOptions} activeSelection={activeSet} onApply={handleFilterChange} activeMenuColumn={activeMenuColumn} onOpenChange={(isOpen) => setActiveMenuColumn(isOpen ? col.key : null)} />
                                   </div>
                                 </div>
                                 <div className="absolute -right-2 top-0 h-full w-4 cursor-col-resize z-50 flex justify-center items-center group/resizer" onMouseDown={(e) => handleResizeStart(e, col.key)}>
                                    <div className="w-[2px] h-4 bg-indigo-500 opacity-0 group-hover/resizer:opacity-100 transition-opacity rounded-full"></div>
                                 </div>
                               </th>
                             );
                        })}
                     </tr>
                   </thead>
                   <tbody className="bg-white dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                     {filteredRows.length === 0 ? (
                        <tr><td colSpan={visibleColumns.length + 2} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4 text-zinc-400 animate-in zoom-in-95 duration-300">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full"><Filter size={24}/></div>
                                <span className="font-medium">未找到符合条件的记录</span>
                                <button onClick={() => setActiveFilters({})} className="text-indigo-600 text-sm hover:underline font-medium">重置所有筛选</button>
                            </div>
                        </td></tr>
                     ) : (
                        <>
                          {paddingTop > 0 && <tr style={{ height: paddingTop }}><td colSpan={visibleColumns.length + 2} /></tr>}
                          {visibleRows.map((row, idx) => {
                             const actualIdx = visibleRange.startIndex + idx;
                             const isSelected = selectedRowIds.has(row._id);
                             return (
                               <tr key={row._id} className={`group h-[40px] transition-colors duration-200 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20'}`}>
                                 <td className={`border-r border-zinc-200 dark:border-zinc-800 text-center p-0`}>
                                    <button onClick={() => toggleRow(row._id)} className="text-zinc-300 dark:text-zinc-700 hover:text-indigo-600 w-full h-full flex items-center justify-center">
                                        {isSelected ? <SquareCheck size={16} className="text-indigo-600"/> : <Square size={16} />}
                                    </button>
                                 </td>
                                 <td className={`border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/20 text-center text-[10px] text-zinc-400 p-0 tabular-nums flex items-center justify-center h-[40px]`}>{actualIdx + 1}</td>
                                 {visibleColumns.map((col) => (
                                   <td key={col.key} className={`border-r border-zinc-200 dark:border-zinc-800 text-xs p-0 h-[40px] relative ${col.isParent ? 'bg-amber-50/10' : ''}`}>
                                     <EditableCell initialValue={row[col.key]} onChange={(newVal) => handleCellChange(row._id, col.key, newVal)} showTypeSelector={isTypeSelectorEnabled} />
                                   </td>
                                 ))}
                               </tr>
                             );
                           })}
                           {paddingBottom > 0 && <tr style={{ height: paddingBottom }}><td colSpan={visibleColumns.length + 2} /></tr>}
                        </>
                     )}
                   </tbody>
                 </table>
               </div>
            )}
            {viewMode === 'diff' && (
                <div className="h-full p-6 bg-zinc-50 dark:bg-zinc-950 flex flex-col animate-in fade-in duration-300">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Sparkles size={18} className="text-indigo-600" /> 审查变更对比</h3>
                      <div className="text-xs font-medium text-zinc-500 flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> 原始数据</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 修改结果</div>
                      </div>
                   </div>
                   {diffJson ? <JsonDiff original={originalJson} modified={diffJson} isDarkMode={isDarkMode} /> : <div>准备对比中...</div>}
                </div>
            )}
          </>
        )}
      </main>

      {/* Status Bar */}
      {originalJson && (
        <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between text-[11px] text-zinc-500 z-20 shrink-0 h-[40px] animate-in slide-in-from-bottom-2 duration-500">
           <div className="flex items-center gap-6 font-medium">
              <div className="flex items-center gap-2">
                  <FileJson size={12} className="text-zinc-400"/>
                  <span className="max-w-[200px] truncate text-zinc-700 dark:text-zinc-300">{fileName || '未命名.json'}</span>
              </div>
              <span>总数: <strong className="text-zinc-900 dark:text-white">{filteredRows.length}</strong></span>
              {selectedRowIds.size > 0 && <span>已选: <strong className="text-indigo-600">{selectedRowIds.size}</strong></span>}
           </div>
           <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <span>所有更改已在历史队列中就绪</span>
           </div>
        </footer>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-12 right-6 z-[100] flex flex-col gap-2">
          {notifications.map(n => (
              <div key={n.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-full fade-in duration-300 ${
                  n.type === 'success' ? 'bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                  n.type === 'error' ? 'bg-white dark:bg-zinc-900 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400'
              }`}>
                  {n.type === 'success' && <CheckCircle2 size={16} />}
                  {n.type === 'error' && <AlertCircle size={16} />}
                  {n.type === 'info' && <Info size={16} />}
                  <span className="text-xs font-bold">{n.message}</span>
              </div>
          ))}
      </div>

      <BulkEditModal isOpen={!!bulkEditCol} onClose={() => setBulkEditCol(null)} columnName={bulkEditCol || ''} affectedRowCount={selectedRowIds.size > 0 ? selectedRowIds.size : filteredRows.length} onSave={handleBulkEdit} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} fileName={fileName} originalJson={originalJson} fullFlatRows={flatRows} columns={columns} hiddenColumns={hiddenColumns} onNotify={notify} />
      <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onImport={loadJsonData} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}

export default App;
