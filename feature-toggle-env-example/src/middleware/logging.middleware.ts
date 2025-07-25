import { Request, Response, NextFunction } from 'express';
import { FeatureToggle } from './feature-toggle.middleware';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (FeatureToggle.isEnabled('enableApiLogging')) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';

    console.log(`📝 [${timestamp}] ${method} ${url} - ${userAgent}`);

    // Log response time
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      console.log(`📊 [${timestamp}] ${method} ${url} - ${statusCode} (${duration}ms)`);
    });
  }

  next();
}