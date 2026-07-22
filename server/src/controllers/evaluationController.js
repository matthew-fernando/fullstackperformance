import Class from '../models/Class.js';
import PerformanceIndicator from '../models/PerformanceIndicator.js';
import { calculateOutcomeScore, findNodeById } from '../utils/evaluationEngine.js';
import { findClassOutcomeEntry } from './classController.js';

async function getOutcomeEvaluation(req, res)
{
	try
	{
		const class_doc = await Class.findById(req.params.id).populate('outcomes.outcome_id').lean();

		if (!class_doc)
		{
			return res.status(404).json({ error: 'Class not found' });
		}

		const outcome_entry = class_doc.outcomes.find(entry => String(entry.outcome_id._id) === req.params.outcomeId);

		if (!outcome_entry)
		{
			return res.status(404).json({ error: 'Outcome not assigned to this class' });
		}

		const result = await calculateOutcomeScore(class_doc._id, outcome_entry.outcome_id._id);

		const pis = await PerformanceIndicator.find({ class_id: class_doc._id, outcome_id: outcome_entry.outcome_id._id }).lean();
		const pi_by_id = new Map(pis.map((pi) => [String(pi._id), pi]));

		const pi_results_with_labels = result.pi_results.map((pi_result) =>
		{
			const pi = pi_by_id.get(pi_result.pi_id);
			const pi_node = pi ? findNodeById(outcome_entry.trees, pi.node_id) : null;

			const leaf_scores_with_labels = pi_result.leaf_scores.map((leaf) =>
			{
				const leaf_node = findNodeById(outcome_entry.trees, leaf.node_id);

				return { ...leaf, label: leaf_node ? leaf_node.label : '(unknown leaf)' };
			});

			return {
				...pi_result,
				pi_code: pi ? pi.code : '(unknown)',
				pi_title: pi ? pi.title : '(unknown)',
				node_label: pi_node ? pi_node.label : '(unknown)',
				leaf_scores: leaf_scores_with_labels
			};
		});

		res.json({
			outcome_id: result.outcome_id,
			outcome_code: outcome_entry.outcome_id.code,
			score: result.score,
			coverage: result.coverage,
			active_pi_count: result.active_pi_count,
			total_pi_count: result.total_pi_count,
			pi_results: pi_results_with_labels
		});
	}
	catch (error)
	{
		res.status(500).json({ error: error.message });
	}
}

export { getOutcomeEvaluation };