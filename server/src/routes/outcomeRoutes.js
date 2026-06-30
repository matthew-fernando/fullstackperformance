const express = require('express');
const router = express.Router();
const { getAllOutcomes, createOutcome, getOutcomeById, generatePIs, saveTrees } = require('../controllers/outcomeController');

router.get('/', getAllOutcomes);
router.post('/', createOutcome);
router.get('/:id', getOutcomeById);
router.post('/:id/generate-pis', generatePIs);
router.put('/:id/trees', saveTrees);

module.exports = router;