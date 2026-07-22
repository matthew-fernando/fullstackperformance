import LeafMapping from '../models/LeafMapping.js';
import Assignment from '../models/Assignment.js';

function toPlainNode(node)
{
    return node.toObject ? node.toObject() : node;
}

function findNodeById(trees, target_id)
{
    function walk(node_array)
    {
        for (const node of node_array)
        {
            const plain = toPlainNode(node);

            if (plain._id.toString() === target_id.toString())
            {
                return plain;
            }

            const found = walk(plain.children || []);
            if (found) return found;
        }
        return null;
    }

    return walk(trees);
}

function isLeaf(node)
{
    return !node.children || node.children.length === 0;
}

function collectLeafDescendants(node)
{
    const plain = toPlainNode(node);

    if (isLeaf(plain))
    {
        return [plain];
    }

    return plain.children.flatMap(collectLeafDescendants);
}

function buildLeafContext(leaf_node, mappings_by_node_id)
{
    const mappings = mappings_by_node_id.get(leaf_node._id.toString()) || [];

    const questions = mappings.map(mapping =>
    {
        const assignment = mapping.assignment_id;
        const question = assignment.questions.find(q => q._id.toString() === mapping.question_id.toString());

        return {
            assignment: assignment.name,
            question_id: question ? question.question_label : '(unknown)',
            criteria: question ? question.criteria : []
        };
    });

    return {
        leaf_id: leaf_node._id,
        leaf_label: leaf_node.label,
        questions
    };
}

function buildPIContext(trees, pi, mappings_by_node_id)
{
    const pi_node = findNodeById(trees, pi.node_id);

    if (!pi_node)
    {
        return {
            pi_id: pi._id,
            pi_code: pi.code,
            pi_text: pi.title,
            leaf_contexts: []
        };
    }

    const leaf_nodes = collectLeafDescendants(pi_node);
    const leaf_contexts = leaf_nodes
        .map(leaf_node => buildLeafContext(leaf_node, mappings_by_node_id))
        .filter(leaf_context => leaf_context.questions.length > 0);

    return {
        pi_id: pi._id,
        pi_code: pi.code,
        pi_text: pi.title,
        leaf_contexts
    };
}

async function buildOutcomeRubricContext(class_id, outcome_id, trees, pis)
{
    const mappings = await LeafMapping
        .find({ class_id, outcome_id })
        .populate('assignment_id');

    const mappings_by_node_id = new Map();

    for (const mapping of mappings)
    {
        const key = mapping.node_id.toString();
        const existing = mappings_by_node_id.get(key) || [];
        existing.push(mapping);
        mappings_by_node_id.set(key, existing);
    }

    return pis.map(pi => buildPIContext(trees, pi, mappings_by_node_id));
}

export { findNodeById, collectLeafDescendants, buildPIContext, buildOutcomeRubricContext };