import express from 'express';
import FileController from '../controllers/FileController.ts';
// import AuthMiddleware from '../middleware/authMiddleware.ts';
// import { userTypeMiddleware } from '../middleware/userTypeMiddleware.ts';
// import { UserType } from '../db/models/User.ts';

export const fileUploadRouter = express.Router();

// fileUploadRouter.post('/upload', AuthMiddleware, userTypeMiddleware([UserType.Admin]), AuthController.signup);
fileUploadRouter.post('/upload', FileController.upload);
