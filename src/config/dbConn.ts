import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const poolOptions: PoolOptions = {
    connectionLimit: parseInt(process.env.CONNECTIONLIMIT || '10', 10),
    host: process.env.HOST || 'localhost',
    user: process.env.USER || 'root',
    password: process.env.PASSWORD || '',
    database: process.env.DATABASE || ''
};

export const conn: Pool = await mysql.createPool(poolOptions);

conn.getConnection()
    .then((connection) => {
        console.log('DB connected successfully!');
        connection.release();
    })
    .catch((err: Error) => {
        console.error('DB connection failed:', err);
        process.exit(1);
    });