// ============================================================
// components/khidmat/BilingualName.jsx
// Reusable component for displaying names in both English and Urdu
// Uses existing urduClass utility
// ============================================================

import React from 'react';
import { urduClass } from '../../utils/categoryDisplay.js';

const BilingualName = ({ 
  name, 
  nameUrdu, 
  className = "", 
  showBoth = true,
  englishClassName = "",
  urduClassName = "",
  containerClassName = ""
}) => {
  if (!name) return <span className="text-slate-400 text-sm">—</span>;

  // If no Urdu name or same as English, just show English
  if (!nameUrdu || nameUrdu === name || !showBoth) {
    return (
      <span className={`font-semibold text-slate-800 text-sm ${englishClassName} ${className}`}>
        {name}
      </span>
    );
  }

  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {/* English (LTR) */}
      <span className={`font-semibold text-slate-800 text-sm ${englishClassName}`}>
        {name}
      </span>
      {/* Urdu (RTL) */}
      <span 
        className={`text-xs text-slate-500 ${urduClass(nameUrdu)} ${urduClassName}`} 
        dir="rtl"
      >
        {nameUrdu}
      </span>
    </div>
  );
};

// Inline version with separator
export const BilingualNameInline = ({ 
  name, 
  nameUrdu, 
  className = "",
  separator = " / "
}) => {
  if (!name) return <span className="text-slate-400 text-sm">—</span>;
  
  if (!nameUrdu || nameUrdu === name) {
    return <span className={`font-semibold text-slate-800 text-sm ${className}`}>{name}</span>;
  }

  return (
    <span className={`font-semibold text-slate-800 text-sm ${className}`}>
      {name}
      <span className="text-slate-500 mx-1">{separator}</span>
      <span className={`${urduClass(nameUrdu)} text-slate-600`} dir="rtl">
        {nameUrdu}
      </span>
    </span>
  );
};

export default BilingualName;