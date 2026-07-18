import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید...',
  label,
  disabled = false,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm flex items-center justify-between text-right transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-slate-300'}`}
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 max-h-60 overflow-auto custom-scrollbar">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500 text-center">داده‌ای یافت نشد</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="w-full text-right px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center justify-between group transition-colors"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className={`truncate ${value === option.value ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {option.label}
                </span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
