import jwt from 'jsonwebtoken';

interface TokenUser {
    id: string;
    email: string;
    role: string;
}

export const generateAccessToken = (user: TokenUser): string => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET as string, {
        expiresIn: process.env.TIMEGENERATEACCESS
    } as any);
};

export const generateRefreshToken = (user: TokenUser): string => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET as string, {
        expiresIn: process.env.TIMEGENERATEREFRESH
    } as any);
};


