import express, { Express } from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/user.routes.js';

dotenv.config();

const app: Express = express();
const port: string | number = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', userRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});