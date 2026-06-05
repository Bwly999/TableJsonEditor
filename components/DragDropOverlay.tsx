import { useState, useRef, useEffect } from 'react';
import { FileJson } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface DragDropOverlayProps {
  onFileDrop: (json: any, fileName: string) => void;
  onNotify: (message: string, type: NotificationType) => void;
}

export default function DragDropOverlay({ onFileDrop, onNotify }: DragDropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        dragCounterRef.current++;
        if (dragCounterRef.current === 1) setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const jsonFile = Array.from(files).find(
        f => f.name.endsWith('.json') || f.type === 'application/json'
      );
      if (!jsonFile) {
        onNotify('请拖放 .json 格式的文件', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (readEvent) => {
        try {
          const json = JSON.parse(readEvent.target?.result as string);
          onFileDrop(json, jsonFile.name);
        } catch {
          onNotify('文件内容不是有效的 JSON 格式', 'error');
        }
      };
      reader.readAsText(jsonFile);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
      dragCounterRef.current = 0;
    };
  }, [onFileDrop, onNotify]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none">
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
        <div className="w-64 h-56 rounded-2xl border-2 border-dashed border-indigo-400/50 dark:border-[#00f2ff]/50 bg-white/10 dark:bg-zinc-900/20 flex flex-col items-center justify-center gap-4 shadow-2xl backdrop-blur-md">
          <FileJson size={48} className="text-indigo-600 dark:text-[#00f2ff]" />
          <span className="text-lg font-bold text-zinc-900 dark:text-white">拖放 JSON 文件</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">释放以导入数据集</span>
        </div>
      </div>
    </div>
  );
}