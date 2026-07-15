// ============================================================
// middlewares/cors-pdf.js
// CORS middleware specifically for PDF endpoints
// ============================================================

export const corsPdfMiddleware = (req, res, next) => {
  // Set CORS headers for PDF responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Disposition');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};