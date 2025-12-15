import * as React from 'react';
import { useRef, useState } from 'react';
import { DiffEditor, Monaco } from '@monaco-editor/react';
import { ChevronDown, ChevronUp, Map } from 'lucide-react';

interface JsonDiffProps {
  original: any;
  modified: any;
  isDarkMode?: boolean;
}

const JsonDiff: React.FC<JsonDiffProps> = ({ original, modified, isDarkMode = false }) => {
  const originalStr = JSON.stringify(original, null, 2);
  const modifiedStr = JSON.stringify(modified, null, 2);
  
  const diffEditorRef = useRef<any>(null);
  const [changesCount, setChangesCount] = useState(0);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    diffEditorRef.current = editor;
    
    const updateDiffCount = () => {
        const changes = editor.getLineChanges();
        setChangesCount(changes ? changes.length : 0);
    };

    editor.onDidUpdateDiff(updateDiffCount);
    setTimeout(updateDiffCount, 500);
  };

  const navigateDiff = (direction: 'next' | 'prev') => {
    if (!diffEditorRef.current) return;
    
    const editor = diffEditorRef.current;
    const changes = editor.getLineChanges();
    
    if (!changes || changes.length === 0) return;

    const currentPosition = editor.getModifiedEditor().getPosition();
    const currentLine = currentPosition ? currentPosition.lineNumber : 0;

    let targetChange = null;

    if (direction === 'next') {
        targetChange = changes.find((c: any) => c.modifiedStartLineNumber > currentLine);
        if (!targetChange) targetChange = changes[0];
    } else {
        const prevChanges = changes.filter((c: any) => c.modifiedEndLineNumber < currentLine);
        targetChange = prevChanges.length > 0 ? prevChanges[prevChanges.length - 1] : changes[changes.length - 1];
    }

    if (targetChange) {
        editor.getModifiedEditor().revealLineInCenter(targetChange.modifiedStartLineNumber);
        editor.getModifiedEditor().setPosition({ lineNumber: targetChange.modifiedStartLineNumber, column: 1 });
        editor.getOriginalEditor().revealLineInCenter(targetChange.originalStartLineNumber);
    }
  };

  return (
    <div className="h-full w-full flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden relative shadow-sm">
      <div className="absolute top-4 right-6 z-10 flex items-center gap-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur p-1.5 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700">
         <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 px-2 flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-700 mr-1">
            <Map size={14} />
            <strong>{changesCount}</strong> diffs
         </div>
         <button 
            onClick={() => navigateDiff('prev')}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-colors"
            title="Previous"
         >
            <ChevronUp size={16} />
         </button>
         <button 
            onClick={() => navigateDiff('next')}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-colors"
            title="Next"
         >
            <ChevronDown size={16} />
         </button>
      </div>

      <DiffEditor
        original={originalStr}
        modified={modifiedStr}
        language="json"
        theme={isDarkMode ? "vs-dark" : "light"}
        onMount={handleEditorDidMount}
        options={{
          renderSideBySide: true,
          readOnly: true,
          minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
          renderOverviewRuler: true,
          scrollBeyondLastLine: false,
          fontSize: 12,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          wordWrap: 'on',
          diffWordWrap: 'off',
          padding: { top: 16, bottom: 16 },
          automaticLayout: true
        }}
      />
    </div>
  );
};

export default JsonDiff;