import express from 'express';
import { saveBulk, getByClassOutcome } from '../controllers/performanceIndicatorController.js';

const router = express.Router();

router.post('/', saveBulk);
router.get('/class/:class_id/outcome/:outcome_id', getByClassOutcome);

export default router;