import { conn } from '../config/dbConn.js';
import { RowDataPacket } from 'mysql2/promise';

interface UserRecord extends RowDataPacket {
    id: string;
    name: string;
    email: string;
    age?: number;
    mobile?: number;
}

export const getAllUsers = async (): Promise<UserRecord[]> => {
    const [rows] = await conn.execute<UserRecord[]>(
        'SELECT id, name, email, age, mobile FROM users'
    );
    return rows;
};
