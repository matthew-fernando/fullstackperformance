import express from 'express';
import { getAllOutcomes, createOutcome, getOutcomeById, generatePIs, saveTrees } from '../controllers/outcomeController.js';

const router = express.Router();

router.get('/', getAllOutcomes);
router.post('/', createOutcome);
router.get('/:id', getOutcomeById);
router.post('/:id/generate-pis', generatePIs);
router.put('/:id/trees', saveTrees);

export default router;
