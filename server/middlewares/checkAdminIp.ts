import { Request, Response, NextFunction } from 'express';

export function checkAdminIp(req: Request, res: Response, next: NextFunction) {
  const clientIp = 
    req.headers['x-forwarded-for'] || 
    req.socket.remoteAddress || 
    '';
  
  const allowedIp='127.0.0.1';
  
  const ipToCheck = Array.isArray(clientIp) 
    ? clientIp[0] 
    : (typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : '');
  
  console.log(`Client IP: ${ipToCheck}, Allowed IP: ${allowedIp}`);
  
  if (ipToCheck === allowedIp) {
    return next();
  }
  
  return res.status(403).json({
    error: 'Access denied. You are not authorized to access this resource.'
  });
}