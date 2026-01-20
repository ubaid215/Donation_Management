export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[+\s-]/g, ''));
};

export const isValidAmount = (amount) => {
  return !isNaN(amount) && parseFloat(amount) > 0;
};

export const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  
  return text
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 1000); // Limit length
};