import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Type, Hash, Binary, Ban } from 'lucide-react';
import { smartParseValue } from '../utils/jsonHelper';
import { Primitive } from '../types';

interface EditableCellProps {
  initialValue: Primitive;
  onChange: (value: Primitive) => void;
  isReadOnly?: boolean;
  showTypeSelector?: boolean;
}

type ValueType = 'string' | 'number' | 'boolean' | 'null';

const EditableCell: React.FC<EditableCellProps> = ({ 
  initialValue, 
  onChange, 
  isReadOnly,
  showTypeSelector = true
}) => {
  // State for the text in the input
  const [text, setText] = useState<string>('');
  // State for explicit user override (null means use smart inference)
  const [forcedType, setForcedType] = useState<ValueType | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize state from props with ambiguity detection
  useEffect(() => {
    const strVal = initialValue === null ? '' : String(initialValue);
    setText(strVal);

    if (initialValue !== null) {
       const inferred = smartParseValue(strVal);
       
       // CRITICAL FIX:
       // Check if the current value's type differs from what smartParseValue would guess.
       // If it differs, we MUST force the type to preserve it.
       // Example: initialValue="123" (string). inferred=123 (number). 
       // We must set forcedType='string' so it doesn't render as a number.
       if (inferred !== initialValue) {
           const actualType = typeof initialValue;
           if (actualType === 'string' || actualType === 'number' || actualType === 'boolean') {
               setForcedType(actualType as ValueType);
               return;
           }
       }
    }
    
    // Otherwise, let smart inference handle it
    setForcedType(null);
  }, [initialValue]);

  // Derived value based on text and forced type
  const derivedResult = useMemo(() => {
    // 1. Explicit Null
    if (forcedType === 'null') {
      return { value: null, type: 'null' as ValueType };
    }

    // 2. Explicit String
    if (forcedType === 'string') {
      return { value: text, type: 'string' as ValueType };
    }

    // 3. Explicit Number
    if (forcedType === 'number') {
      const num = Number(text);
      if (!isNaN(num) && text.trim() !== '') {
        return { value: num, type: 'number' as ValueType };
      }
      // Fallback to string if invalid number
      return { value: text, type: 'string' as ValueType };
    }

    // 4. Explicit Boolean
    if (forcedType === 'boolean') {
       const lower = text.toLowerCase().trim();
       if (lower === 'true') return { value: true, type: 'boolean' as ValueType };
       if (lower === 'false') return { value: false, type: 'boolean' as ValueType };
       // Fallback to string if invalid boolean text
       return { value: text, type: 'string' as ValueType };
    }

    // 5. Default Smart Inference
    const parsed = smartParseValue(text);
    let type: ValueType = 'string';
    if (parsed === null) type = 'null';
    else if (typeof parsed === 'number') type = 'number';
    else if (typeof parsed === 'boolean') type = 'boolean';
    
    return { value: parsed, type };
  }, [text, forcedType]);

  const commitChange = () => {
    if (derivedResult.value !== initialValue) {
      onChange(derivedResult.value);
    }
    // We do NOT reset forcedType here immediately because the parent might re-render 
    // passing the new value back as initialValue. The useEffect above handles the sync.
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); 
    }
    if (e.key === 'Escape') {
      // Revert UI to initial prop
      const strVal = initialValue === null ? '' : String(initialValue);
      setText(strVal);
      setForcedType(null);
      // Re-trigger ambiguity check logic effectively by resetting state, 
      // but easier to just blur and let useEffect reset on re-render or keep logic consistent.
      // Actually, standard behavior is just blur without save.
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitChange();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Helper to determine type color
  const getTypeColor = (t: ValueType) => {
    switch (t) {
      case 'string': return 'text-emerald-600 dark:text-emerald-400';
      case 'number': return 'text-blue-600 dark:text-blue-400';
      case 'boolean': return 'text-purple-600 dark:text-purple-400';
      case 'null': return 'text-rose-500 dark:text-rose-400';
      default: return 'text-zinc-400';
    }
  };

  // Helper to force type on click
  const toggleForceType = (e: React.MouseEvent, type: ValueType) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    if (type === 'null') {
        setText(''); 
    }
    // If clicking same type, strictly enforcing it is fine.
    setForcedType(type);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full h-full group">
      <input
        ref={inputRef}
        type="text"
        className={`w-full h-full px-3 py-1 bg-transparent font-sans tabular-nums focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder-zinc-300 dark:placeholder-zinc-700 text-[13px] leading-relaxed selection:bg-indigo-100 dark:selection:bg-indigo-900/50 ${
          isReadOnly ? 'opacity-75' : ''
        } ${getTypeColor(derivedResult.type)}`}
        style={{ paddingRight: (isFocused && showTypeSelector) ? '84px' : '12px' }} 
        value={text}
        placeholder={forcedType === 'null' ? 'null' : 'null'}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        readOnly={isReadOnly}
      />

      {/* Floating Type Selector Toolbar */}
      {isFocused && !isReadOnly && showTypeSelector && (
        <div 
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-md shadow-sm border border-zinc-200 dark:border-zinc-700 p-0.5 animate-in fade-in zoom-in-95 duration-150 z-10"
            onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus
        >
            <button
                onClick={(e) => toggleForceType(e, 'string')}
                className={`p-1 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors ${derivedResult.type === 'string' ? 'bg-white dark:bg-zinc-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400'}`}
                title="Force String"
            >
                <Type size={12} strokeWidth={2.5} />
            </button>
            <button
                onClick={(e) => toggleForceType(e, 'number')}
                className={`p-1 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors ${derivedResult.type === 'number' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-400'}`}
                title="Force Number"
            >
                <Hash size={12} strokeWidth={2.5} />
            </button>
            <button
                onClick={(e) => toggleForceType(e, 'boolean')}
                className={`p-1 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors ${derivedResult.type === 'boolean' ? 'bg-white dark:bg-zinc-600 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-400'}`}
                title="Force Boolean"
            >
                <Binary size={12} strokeWidth={2.5} />
            </button>
            <button
                onClick={(e) => toggleForceType(e, 'null')}
                className={`p-1 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors ${derivedResult.type === 'null' ? 'bg-white dark:bg-zinc-600 text-rose-500 dark:text-rose-400 shadow-sm' : 'text-zinc-400'}`}
                title="Force Null"
            >
                <Ban size={12} strokeWidth={2.5} />
            </button>
        </div>
      )}
    </div>
  );
};

export default EditableCell;