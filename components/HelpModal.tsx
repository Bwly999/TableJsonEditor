import * as React from 'react';
import { X, Command, MousePointerClick, Type, Filter, Pencil, RotateCcw, Download, ClipboardList, Database, ShieldCheck } from 'lucide-react';

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
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[720px] max-w-[95vw] h-[80vh] flex flex-col border border-zinc-200 dark:border-zinc-800 ring-1 ring-black/5 animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Database className="text-white" size={16} /></div>
               使用指南 & 帮助
            </h3>
            <p className="text-xs text-zinc-500 mt-1">助力高效处理复杂 JSON 嵌套结构</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-10">
                
                <section>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4 px-1">核心编辑能力</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FeatureItem 
                            icon={Type} 
                            title="精准类型控制" 
                            desc="点击单元格即可编辑。工具栏支持强制指定 String, Number, Boolean 或 Null，确保在导出回 JSON 时保持数据结构的严谨性。" 
                        />
                         <FeatureItem 
                            icon={ClipboardList} 
                            title="粘贴即导入" 
                            desc="支持直接从剪贴板粘贴 JSON 内容，编辑器会自动识别层级并展平为表格，方便快速查看分析。" 
                        />
                        <FeatureItem 
                            icon={Pencil} 
                            title="批量同名覆盖" 
                            desc="点击列标题铅笔图标可批量修改当前选中的记录。系统会自动识别嵌套路径，确保覆盖操作精准无误。" 
                        />
                         <FeatureItem 
                            icon={ShieldCheck} 
                            title="数据一致性保证" 
                            desc="导出 JSON 与 Excel 时，系统都会基于完整修改历史输出全部已编辑记录。筛选与选中仅影响界面查看，不会导致导出内容丢失。" 
                        />
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4 px-1">效率手册</h4>
                    <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-zinc-800">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                            <Command size={140} />
                        </div>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                            <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-black block mb-2">撤销变更</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs shadow-inner">Ctrl</kbd> + <kbd className="bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs shadow-inner">Z</kbd>
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-black block mb-2">重做变更</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs shadow-inner">Ctrl</kbd> + <kbd className="bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs shadow-inner">Shift</kbd> + <kbd className="bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs shadow-inner">Z</kbd>
                                </div>
                            </div>
                             <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-black block mb-2">保存当前单元格</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-zinc-800 px-4 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs shadow-inner">Enter</kbd>
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-black block mb-2">丢弃当前编辑</span>
                                <div className="flex items-center gap-2">
                                    <kbd className="bg-zinc-800 px-4 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs shadow-inner">Esc</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                 <section>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4 px-1">可视化工具</h4>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                <RotateCcw size={18} />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-zinc-900 dark:text-white">实时变更 Diff</span>
                                <p className="text-xs text-zinc-500 mt-1">顶部切换至“变更”面板，即可在代码层面查看修改前后的 JSON 文本差异。系统会自动定位差异点。</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                                <MousePointerClick size={18} />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-zinc-900 dark:text-white">父级/共享属性识别</span>
                                <p className="text-xs text-zinc-500 mt-1">背景色较深的列代表多行数据共享同一个父级属性。修改此类单元格会同步更新所有关联记录。</p>
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
