import { Request, Response, NextFunction } from 'express';

// Admin IP middleware - only allows specified IP address to access admin routes
export function checkAdminIp(req: Request, res: Response, next: NextFunction) {
  // Get client IP address
  const clientIp = 
    req.headers['x-forwarded-for'] || 
    req.socket.remoteAddress || 
    '';
  
  // Check if it's the allowed admin IP
  // const allowedIp = '10.184.6.180';
  const allowedIp='103.27.10.65'; // Replace with your actual admin IP
  // For local development, you might want to allow localhost
  // const allowedIp = '::1'; // IPv6 localhost

  
  // Extract the actual IP from potential comma-separated list or IPv6 format
  const ipToCheck = Array.isArray(clientIp) 
    ? clientIp[0] 
    : (typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : '');
  
  console.log(`Client IP: ${ipToCheck}, Allowed IP: ${allowedIp}`);
  
  if (ipToCheck === allowedIp) {
    // IP address is allowed, proceed to next middleware/route handler
    // Optional: set a flag to indicate admin access
    return next();
  }
  
  // IP address is not allowed, send error response
  return res.status(403).json({
    error: 'Access denied. You are not authorized to access this resource.'
  });
}