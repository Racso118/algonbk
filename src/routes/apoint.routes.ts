import { Router } from 'express';
import { getAppoint } from '../controllers/apo.controller';

const router = Router();

// Rutas de usuarios
router.get('/', getAppoint);

export default router;