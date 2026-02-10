import { Router } from 'express';
import {
    registerUserController,
    userGetter,
    loginUserController,
    refreshTokenController,
    revokeUserController,
    adminController,
    managerController,
    userController
} from '../controllers/user.controller.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { verifytoken } from '../middleware/authMiddleware.js';

const router = Router();

router.route('/register').post(registerUserController);
router.route('/login').post(loginUserController);
router.route('/users').get(userGetter);
router.route('/token').post(refreshTokenController);
router.route('/revoke').post(revokeUserController);

router.route('/admin').get(verifytoken, authorizeRoles('admin'), adminController);
router.route('/manager').get(verifytoken, authorizeRoles('manager'), managerController);
router.route('/user').get(verifytoken, authorizeRoles('user'), userController);

export default router;