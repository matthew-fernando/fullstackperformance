import Outcome from '../models/Outcome.js';
import { generatePIsFromNodes } from '../services/geminiService.js';
import { getSelectedNodesWithSubtrees } from '../utils/treePathUtils.js';
import { normalizeSiblings } from '../utils/treeUtils.js';


async function getAllOutcomes(req, res)
{
    try
    {
        const outcomes = await Outcome.find();
        res.json(outcomes);
    }
    catch (error)
    {
        console.error('Error fetching outcomes:', error);
        res.status(500).json({ error: 'Failed to fetch outcomes' });
    }
}

async function createOutcome(req, res)
{
    try
    {
        const { code, statement } = req.body;

        if (!code || !statement)
        {
            return res.status(400).json({ error: 'code and statement are required' });
        }

        const new_outcome = await Outcome.create({ code, statement });
        res.status(201).json(new_outcome);
    }
    catch (error)
    {
        console.error('Error creating outcome:', error);
        res.status(500).json({ error: 'Failed to create outcome' });
    }
}

async function getOutcomeById(req, res)
{
    try
    {
        const outcome = await Outcome.findById(req.params.id);

        if (!outcome)
        {
            return res.status(404).json({ error: 'Outcome not found' });
        }

        res.json(outcome);
    }
    catch (error)
    {
        console.error('Error fetching outcome:', error);
        res.status(500).json({ error: 'Failed to fetch outcome' });
    }
}


export { getAllOutcomes, createOutcome, getOutcomeById };
