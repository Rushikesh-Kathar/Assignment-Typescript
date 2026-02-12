import { Request, Response } from 'express';
import { registerUser, loginUser, refreshToken, revokeUser } from '../services/authService.js';
import { getAllUsers, getUserById, updateUserService, deleteUserService } from '../services/userService.js';
import { ProtectedRequest } from '../types/app-request.js';
import { defineAbilitiesFor } from '../casl/authrbac.js';
import { subject } from "@casl/ability";

export const registerUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, age, password, mobile, teamId, roleId } = req.body;

        if (!name || !email || !password || !teamId || !roleId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const tokens = await registerUser({ name, email, age, password, mobile, teamId, roleId });

        res.status(201).json({
            message: 'User registered successfully',
            ...tokens
        });
    } catch (error: any) {
        console.error(error);

        if (error.message === 'Missing required fields' || error.message === 'Email already registered') {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: error.message,
            sqlMessage: error.sqlMessage,
            code: error.code
        });
    }
};

export const loginUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const tokens = await loginUser({ email, password });

        res.status(200).json({
            message: 'Login successful',
            ...tokens
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const userGetter = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const ability = defineAbilitiesFor(user);
        let result;
        if (ability.can('read', 'User')) {
            // If user can read all users (admin), return all
            result = await getAllUsers();
        } else {
            // Otherwise, only return their own user
            result = await getUserById(user.id);
        }
        res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;

        const newToken = await refreshToken({ token });
        res.json({ accessToken: newToken });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const revokeUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ message: 'userId is required' });
            return;
        }

        await revokeUser({ userId });

        res.json({ message: 'User revoked and tokens deleted successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


export const adminController = async (
    req: ProtectedRequest,
    res: Response
): Promise<void> => {
    try {

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        if (req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied. Admins only." });
            return;
        }

        res.json({ message: `Welcome Admin ${req.user.email}!` });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const managerController = async (
    req: ProtectedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (req.user.role !== "manager") {
            res.status(403).json({ message: "Access denied. Managers only." });
            return;
        }

        res.json({ message: `Welcome Manager ${req.user.email}!` });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const userController = async (
    req: ProtectedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        res.json({ message: `Welcome User ${req.user.email}!` });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const updateUserController = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id;
        const loggedInUser = (req as any).user;
        console.log("UserId rom update user controller", userId);
        const ability = defineAbilitiesFor(loggedInUser);

        const targetUser = await getUserById(userId);

        if (!targetUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (ability.cannot("update", subject("User", targetUser) as any)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const updatedUser = await updateUserService(
            userId,
            req.body
        );

        res.status(200).json({
            message: "User updated successfully",
            data: updatedUser
        });

    } catch (error: any) {
        if (error.message === "No fields to update") {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
};


export const deleteUserController = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id;
        const loggedInUser = (req as any).user;

        const ability = defineAbilitiesFor(loggedInUser);

        const targetUser = await getUserById(userId);

        if (!targetUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // CASL permission check
        if (ability.cannot("delete", subject("User", targetUser) as any)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        await deleteUserService(userId);

        res.status(200).json({
            message: "User deleted successfully"
        });

    } catch (error: any) {
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    }
};