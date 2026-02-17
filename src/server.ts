import express, { Express } from "express";
import dotenv from "dotenv";
import swaggerTools from "swagger-tools";
import yaml from "js-yaml";
import path from "path";
import fs from "fs";

import userRouter from "./routes/user.routes";
import { rateLimiter } from "./middleware/ratelimitter";

dotenv.config();

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;

// Load swagger.yaml
const swaggerDoc = yaml.load(
    fs.readFileSync(path.join(__dirname, "../swagger.yaml"), "utf8")
);

// Initialize Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc as any, (middleware: any) => {
    app.use(middleware.swaggerMetadata());
    app.use(middleware.swaggerValidator());

    app.use(
        middleware.swaggerRouter({
            controllers: path.join(__dirname, "controllers"),
        })
    );

    // Swagger UI
    app.use(middleware.swaggerUi());

    // Other middlewares
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(rateLimiter);
    app.use("/", userRouter);

    // Start server ONLY after swagger is ready
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        console.log(`Swagger UI available at http://localhost:${port}/docs`);
    });
});
