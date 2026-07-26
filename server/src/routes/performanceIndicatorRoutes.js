import express from 'express';
import { saveBulk, getByClassOutcome, getAllForClass } from '../controllers/performanceIndicatorController.js';

const router = express.Router();

router.post('/', saveBulk);
router.get('/class/:class_id/outcome/:outcome_id', getByClassOutcome);
router.get('/class/:class_id', getAllForClass);

export default router;