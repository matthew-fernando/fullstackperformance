import express from 'express';
import { getRubrics, getMappingsForOutcome, createMapping, deleteMapping } from '../controllers/leafMappingController.js';

const router = express.Router();

router.get('/rubrics', getRubrics);
router.get('/outcomes/:outcome_id/leaf-mappings', getMappingsForOutcome);
router.post('/leaf-mappings', createMapping);
router.delete('/leaf-mappings/:id', deleteMapping);

export default router;
