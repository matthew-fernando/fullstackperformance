import express from 'express';
import {
    getAllClasses,
    createClass,
    getClassById,
    updateClassMeta,
    addOutcomeToClass,
    removeOutcomeFromClass,
    deleteClass,
    saveTrees, 
    generatePIsForClassOutcome
} from '../controllers/classController.js';
import { generateRubric, saveRubric, getRubric, deleteRubric } from '../controllers/rubricController.js';
import { getOutcomeEvaluation } from '../controllers/evaluationController.js';
import studentRoutes from './studentRoutes.js';


const router = express.Router();

router.get('/', getAllClasses);
router.post('/', createClass);
router.get('/:id', getClassById);
router.put('/:id', updateClassMeta);
router.delete('/:id', deleteClass);
router.post('/:id/outcomes', addOutcomeToClass);
router.delete('/:id/outcomes/:outcomeId', removeOutcomeFromClass);
router.put('/:id/outcomes/:outcomeId/trees', saveTrees);
router.post('/:id/outcomes/:outcomeId/generate-pis', generatePIsForClassOutcome);
router.post('/:id/outcomes/:outcomeId/generate-rubric', generateRubric);
router.put('/:id/outcomes/:outcomeId/rubric', saveRubric);
router.get('/:id/outcomes/:outcomeId/rubric', getRubric);
router.delete('/:id/outcomes/:outcomeId/rubric', deleteRubric);
router.get('/:id/outcomes/:outcomeId/evaluation', getOutcomeEvaluation);
router.use('/:id/students', studentRoutes);

export default router;