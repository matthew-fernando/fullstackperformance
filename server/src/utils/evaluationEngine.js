import Class from '../models/Class.js';
import PerformanceIndicator from '../models/PerformanceIndicator.js';
import LeafMapping from '../models/LeafMapping.js';
import Assignment from '../models/Assignment.js';
import { calculateClassAverageForQuestion } from './studentGradeUtils.js';

const WEIGHT_TOLERANCE = 0.0001;

function findNodeById(nodes, node_id)
{
    for (const node of nodes)
    {
        if (String(node._id) === String(node_id))
        {
            return node;
        }

        if (node.children && node.children.length > 0)
        {
            const found = findNodeById(node.children, node_id);

            if (found)
            {
                return found;
            }
        }
    }

    return null;
}

function collectLeafDescendants(node)
{
    if (!node.children || node.children.length === 0)
    {
        return [node];
    }

    let leaves = [];

    for (const child of node.children)
    {
        leaves = leaves.concat(collectLeafDescendants(child));
    }

    return leaves;
}

async function calculateLeafScore(node_id, class_id)
{
    const mappings = await LeafMapping.find({ node_id, class_id }).lean();

    if (mappings.length === 0)
    {
        return {
            node_id: String(node_id),
            score: null,
            is_active: false,
            graded_question_count: 0,
            total_question_count: 0
        };
    }

    const assignment_ids = mappings.map((mapping) => mapping.assignment_id);
    const assignments = await Assignment.find({ _id: { $in: assignment_ids } }).lean();
    const assignment_by_id = new Map(assignments.map((assignment) => [String(assignment._id), assignment]));

    const class_averages = await Promise.all(
        mappings.map((mapping) =>
        {
            const assignment = assignment_by_id.get(String(mapping.assignment_id));

            if (!assignment)
            {
                return Promise.resolve(null);
            }

            const question = assignment.questions.find((q) => String(q._id) === String(mapping.question_id));

            if (!question)
            {
                return Promise.resolve(null);
            }

            return calculateClassAverageForQuestion(class_id, assignment.name, question.question_label);
        })
    );

    const graded_scores = class_averages.filter((score) => score !== null && score !== undefined);

    if (graded_scores.length === 0)
    {
        return {
            node_id: String(node_id),
            score: null,
            is_active: false,
            graded_question_count: 0,
            total_question_count: mappings.length
        };
    }

    const sum = graded_scores.reduce((acc, score) => acc + score, 0);
    const leaf_score = sum / graded_scores.length;

    return {
        node_id: String(node_id),
        score: leaf_score,
        is_active: true,
        graded_question_count: graded_scores.length,
        total_question_count: mappings.length
    };
}

async function calculatePIScoreFromLeaves(pi_id)
{
    const pi = await PerformanceIndicator.findById(pi_id).lean();

    if (!pi)
    {
        throw new Error(`PerformanceIndicator not found for id: ${pi_id}`);
    }

    const class_doc = await Class.findById(pi.class_id).lean();

    if (!class_doc)
    {
        throw new Error(`Class not found for id: ${pi.class_id}`);
    }

    const outcome_entry = class_doc.outcomes.find(entry => String(entry.outcome_id) === String(pi.outcome_id));

    if (!outcome_entry)
    {
        throw new Error(`Outcome ${pi.outcome_id} not found on class ${pi.class_id}`);
    }

    const pi_node = findNodeById(outcome_entry.trees, pi.node_id);

    if (!pi_node)
    {
        throw new Error(`Tree node not found for PI ${pi_id} (node_id: ${pi.node_id})`);
    }

    const leaf_nodes = collectLeafDescendants(pi_node);

    const leaf_scores = await Promise.all(
        leaf_nodes.map((leaf) => calculateLeafScore(leaf._id, pi.class_id))
    );

    const enriched_leaf_scores = leaf_scores.map((leaf_score, index) => ({
        ...leaf_score,
        normalized_weight: leaf_nodes[index].normalized_weight
    }));

    const active_leaves = enriched_leaf_scores.filter((leaf) => leaf.is_active);

    const total_leaf_weight = leaf_nodes.reduce(
        (acc, leaf) => acc + (leaf.normalized_weight || 0),
        0
    );

    const active_weight_sum = active_leaves.reduce(
        (acc, leaf) => acc + (leaf.normalized_weight || 0),
        0
    );

    const coverage = Math.abs(pi_node.normalized_weight) < WEIGHT_TOLERANCE
        ? 0
        : total_leaf_weight < WEIGHT_TOLERANCE
            ? 0
            : active_weight_sum / pi_node.normalized_weight;

    if (Math.abs(active_weight_sum) < WEIGHT_TOLERANCE)
    {
        return {
            pi_id: String(pi_id),
            score: null,
            coverage: 0,
            active_leaf_count: 0,
            total_leaf_count: leaf_nodes.length,
            leaf_scores: enriched_leaf_scores
        };
    }

    const weighted_sum = active_leaves.reduce(
        (acc, leaf) => acc + (leaf.score * leaf.normalized_weight),
        0
    );

    const pi_score = weighted_sum / active_weight_sum;

    return {
        pi_id: String(pi_id),
        score: pi_score,
        coverage,
        active_leaf_count: active_leaves.length,
        total_leaf_count: leaf_nodes.length,
        leaf_scores: enriched_leaf_scores
    };
}

async function calculateOutcomeScore(class_id, outcome_id)
{
    const class_doc = await Class.findById(class_id).lean();

    if (!class_doc)
    {
        throw new Error(`Class not found for id: ${class_id}`);
    }

    const outcome_entry = class_doc.outcomes.find(entry => String(entry.outcome_id) === String(outcome_id));

    if (!outcome_entry)
    {
        throw new Error(`Outcome ${outcome_id} not found on class ${class_id}`);
    }

    const pis = await PerformanceIndicator.find({ class_id, outcome_id }).lean();

    if (pis.length === 0)
    {
        return {
            outcome_id: String(outcome_id),
            score: null,
            coverage: 0,
            active_pi_count: 0,
            total_pi_count: 0,
            pi_results: []
        };
    }

    const pi_results = await Promise.all(
        pis.map((pi) => calculatePIScoreFromLeaves(pi._id))
    );

    const enriched_pi_results = pi_results.map((result, index) =>
    {
        const pi_node = findNodeById(outcome_entry.trees, pis[index].node_id);

        return {
            ...result,
            normalized_weight: pi_node ? pi_node.normalized_weight : 0
        };
    });

    const active_pis = enriched_pi_results.filter((pi) => pi.score !== null);

    const active_weight_sum = active_pis.reduce(
        (acc, pi) => acc + (pi.normalized_weight || 0),
        0
    );

    if (active_pis.length === 0 || Math.abs(active_weight_sum) < WEIGHT_TOLERANCE)
    {
        return {
            outcome_id: String(outcome_id),
            score: null,
            coverage: active_weight_sum,
            active_pi_count: 0,
            total_pi_count: pis.length,
            pi_results: enriched_pi_results
        };
    }

    const weighted_sum = active_pis.reduce(
        (acc, pi) => acc + (pi.score * pi.normalized_weight),
        0
    );

    const outcome_score = weighted_sum / active_weight_sum;

    return {
        outcome_id: String(outcome_id),
        score: outcome_score,
        coverage: active_weight_sum,
        active_pi_count: active_pis.length,
        total_pi_count: pis.length,
        pi_results: enriched_pi_results
    };
}

export {
    findNodeById,
    collectLeafDescendants,
    calculateLeafScore,
    calculatePIScoreFromLeaves,
    calculateOutcomeScore
};