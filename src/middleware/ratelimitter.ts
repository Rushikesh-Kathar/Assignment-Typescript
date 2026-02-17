import { Request, Response, NextFunction } from "express";

const requestMap = new Map<string, number[]>();

const WINDOW = 10000;
const LIMIT = 10;
const DELAY_MS = 2000;

export function rateLimiter(req: Request, res: Response, next: NextFunction): any {
    const ip: any = req.ip;
    const now = Date.now();

    const timestamps = requestMap.get(ip) || [];

    const validTimestamps = timestamps.filter(ts => now - ts < WINDOW);

    //Rate limitter without throttling

    if (validTimestamps.length >= LIMIT) {
        res.status(429).json({ message: "Rate limit exceeded" });
        return;
    }

    validTimestamps.push(now);
    requestMap.set(ip, validTimestamps);

    //Rate limitter with throttling

    // if (validTimestamps.length > LIMIT) {
    //     console.log("Throttling IP:", ip);

    //     setTimeout(() => {
    //         next();
    //     }, DELAY_MS);
    //     return;
    // }

    next();
}
