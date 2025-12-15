import * as React from 'react';
import { useState, useEffect } from 'react';
import { Download, X, FileJson, FileSpreadsheet, Check, Columns, ArrowRight } from 'lucide-react';
import { ColumnMeta, FlatRow } from '../types';
import { unflattenJSON } from '../utils/jsonHelper';
import { exportToExcel } from '../utils/excelHelper';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  originalJson: any;
  flatRows: FlatRow[];
  columns: ColumnMeta[];
  hiddenColumns: Set<string>;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  fileName,
  originalJson,
  flatRows,
  columns,
  hiddenColumns,
}) => {
  const [format, setFormat] = useState<'json' | 'excel'>('json');
  const [mergeCells, setMergeCells] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  // Initialize selected columns based on visibility
  useEffect(() => {
    if (isOpen) {
      const visible = new Set(columns.filter(c => !hiddenColumns.has(c.key)).map(c => c.key));
      setSelectedColumns(visible);
    }
  }, [isOpen, columns, hiddenColumns]);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    const newSet = new Set(selectedColumns);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedColumns(newSet);
  };

  const handleSelectAll = () => {
      if (selectedColumns.size === columns.length) {
          setSelectedColumns(new Set());
      } else {
          setSelectedColumns(new Set(columns.map(c => c.key)));
      }
  };

  const handleExport = async () => {
    const exportName = fileName.replace(/\.json$/i, '') || 'data';

    if (format === 'json') {
      // JSON Export Logic (Existing)
      const json = unflattenJSON(originalJson, flatRows);
      const jsonStr = JSON.stringify(json, null, 2);
      
      try {
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
      } catch (e) {
        console.error("Export cancelled or failed", e);
      }
    } else {
      // Excel Export Logic
      await exportToExcel({
          fileName: exportName,
          rows: flatRows,
          columns: columns,
          selectedColumns: selectedColumns,
          mergeCells: mergeCells
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[500px] max-w-[95vw] border border-zinc-200 dark:border-zinc-800 ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-white">
                <Download size={20} />
             </div>
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Export Data</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Format Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormat('json')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                format === 'json'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <FileJson size={32} strokeWidth={1.5} />
              <span className="font-semibold text-sm">JSON Structure</span>
            </button>
            <button
              onClick={() => setFormat('excel')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                format === 'excel'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <FileSpreadsheet size={32} strokeWidth={1.5} />
              <span className="font-semibold text-sm">Excel Spreadsheet</span>
            </button>
          </div>

          {/* Excel Options */}
          {format === 'excel' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Merge Same Values</span>
                     <button
                        onClick={() => setMergeCells(!mergeCells)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            mergeCells ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                        >
                        <span
                            className={`inline-block w-4 h-4 transform transition duration-200 ease-in-out bg-white rounded-full mt-1 ml-1 ${
                            mergeCells ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                     </button>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Attempts to merge consecutive vertical cells with identical values. Useful for "Grouped" visual layout.
                  </p>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Columns size={14} /> Columns to Export
                    </span>
                    <button onClick={handleSelectAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        {selectedColumns.size === columns.length ? 'Deselect All' : 'Select All'}
                    </button>
                 </div>
                 <div className="max-h-32 overflow-y-auto custom-scrollbar border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 p-2 grid grid-cols-2 gap-2">
                     {columns.map(col => (
                         <div key={col.key} 
                              className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer select-none"
                              onClick={() => toggleColumn(col.key)}
                         >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedColumns.has(col.key) ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                {selectedColumns.has(col.key) && <Check size={10} className="text-white"/>}
                            </div>
                            <span className="text-xs truncate text-zinc-600 dark:text-zinc-400">{col.key}</span>
                         </div>
                     ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleExport}
                className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transform active:scale-95 transition-all flex items-center gap-2"
            >
                <span>Export {format === 'json' ? 'JSON' : 'Excel'}</span>
                <ArrowRight size={14} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default ExportModal;