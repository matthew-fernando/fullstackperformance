import express from 'express';
import { getAllOutcomes, createOutcome, getOutcomeById } from '../controllers/outcomeController.js';

const router = express.Router();

router.get('/', getAllOutcomes);
router.post('/', createOutcome);
router.get('/:id', getOutcomeById);


export default router;