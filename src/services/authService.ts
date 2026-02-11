import { conn } from '../config/dbConn.js';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {
    generateAccessToken,
    generateRefreshToken
} from '../auth.js';
import { ulid } from 'ulid';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface UserData {
    name: string;
    email: string;
    age?: number;
    password: string;
    mobile?: string;
    teamId: string;
    roleId: string;
}

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface RefreshTokenData {
    token: string;
}

interface RevokeData {
    userId: string;
}

interface RevokeResponse {
    tokens: number;
    users: number;
}

interface UserRow extends RowDataPacket {
    id: string;
    name: string;
    email: string;
    password: string;
    age?: number;
    mobile?: string;
    roleId: string;
}

interface RoleRow extends RowDataPacket {
    roleName: string;
}

interface TokenUser extends JwtPayload {
    id: string;
    email: string;
    role?: string;
}

let refreshTokens: Array<{ userId: string; token: string }> = [];

export const registerUser = async (userData: UserData): Promise<TokenResponse> => {
    const { name, email, age, password, mobile, teamId, roleId } = userData;

    if (!name || !email || !password || !teamId || !roleId) {
        throw new Error('Missing required fields');
    }

    const connection = await conn.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            throw new Error('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = ulid();

        await connection.execute<ResultSetHeader>(
            'INSERT INTO users (id, name, email, age, password, mobile, roleId) VALUES (?,?,?,?,?,?,?)',
            [userId, name, email, age, hashedPassword, mobile, roleId]
        );

        await connection.execute<ResultSetHeader>(
            'INSERT INTO teams_members (MemberID, TeamID) VALUES (?, ?)',
            [userId, teamId]
        );

        await connection.execute<ResultSetHeader>(
            'INSERT INTO teams_roles (MemberID, roleID) VALUES (?, ?)',
            [userId, roleId]
        );

        const [roleResult] = await connection.execute<RoleRow[]>(
            'SELECT roleName FROM roles WHERE roleID = ?',
            [roleId]
        );

        if (!roleResult || !Array.isArray(roleResult) || roleResult.length === 0) {
            throw new Error('Role not found');
        }

        const roleNameResult = roleResult[0] as RoleRow;
        const roleName = roleNameResult.roleName;

        const tokenUser: TokenUser = {
            id: userId,
            email,
            role: roleName
        };
        const accessToken = generateAccessToken(tokenUser as any);
        const refreshToken = generateRefreshToken(tokenUser as any);

        console.log('Inserting refresh token for user:', userId, 'Token:', refreshToken);
        try {
            await connection.execute<ResultSetHeader>(
                `INSERT INTO auth_tokens (id, user_id, access_token, refresh_token)
   VALUES (?, ?, ?, ?)`,
                [ulid(), userId, accessToken, refreshToken]
            );
            console.log('Refresh token inserted successfully');
        } catch (tokenError: any) {
            console.error('Error inserting refresh token:', tokenError.message);
            console.error('Error Code:', tokenError.code);
            console.error('SQL State:', tokenError.sqlState);
            throw tokenError;
        }

        await connection.commit();
        console.log('Transaction committed successfully');

        refreshTokens.push({
            userId: userId,
            token: refreshToken
        });
        return { accessToken, refreshToken };

    } catch (err: any) {
        await connection.rollback();
        console.error('DB ERROR:', err);
        console.error('SQL Message:', err.sqlMessage);
        console.error('SQL State:', err.sqlState);
        console.error('Error Code:', err.code);
        throw err;
    } finally {
        connection.release();
    }
};

export const loginUser = async (userData: LoginData): Promise<TokenResponse> => {
    const { email, password } = userData;

    if (!email || !password) {
        throw new Error('Please add all fields');
    }

    const [rows] = await conn.execute<UserRow[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    if (rows.length === 0) {
        throw new Error('Invalid credentials');
    }

    const user = rows[0];
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const tokenUser: TokenUser = {
        id: user.id,
        email: user.email
    };
    const accessToken = generateAccessToken(tokenUser as any);
    const refreshToken = generateRefreshToken(tokenUser as any);

    console.log('Inserting refresh token for user:', user.id, 'Token:', refreshToken);
    try {
        // await conn.execute<ResultSetHeader>(
        //     'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
        //     [user.id, refreshToken]
        // );
        await conn.execute<ResultSetHeader>(
            `INSERT INTO auth_tokens (id, user_id, access_token, refresh_token)
   VALUES (?, ?, ?, ?)`,
            [ulid(), user.id, accessToken, refreshToken]
        );
        console.log('Refresh token inserted successfully');
    } catch (insertError: any) {
        console.error('Error inserting refresh token:', insertError.message);
        console.error('Error Code:', insertError.code);
        console.error('SQL State:', insertError.sqlState);
        throw insertError;
    }

    console.log('Access token', accessToken);
    console.log('Refresh token', refreshToken);
    refreshTokens.push({
        userId: user.id,
        token: refreshToken
    });

    console.log(refreshTokens);
    return { accessToken, refreshToken };
};

export const refreshToken = async (userData: RefreshTokenData): Promise<string> => {
    const { token } = userData;

    if (!token) throw new Error('NO_TOKEN');

    const [rows] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM refresh_tokens WHERE token = ?',
        [token]
    );

    if (!rows.length) throw new Error('INVALID_TOKEN');

    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string, (err, user) => {
            if (err) return reject(new Error('FORBIDDEN'));

            const decoded = user as TokenUser;
            const accessToken = generateAccessToken({
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            } as any);

            resolve(accessToken);
        });
    });
};

export const revokeUser = async ({ userId }: RevokeData): Promise<RevokeResponse> => {
    console.log('Revoking userId:', userId);

    const connection = await conn.getConnection();
    try {
        await connection.beginTransaction();

        console.log('Deleting refresh token rows for user:', userId);
        const [delTokens] = await connection.execute<ResultSetHeader>(
            'DELETE FROM refresh_tokens WHERE user_id = ?',
            [userId]
        );

        console.log('Deleting user row:', userId);
        const [delUser] = await connection.execute<ResultSetHeader>(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        await connection.commit();

        refreshTokens = refreshTokens.filter(rt => rt.userId !== userId);

        return { tokens: delTokens.affectedRows, users: delUser.affectedRows };
    } catch (error) {
        await connection.rollback();
        console.error('Error revoking user, transaction rolled back:', error);
        throw error;
    } finally {
        connection.release();
    }
};
