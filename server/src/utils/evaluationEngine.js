import Outcome from '../models/Outcome.js';
import PerformanceIndicator from '../models/PerformanceIndicator.js';
import LeafMapping from '../models/LeafMapping.js';
import Assignment from '../models/Assignment.js';
import { calculateClassAverageForQuestion } from './studentGradeUtils.js';

const WEIGHT_TOLERANCE = 0.0001;

/**
 * Recursively searches an array of TreeNode subdocuments for a node matching node_id.
 * @param {Array} nodes - array of TreeNode subdocuments to search.
 * @param {mongoose.Types.ObjectId|String} node_id - target node's _id.
 * @returns {Object|null} the matching TreeNode subdocument, or null if not found.
 */
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

/**
 * Recursively collects all leaf descendants (nodes with no children) within a subtree,
 * including the root of the subtree itself if it has no children.
 * @param {Object} node - TreeNode subdocument to start from.
 * @returns {Array} flat array of leaf TreeNode subdocuments.
 */
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

/**
 * Calculates a leaf node's score by averaging the class average (computed from the
 * Student collection) of every Rubric ("question") mapped to that leaf via LeafMapping.
 * Questions with no graded students yet are excluded.
 * @param {mongoose.Types.ObjectId|String} node_id - the leaf TreeNode's _id.
 * @param {mongoose.Types.ObjectId|String} outcome_id - the owning Outcome's _id.
 * @returns {Promise<{node_id: String, score: Number|null, is_active: Boolean, graded_question_count: Number, total_question_count: Number}>}
 */
async function calculateLeafScore(node_id, outcome_id)
{
    const mappings = await LeafMapping.find({ node_id, outcome_id }).lean();

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

            return calculateClassAverageForQuestion(assignment.name, question.question_label);
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

/**
 * Calculates a Performance Indicator's score by dynamically re-normalizing across
 * only its "active" (graded) leaf descendants, weighted by each leaf's tree-derived
 * normalized_weight. Also returns pi_coverage: the fraction (0-1) of the PI's own
 * subtree weight that is currently backed by graded leaves.
 * @param {mongoose.Types.ObjectId|String} pi_id - the PerformanceIndicator's _id.
 * @returns {Promise<{pi_id: String, score: Number|null, coverage: Number, active_leaf_count: Number, total_leaf_count: Number, leaf_scores: Array}>}
 */
async function calculatePIScoreFromLeaves(pi_id)
{
    const pi = await PerformanceIndicator.findById(pi_id).lean();

    if (!pi)
    {
        throw new Error(`PerformanceIndicator not found for id: ${pi_id}`);
    }

    const outcome = await Outcome.findById(pi.outcome_id).lean();

    if (!outcome)
    {
        throw new Error(`Outcome not found for id: ${pi.outcome_id}`);
    }

    const pi_node = findNodeById(outcome.trees, pi.node_id);

    if (!pi_node)
    {
        throw new Error(`Tree node not found for PI ${pi_id} (node_id: ${pi.node_id})`);
    }

    const leaf_nodes = collectLeafDescendants(pi_node);

    const leaf_scores = await Promise.all(
        leaf_nodes.map((leaf) => calculateLeafScore(leaf._id, outcome._id))
    );

    // Attach each leaf's tree-derived normalized_weight for aggregation.
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

    // Coverage: what fraction of THIS PI's own subtree weight is currently assessed.
    // pi_node.normalized_weight is the ceiling (sum of all its leaf descendants' weights).
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

export {
    findNodeById,
    collectLeafDescendants,
    calculateLeafScore,
    calculatePIScoreFromLeaves,
    calculateOutcomeScore
};

/**
 * Calculates an Outcome's overall score by dynamically re-normalizing across only its
 * "active" PIs (PIs with at least one graded leaf), weighted by each PI node's
 * tree-derived normalized_weight. Root trees for an Outcome always sum to 1, so
 * coverage here is a direct 0-1 fraction (no local ceiling division needed, unlike
 * the PI-level coverage).
 * @param {mongoose.Types.ObjectId|String} outcome_id - the Outcome's _id.
 * @returns {Promise<{outcome_id: String, score: Number|null, coverage: Number, active_pi_count: Number, total_pi_count: Number, pi_results: Array}>}
 */
async function calculateOutcomeScore(outcome_id)
{
    const outcome = await Outcome.findById(outcome_id).lean();

    if (!outcome)
    {
        throw new Error(`Outcome not found for id: ${outcome_id}`);
    }

    const pis = await PerformanceIndicator.find({ outcome_id }).lean();

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

    // Attach each PI node's own normalized_weight (its weight within the whole outcome tree).
    const enriched_pi_results = pi_results.map((result, index) =>
    {
        const pi_node = findNodeById(outcome.trees, pis[index].node_id);

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
