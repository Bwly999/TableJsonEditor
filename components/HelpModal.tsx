import * as React from 'react';
import { X, Command, MousePointerClick, Type, Filter, Pencil, RotateCcw, Download } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const FeatureItem = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
        <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg h-fit text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-zinc-900/5 dark:ring-white/10">
            <Icon size={20} />
        </div>
        <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[700px] max-w-[95vw] h-[80vh] flex flex-col border border-zinc-200 dark:border-zinc-800 ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">User Guide</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Master the JSON Spotlight Editor</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-8">
                
                <section>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">Core Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FeatureItem 
                            icon={Type} 
                            title="Context-Aware Types" 
                            desc="Click into any cell to edit. Use the floating 'T' toolbar to strictly enforce types (String, Number, Boolean, Null) to prevent data corruption." 
                        />
                        <FeatureItem 
                            icon={Pencil} 
                            title="Bulk Editing" 
                            desc="Hover over a column header and click the Pencil icon to update all visible rows at once. Supports type forcing as well." 
                        />
                        <FeatureItem 
                            icon={Filter} 
                            title="Smart Filtering" 
                            desc="Click the filter icon on headers to search, regex match, or select specific values. Filters stack across columns." 
                        />
                        <FeatureItem 
                            icon={Download} 
                            title="Export to Excel" 
                            desc="Export your filtered view to standard JSON or Excel (.xlsx). Excel export supports cell merging for cleaner reports." 
                        />
                    </div>
                </section>

                <section>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">Shortcuts & Tips</h4>
                    <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Command size={100} />
                        </div>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                            <div>
                                <span className="text-xs text-zinc-400 uppercase tracking-wide font-bold block mb-1">Undo</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-sm">Ctrl</kbd> + <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-sm">Z</kbd>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-400 uppercase tracking-wide font-bold block mb-1">Redo</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-sm">Ctrl</kbd> + <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-sm">Shift</kbd> + <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-sm">Z</kbd>
                                </div>
                            </div>
                             <div>
                                <span className="text-xs text-zinc-400 uppercase tracking-wide font-bold block mb-1">Save Cell</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-sm">Enter</kbd>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-400 uppercase tracking-wide font-bold block mb-1">Cancel Edit</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-sm">Esc</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                 <section>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">Views</h4>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            <div className="p-1.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded mt-0.5">
                                <RotateCcw size={16} />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-zinc-900 dark:text-white">Changes View</span>
                                <p className="text-xs text-zinc-500 mt-1">Switch to 'Changes' tab to see a visual Diff of your edits compared to the original file.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            <div className="p-1.5 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded mt-0.5">
                                <MousePointerClick size={16} />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-zinc-900 dark:text-white">Parent Properties</span>
                                <p className="text-xs text-zinc-500 mt-1">Columns highlighted in yellow represent properties shared by parent objects. Editing one updates all children.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;