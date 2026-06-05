import * as React from 'react';
import { useState, useEffect } from 'react';
import { Download, X, FileJson, FileSpreadsheet, Check, Columns, ArrowRight, TableProperties, Layers } from 'lucide-react';
import { ColumnMeta, FlatRow } from '../types';
import { unflattenJSON } from '../utils/jsonHelper';
import { exportToExcel } from '../utils/excelHelper';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  originalJson: any;
  fullFlatRows: FlatRow[];      // Always the complete dataset with edits
  filteredFlatRows: FlatRow[];  // Current view rows
  selectedFlatRows: FlatRow[];  // Only selected rows
  columns: ColumnMeta[];
  hiddenColumns: Set<string>;
  onNotify: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  fileName,
  originalJson,
  fullFlatRows,
  filteredFlatRows,
  selectedFlatRows,
  columns,
  hiddenColumns,
  onNotify,
}) => {
  const [format, setFormat] = useState<'json' | 'excel'>('json');
  const [scope, setScope] = useState<'all' | 'filtered' | 'selected'>('all');
  const [mergeCells, setMergeCells] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const visible = new Set(columns.filter(c => !hiddenColumns.has(c.key)).map(c => c.key));
      setSelectedColumns(visible);
      // Auto-set scope if something is selected
      if (selectedFlatRows.length > 0) setScope('selected');
      else if (filteredFlatRows.length !== fullFlatRows.length) setScope('filtered');
      else setScope('all');
    }
  }, [isOpen, columns, hiddenColumns, selectedFlatRows.length, filteredFlatRows.length, fullFlatRows.length]);

  if (!isOpen) return null;

  const handleExport = async () => {
    const exportName = fileName.replace(/\.json$/i, '') || 'data';
    const activeRows = scope === 'selected' ? selectedFlatRows : scope === 'filtered' ? filteredFlatRows : fullFlatRows;

    try {
      if (format === 'json') {
        // IMPORTANT: For JSON, if scope is 'all', we output the full reconstructed JSON.
        // If it's a sub-scope, we still need unflattenJSON to handle it, but it will
        // result in a JSON where only those rows are updated compared to original.
        // Usually, a user wants to export their WHOLE progress when exporting JSON.
        const targetRows = scope === 'all' ? fullFlatRows : activeRows;
        const json = unflattenJSON(originalJson, targetRows);
        const jsonStr = JSON.stringify(json, null, 2);
        
        // Use modern API if available
        // @ts-ignore
        if (window.showSaveFilePicker) {
            // @ts-ignore
            const handle = await window.showSaveFilePicker({
                suggestedName: `${exportName}.json`,
                types: [{ description: 'JSON File', accept: {'application/json': ['.json']} }],
            });
            const writable = await handle.createWritable();
            await writable.write(jsonStr);
            await writable.close();
        } else {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportName}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        onNotify('JSON 文件导出成功', 'success');
      } else {
        await exportToExcel({
            fileName: exportName,
            rows: activeRows,
            columns: columns,
            selectedColumns: selectedColumns,
            mergeCells: mergeCells
        });
        onNotify('Excel 表格导出成功', 'success');
      }
      onClose();
    } catch (e) {
      onNotify('导出失败，请重试', 'error');
      console.error("Export error:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[520px] max-w-[95vw] border border-zinc-200 dark:border-zinc-800 ring-1 ring-black/5 animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Download size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">导出配置</h3>
                <p className="text-xs text-zinc-500">选择您需要的格式与范围</p>
             </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setFormat('json')} className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${format === 'json' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
              <FileJson size={32} strokeWidth={1.5} /> <span className="font-bold text-sm">JSON 结构</span>
            </button>
            <button onClick={() => setFormat('excel')} className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${format === 'excel' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
              <FileSpreadsheet size={32} strokeWidth={1.5} /> <span className="font-bold text-sm">Excel 表格</span>
            </button>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">导出范围</label>
             <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setScope('all')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${scope === 'all' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'}`}>
                   全部 ({fullFlatRows.length})
                </button>
                <button onClick={() => setScope('filtered')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${scope === 'filtered' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'}`}>
                   当前视图 ({filteredFlatRows.length})
                </button>
                <button onClick={() => setScope('selected')} disabled={selectedFlatRows.length === 0} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${scope === 'selected' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'}`}>
                   选中项 ({selectedFlatRows.length})
                </button>
             </div>
             {format === 'json' && scope !== 'all' && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                   提示: 导出部分范围的 JSON 会基于原始文件进行覆盖更新。为确保完整修改，建议选择“全部”。
                </p>
             )}
          </div>

          {format === 'excel' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 border-t border-zinc-100 dark:border-zinc-800 pt-6">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-0.5">
                     <span className="text-sm font-bold text-zinc-900 dark:text-white">智能合并单元格</span>
                     <p className="text-[10px] text-zinc-500">连续垂直的相同值将进行物理合并，保持 Excel 整洁。</p>
                  </div>
                  <button onClick={() => setMergeCells(!mergeCells)} className={`relative w-10 h-5 rounded-full transition-colors ${mergeCells ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                    <span className={`inline-block w-3.5 h-3.5 transform transition bg-white rounded-full mt-0.5 ml-0.5 ${mergeCells ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">选择导出列</span>
                    <button onClick={() => setSelectedColumns(selectedColumns.size === columns.length ? new Set() : new Set(columns.map(c => c.key)))} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        {selectedColumns.size === columns.length ? '取消全选' : '全选'}
                    </button>
                 </div>
                 <div className="max-h-24 overflow-y-auto custom-scrollbar border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-3 grid grid-cols-2 gap-2">
                     {columns.map(col => (
                         <div key={col.key} className="flex items-center gap-2 p-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer select-none" onClick={() => {
                             const n = new Set(selectedColumns);
                             if (n.has(col.key)) n.delete(col.key); else n.add(col.key);
                             setSelectedColumns(n);
                         }}>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${selectedColumns.has(col.key) ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                {selectedColumns.has(col.key) && <Check size={10} className="text-white"/>}
                            </div>
                            <span className="text-[11px] truncate text-zinc-700 dark:text-zinc-400">{col.key}</span>
                         </div>
                     ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">取消</button>
            <button onClick={handleExport} className={`px-6 py-2.5 text-xs font-black rounded-xl shadow-xl transform active:scale-95 transition-all flex items-center gap-2 ${format === 'json' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-zinc-900/20' : 'bg-indigo-600 text-white shadow-indigo-500/30'}`}>
                <span>执行导出 ({scope === 'all' ? '完整数据' : '选定内容'})</span>
                <ArrowRight size={14} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default ExportModal;