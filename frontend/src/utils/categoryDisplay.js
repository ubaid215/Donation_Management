// Display helpers for bilingual category names

/** Urdu name for khidmat UI (filters, table, forms) */
export const getCategoryUrdu = (cat) => cat?.nameUrdu || cat?.name || ''

/** English reference name (category management page) */
export const getCategoryEnglish = (cat) => cat?.name || ''

/** Bilingual label: "English (اردو)" */
export const getCategoryBilingual = (cat) => {
  if (!cat) return ''
  const en = cat.name || ''
  const ur = cat.nameUrdu
  if (ur && ur !== en) return `${en} (${ur})`
  return en
}
