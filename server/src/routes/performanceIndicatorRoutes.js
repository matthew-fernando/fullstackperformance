import express from 'express';
import { saveBulk, getByClassOutcome, getAllForClass, deletePI } from '../controllers/performanceIndicatorController.js';

const router = express.Router();

router.post('/', saveBulk);
router.get('/class/:class_id/outcome/:outcome_id', getByClassOutcome);
router.get('/class/:class_id', getAllForClass);
router.delete('/:id', deletePI);

export default router;