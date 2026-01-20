/**
 * Parse query parameters to correct types
 */
export const parseQueryParams = (query) => {
  const parsed = { ...query };
  
  // Convert pagination parameters
  if (parsed.page !== undefined) {
    parsed.page = parseInt(parsed.page, 10) || 1;
  }
  
  if (parsed.limit !== undefined) {
    parsed.limit = parseInt(parsed.limit, 10) || 20;
    // Limit maximum page size
    parsed.limit = Math.min(parsed.limit, 100);
  }
  
  // Convert boolean strings - handle empty strings
  if (parsed.isActive !== undefined) {
    if (parsed.isActive === '' || parsed.isActive === null || parsed.isActive === undefined) {
      delete parsed.isActive; // Remove if empty
    } else {
      parsed.isActive = parsed.isActive === 'true' || parsed.isActive === '1';
    }
  }
  
  // Convert numeric strings
  if (parsed.minAmount !== undefined) {
    parsed.minAmount = parseFloat(parsed.minAmount);
    if (isNaN(parsed.minAmount)) delete parsed.minAmount;
  }
  
  if (parsed.maxAmount !== undefined) {
    parsed.maxAmount = parseFloat(parsed.maxAmount);
    if (isNaN(parsed.maxAmount)) delete parsed.maxAmount;
  }
  
  // Remove empty strings
  Object.keys(parsed).forEach(key => {
    if (parsed[key] === '' || parsed[key] === null || parsed[key] === undefined) {
      delete parsed[key];
    }
  });
  
  return parsed;
};

/**
 * Parse single value to number
 */
export const toNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Parse single value to integer
 */
export const toInt = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Parse single value to boolean
 */
export const toBoolean = (value, defaultValue = null) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'yes';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return Boolean(value);
};

/**
 * Clean query object by removing empty values
 */
export const cleanQuery = (query) => {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};