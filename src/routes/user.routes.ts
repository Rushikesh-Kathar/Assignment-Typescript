import { Router } from 'express';
import {
    registerUserController,
    userGetter,
    loginUserController,
    refreshTokenController,
    revokeUserController,
    updateUserController,
    deleteUserController
} from '../controllers/user.controller.js';
import { verifytoken } from '../middleware/authMiddleware.js';

const router = Router();

router.route('/register').post(registerUserController);
router.route('/login').post(loginUserController);
router.route('/users').get(verifytoken, userGetter);
router.route('/token').post(refreshTokenController);
router.route('/revoke').post(revokeUserController);
router.route("/users/:id").patch(verifytoken, updateUserController);
router.route("/users/:id").delete(verifytoken, deleteUserController)



export default router;