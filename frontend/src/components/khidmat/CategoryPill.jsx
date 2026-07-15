// ============================================================
// components/khidmat/CategoryPill.jsx
// Category display with bilingual support using existing utilities
// ============================================================

import React from 'react';
import { useDonations } from '../../context/DonationContext';
import { 
  getCategoryUrdu, 
  getCategoryBilingual, 
  urduClass,
  hasCategoryUrdu 
} from '../../utils/categoryDisplay.js';

const CategoryPill = ({ categoryId, categoryFromRecord, showBoth = true }) => {
  const { activeCategories } = useDonations();
  const cat = activeCategories.find(c => c.id === categoryId) || categoryFromRecord;
  
  if (!cat) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const urduName = getCategoryUrdu(cat);
  const englishName = cat.name || '';
  const hasUrdu = hasCategoryUrdu(cat);

  // If no Urdu name or same as English, just show English
  if (!hasUrdu || !showBoth) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <span 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: cat.color || '#3b82f6' }} 
        />
        {englishName}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start">
      {/* English with color dot */}
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <span 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: cat.color || '#3b82f6' }} 
        />
        {englishName}
      </span>
      {/* Urdu (RTL) */}
      <span 
        className={`text-[10px] text-slate-400 ${urduClass(urduName)}`} 
        dir="rtl"
      >
        {urduName}
      </span>
    </span>
  );
};

// Inline version with separator "/"
export const CategoryPillInline = ({ categoryId, categoryFromRecord }) => {
  const { activeCategories } = useDonations();
  const cat = activeCategories.find(c => c.id === categoryId) || categoryFromRecord;
  
  if (!cat) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const displayName = getCategoryBilingual(cat);
  const hasUrdu = hasCategoryUrdu(cat);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 ${urduClass(displayName)}`} 
          dir={hasUrdu ? 'rtl' : 'ltr'}>
      <span 
        className="w-2 h-2 rounded-full flex-shrink-0" 
        style={{ backgroundColor: cat.color || '#3b82f6' }} 
      />
      {displayName}
    </span>
  );
};

export default CategoryPill;