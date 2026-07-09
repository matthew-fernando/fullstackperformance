import Outcome from '../models/Outcome.js';
import { generatePIsFromNodes } from '../services/geminiService.js';
import { getSelectedNodesWithSubtrees } from '../utils/treePathUtils.js';
import { normalizeSiblings } from '../utils/treeUtils.js';

async function saveTrees(req, res)
{
    try
    {
        const outcome = await Outcome.findById(req.params.id);

        if (!outcome)
        {
            return res.status(404).json({ error: 'Outcome not found' });
        }

        const { trees } = req.body;

        if (!Array.isArray(trees))
        {
            return res.status(400).json({ error: 'trees must be an array' });
        }

        const stripped_trees = stripTempIds(trees);
        const normalized_trees = normalizeSiblings(stripped_trees, 1);

        outcome.trees = normalized_trees;
        await outcome.save();

        res.json(outcome);
    }
    catch (error)
    {
        console.error('Error saving trees:', error);
        res.status(500).json({ error: 'Failed to save trees' });
    }
}

function stripTempIds(node_array)
{
    return node_array.map(node =>
    {
        const { _id, children, ...rest } = node;

        const cleaned_children = stripTempIds(children);

        const is_temp_id = typeof _id === 'string' && _id.startsWith('tmp-');

        return is_temp_id
            ? { ...rest, children: cleaned_children }
            : { _id, ...rest, children: cleaned_children };
    });
}

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

async function generatePIs(req, res)
{
    try
    {
        const outcome = await Outcome.findById(req.params.id);

        if (!outcome)
        {
            return res.status(404).json({ error: 'Outcome not found' });
        }

        const { selected_node_ids } = req.body;

        if (!selected_node_ids || selected_node_ids.length === 0)
        {
            return res.status(400).json({ error: 'selected_node_ids is required and must be non-empty' });
        }

        const selected_nodes = getSelectedNodesWithSubtrees(outcome.trees, selected_node_ids);

        const pis = await generatePIsFromNodes(selected_nodes, outcome);

        res.json(pis);
    }
    catch (error)
    {
        console.error('Error generating PIs:', error);

        if (error.is_retryable)
        {
            return res.status(503).json({ error: error.message, retryable: true });
        }

        res.status(500).json({ error: 'Failed to generate PIs' });
    }
}

export { getAllOutcomes, createOutcome, getOutcomeById, generatePIs, saveTrees };
