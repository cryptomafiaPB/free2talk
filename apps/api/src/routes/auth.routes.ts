import { Router } from 'express';
import { getMeController, loginController, logoutController, refreshTokenController, registerController } from '../controllers/auth.controller';

export const authRouter = Router();


authRouter.post('/register', registerController);

authRouter.post('/login', loginController);

authRouter.post('/logout', logoutController);
authRouter.post('/refresh', refreshTokenController);

authRouter.get('/me', getMeController);
