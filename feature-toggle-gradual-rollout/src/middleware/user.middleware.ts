import { Request, Response, NextFunction } from 'express'
import { User } from '../types/feature-toggle'

export type RequestWithUser = Request & { user: User }

// Middleware to extract user information from headers or JWT
export function extractUserMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Type assertion to RequestWithUser since we're about to add the user property
  const reqWithUser = req as RequestWithUser
  // In a real application, you would extract user info from JWT token
  // For demo purposes, using headers

  const user: User = {
    id: (req.headers['x-user-id'] as string) || `user_${Math.random().toString(36).substr(2, 9)}`,
    email: (req.headers['x-user-email'] as string) || 'demo@example.com',
    role: (req.headers['x-user-role'] as string) || 'user',
    segment: req.headers['x-user-segment'] as string,
    registrationDate: req.headers['x-user-registration']
      ? new Date(req.headers['x-user-registration'] as string)
      : new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
    metadata: {
      beta_tester: req.headers['x-beta-tester'] === 'true',
      login_count:
        parseInt(req.headers['x-login-count'] as string) || Math.floor(Math.random() * 100),
      subscription: (req.headers['x-subscription'] as string) || 'free',
    },
  }

  // Attach user to request
  reqWithUser.user = user

  next()
}
