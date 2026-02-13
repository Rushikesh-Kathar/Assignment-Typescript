import { conn } from '../config/dbConn.js';
import { RowDataPacket } from 'mysql2/promise';
import { UpdateUserData } from "../types/user.types.js";
import bcrypt from "bcrypt";

export interface UserRecord extends RowDataPacket {
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
export const getUserById = async (id: string): Promise<UserRecord | null> => {
    const connection = await conn.getConnection();

    const [rows] = await connection.execute<UserRecord[]>(
        "SELECT id, name, email, age, mobile, roleId FROM users WHERE id = ?",
        [id]
    );


    return rows.length ? rows[0]! : null;

};

export const updateUserService = async (
    userId: string,
    userData: UpdateUserData
) => {
    const connection = await conn.getConnection();

    try {
        const fields: string[] = [];
        const values: any[] = [];

        if (userData.name) {
            fields.push("name = ?");
            values.push(userData.name);
        }

        if (userData.email) {
            fields.push("email = ?");
            values.push(userData.email);
        }

        if (userData.age) {
            fields.push("age = ?");
            values.push(userData.age);
        }

        if (userData.mobile) {
            fields.push("mobile = ?");
            values.push(userData.mobile);
        }

        if (userData.roleId) {
            fields.push("roleId = ?");
            values.push(userData.roleId);
        }

        if (userData.password) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            fields.push("password = ?");
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            throw new Error("No fields to update");
        }

        const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
        values.push(userId);

        const [result]: any = await connection.execute(query, values);

        if (result.affectedRows === 0) {
            throw new Error("User not found");
        }

        const [rows]: any = await connection.execute(
            "SELECT id, name, email, age, mobile, roleId FROM users WHERE id = ?",
            [userId]
        );

        return rows[0];
    } finally {
        connection.release();
    }
};

export const deleteUserService = async (userId: string) => {
    const connection = await conn.getConnection();

    try {
        const [result]: any = await connection.execute(
            "DELETE FROM users WHERE id = ?",
            [userId]
        );

        if (result.affectedRows === 0) {
            throw new Error("User not found");
        }

        return true;
    } finally {
        connection.release();
    }
};

