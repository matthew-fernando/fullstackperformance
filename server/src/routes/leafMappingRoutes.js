import express from 'express';
import { getAssignments, getMappingsForClassOutcome, createMapping, deleteMapping } from '../controllers/leafMappingController.js';

const router = express.Router();

router.get('/assignments', getAssignments);
router.get('/classes/:class_id/outcomes/:outcome_id/leaf-mappings', getMappingsForClassOutcome);
router.post('/leaf-mappings', createMapping);
router.delete('/leaf-mappings/:id', deleteMapping);

export default router;