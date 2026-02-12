import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { conn } from '../config/dbConn.js';
import { RowDataPacket } from 'mysql2/promise';

interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
    role?: string;
}

interface TokenRow extends RowDataPacket {
    access_token: string;
    user_id: string;
}

export const verifytoken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;
    const authheader = req.headers.authorization || req.headers.Authorization as string;

    if (authheader && authheader.startsWith('Bearer')) {
        token = authheader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No token, Authorization denied!' });
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as TokenPayload;

            const [rows] = await conn.execute<TokenRow[]>(
                'SELECT * FROM auth_tokens WHERE access_token = ? AND user_id = ?',
                [token, decoded.id]
            );

            console.log('Token rows:', rows);
            if (rows.length === 0) {
                res.status(403).json({ message: 'Invalid token' });
                return;
            }

            (req as any).user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || ''
            };
            console.log('Decoded token:', decoded);
            next();
        } catch (err) {
            console.log(err);
            res.status(400).json({
                message: 'Token is not valid'
            });
        }
    }
};

