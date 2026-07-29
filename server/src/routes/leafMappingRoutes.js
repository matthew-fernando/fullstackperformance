import express from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment, getMappingsForClassOutcome, createMapping, deleteMapping } from '../controllers/leafMappingController.js';

const router = express.Router();

router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.get('/classes/:class_id/outcomes/:outcome_id/leaf-mappings', getMappingsForClassOutcome);
router.post('/leaf-mappings', createMapping);
router.delete('/leaf-mappings/:id', deleteMapping);

export default router;