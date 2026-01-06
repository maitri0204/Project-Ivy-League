import { Router } from 'express';
import { createIvyService } from '../controllers/ivyService.controller';

const router = Router();

// POST /api/ivy-service - Create new Ivy League service
router.post('/', createIvyService);

export default router;

