import Class from '../models/Class.js';
import { generatePIsFromNodes } from '../services/llmService.js';
import { getSelectedNodesWithSubtrees } from '../utils/treePathUtils.js';
import { normalizeSiblings, stripTempIds } from '../utils/treeUtils.js';

async function getAllClasses(req, res)
{
    try
    {
        const classes = await Class.find().select('course_code course_name term professor_id createdAt');
        res.json(classes);
    }
    catch (error)
    {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
}

async function createClass(req, res)
{
    try
    {
        const { course_code, course_name, term, professor_id, outcome_ids } = req.body;

        if (!course_code || !course_name)
        {
            return res.status(400).json({ error: 'course_code and course_name are required' });
        }

        const outcomes = Array.isArray(outcome_ids)
            ? outcome_ids.map(outcome_id => ({ outcome_id, trees: [] }))
            : [];

        const new_class = await Class.create({ course_code, course_name, term, professor_id, outcomes });

        res.status(201).json(new_class);
    }
    catch (error)
    {
        console.error('Error creating class:', error);
        res.status(500).json({ error: 'Failed to create class' });
    }
}

async function getClassById(req, res)
{
    try
    {
        const class_doc = await Class.findById(req.params.id).populate('outcomes.outcome_id', 'code statement');

        if (!class_doc)
        {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json(class_doc);
    }
    catch (error)
    {
        console.error('Error fetching class:', error);
        res.status(500).json({ error: 'Failed to fetch class' });
    }
}

async function updateClassMeta(req, res)
{
    try
    {
        const { course_code, course_name, term, professor_id } = req.body;

        const class_doc = await Class.findById(req.params.id);

        if (!class_doc)
        {
            return res.status(404).json({ error: 'Class not found' });
        }

        if (course_code !== undefined) class_doc.course_code = course_code;
        if (course_name !== undefined) class_doc.course_name = course_name;
        if (term !== undefined) class_doc.term = term;
        if (professor_id !== undefined) class_doc.professor_id = professor_id;

        await class_doc.save();
        res.json(class_doc);
    }
    catch (error)
    {
        console.error('Error updating class:', error);
        res.status(500).json({ error: 'Failed to update class' });
    }
}

async function addOutcomeToClass(req, res)
{
    try
    {
        const { outcome_id } = req.body;

        if (!outcome_id)
        {
            return res.status(400).json({ error: 'outcome_id is required' });
        }

        const class_doc = await Class.findById(req.params.id);

        if (!class_doc)
        {
            return res.status(404).json({ error: 'Class not found' });
        }

        const already_present = class_doc.outcomes.some(entry => entry.outcome_id.toString() === outcome_id);

        if (already_present)
        {
            return res.status(400).json({ error: 'Outcome already assigned to this class' });
        }

        class_doc.outcomes.push({ outcome_id, trees: [] });
        await class_doc.save();

        res.json(class_doc);
    }
    catch (error)
    {
        console.error('Error adding outcome to class:', error);
        res.status(500).json({ error: 'Failed to add outcome to class' });
    }
}

async function removeOutcomeFromClass(req, res)
{
    try
    {
        const class_doc = await Class.findById(req.params.id);

        if (!class_doc)
        {
            return res.status(404).json({ error: 'Class not found' });
        }

        class_doc.outcomes = class_doc.outcomes.filter(
            entry => entry.outcome_id.toString() !== req.params.outcomeId
        );

        await class_doc.save();
        res.json(class_doc);
    }
    catch (error)
    {
        console.error('Error removing outcome from class:', error);
        res.status(500).json({ error: 'Failed to remove outcome from class' });
    }
}

async function deleteClass(req, res)
{
    try
    {
        const deleted = await Class.findByIdAndDelete(req.params.id);

        if (!deleted)
        {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({ success: true });
    }
    catch (error)
    {
        console.error('Error deleting class:', error);
        res.status(500).json({ error: 'Failed to delete class' });
    }
}

function findClassOutcomeEntry(class_doc, outcome_id)
{
    return class_doc.outcomes.find(entry =>
    {
        const entry_outcome_id = entry.outcome_id._id
            ? entry.outcome_id._id.toString()
            : entry.outcome_id.toString();

        return entry_outcome_id === outcome_id;
    });
}

async function saveTrees(req, res)
{
    try
    {
        const class_doc = await Class.findById(req.params.id);

        if (!class_doc)
        {
            return res.status(404).json({ error: 'Class not found' });
        }

        const outcome_entry = findClassOutcomeEntry(class_doc, req.params.outcomeId);

        if (!outcome_entry)
        {
            return res.status(404).json({ error: 'Outcome not assigned to this class' });
        }

        const { trees } = req.body;

        if (!Array.isArray(trees))
        {
            return res.status(400).json({ error: 'trees must be an array' });
        }

        const stripped_trees = stripTempIds(trees);
        const normalized_trees = normalizeSiblings(stripped_trees, 1);

        outcome_entry.trees = normalized_trees;
        await class_doc.save();

        res.json(outcome_entry);
    }
    catch (error)
    {
        console.error('Error saving trees:', error);
        res.status(500).json({ error: 'Failed to save trees' });
    }
}

async function generatePIsForClassOutcome(req, res)
{
    try
    {
        const class_doc = await Class.findById(req.params.id).populate('outcomes.outcome_id');

        if (!class_doc)
        {
            return res.status(404).json({ error: 'Class not found' });
        }

        const outcome_entry = findClassOutcomeEntry(class_doc, req.params.outcomeId);

        if (!outcome_entry)
        {
            return res.status(404).json({ error: 'Outcome not assigned to this class' });
        }

        const { selected_node_ids } = req.body;

        if (!selected_node_ids || selected_node_ids.length === 0)
        {
            return res.status(400).json({ error: 'selected_node_ids is required and must be non-empty' });
        }

        const selected_nodes = getSelectedNodesWithSubtrees(outcome_entry.trees, selected_node_ids);

        const pis = await generatePIsFromNodes(selected_nodes, outcome_entry.outcome_id);

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

export { getAllClasses, createClass, getClassById, updateClassMeta, addOutcomeToClass, 
        removeOutcomeFromClass, deleteClass, saveTrees, generatePIsForClassOutcome, 
        findClassOutcomeEntry };