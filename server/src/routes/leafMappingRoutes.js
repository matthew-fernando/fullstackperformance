import express from 'express';
import { getAssignments, getMappingsForOutcome, createMapping, deleteMapping } from '../controllers/leafMappingController.js';

const router = express.Router();

router.get('/assignments', getAssignments);
router.get('/outcomes/:outcome_id/leaf-mappings', getMappingsForOutcome);
router.post('/leaf-mappings', createMapping);
router.delete('/leaf-mappings/:id', deleteMapping);

export default router;