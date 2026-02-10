import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (...allowedRoles: string[]): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;
        console.log('User role:', user?.role);

        if (!user || !allowedRoles.includes(user.role)) {
            res.status(403).json({ message: 'Access Denied!' });
            return;
        }
        next();
    };
};