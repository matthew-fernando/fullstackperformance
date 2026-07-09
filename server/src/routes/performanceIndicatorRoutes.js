import express from 'express';
import { saveBulk, getByOutcome } from '../controllers/performanceIndicatorController.js';

const router = express.Router();

router.post('/', saveBulk);
router.get('/outcome/:outcome_id', getByOutcome);

export default router;