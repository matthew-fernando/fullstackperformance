import express from 'express';
import { getAllOutcomes, createOutcome, getOutcomeById, generatePIs, saveTrees } from '../controllers/outcomeController.js';
import { generateRubric, saveRubric, getRubric } from '../controllers/rubricController.js';

const router = express.Router();

router.get('/', getAllOutcomes);
router.post('/', createOutcome);
router.get('/:id', getOutcomeById);
router.post('/:id/generate-pis', generatePIs);
router.put('/:id/trees', saveTrees);
router.post('/:id/generate-rubric', generateRubric);
router.put('/:id/rubric', saveRubric);
router.get('/:id/rubric', getRubric);

export default router;