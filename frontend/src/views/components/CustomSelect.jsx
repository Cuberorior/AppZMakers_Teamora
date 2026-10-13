import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  label = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value ?? opt.id, label: opt.label ?? opt.name ?? String(opt.value) };
    }
    return { value: String(opt), label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  ) || null;

  useEffect(() => {
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const maxWidth = Math.min(viewportWidth - 16, Math.max(rect.width, 140));
      let left = rect.left;

      if (left + maxWidth > viewportWidth - 8) {
        left = Math.max(8, viewportWidth - maxWidth - 8);
      }
      if (left < 8) {
        left = 8;
      }

      setMenuPosition({
        top: rect.bottom + 6,
        left,
        width: maxWidth,
      });
    };

    updatePosition();
    if (isOpen) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isInsideContainer = containerRef.current && containerRef.current.contains(e.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!isInsideContainer && !isInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (optValue) => {
    if (disabled) return;
    const val = optValue !== undefined && optValue !== null ? optValue : '';
    setIsOpen(false);
    if (onChange) {
      const evt = { target: { value: val }, value: val };
      onChange(evt, val);
    }
  };

  const menu = isOpen && (
    <div
      ref={menuRef}
      className={`fixed bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl py-1.5 z-[9999] max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        width: Math.max(menuPosition.width || 160, 160),
      }}
    >
      {normalizedOptions.length === 0 ? (
        <div className="px-4 py-3 text-xs text-slate-400 font-medium text-center">
          No options available
        </div>
      ) : (
        normalizedOptions.map((opt) => {
          const isSelected = String(opt.value) === String(value);
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-bold text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className="truncate pr-2">{opt.label}</span>
              {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <div className={`relative inline-block w-full overflow-visible ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-10 w-full flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-3.5 py-2.5 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-xs sm:text-sm cursor-pointer transition-all duration-200 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none ${buttonClassName}`}
      >
        <span className="truncate text-left font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {typeof document !== 'undefined' && isOpen ? createPortal(menu, document.body) : null}
    </div>
  );
}
