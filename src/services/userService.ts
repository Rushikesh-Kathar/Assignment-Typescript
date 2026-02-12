import { conn } from '../config/dbConn.js';
import { RowDataPacket } from 'mysql2/promise';
import { UpdateUserData } from "../types/user.types.js";
import bcrypt from "bcrypt";

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
export const getUserById = async (id: string): Promise<UserRecord[]> => {
    const [rows] = await conn.execute<UserRecord[]>(
        'SELECT id, name, email, age, mobile FROM users WHERE id = ?',
        [id]
    );
    return rows;
};

export const updateUserService = async (
    userId: number,
    loggedInUser: any,
    userData: UpdateUserData
) => {
    const connection = await conn.getConnection();

    try {
        // RBAC: admin can update anyone, user only self
        if (loggedInUser.role !== "admin" && loggedInUser.id !== userId) {
            throw new Error("Access denied");
        }

        // normal user cannot change role
        if (loggedInUser.role !== "admin" && userData.roleId) {
            throw new Error("You cannot change role");
        }

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
