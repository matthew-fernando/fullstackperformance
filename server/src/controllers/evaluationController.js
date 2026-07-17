import Outcome from '../models/Outcome.js';
import PerformanceIndicator from '../models/PerformanceIndicator.js';
import { calculateOutcomeScore, findNodeById } from '../utils/evaluationEngine.js';

async function getOutcomeEvaluation(req, res)
{
	try
	{
		const outcome = await Outcome.findById(req.params.id).lean();

		if (!outcome)
		{
			return res.status(404).json({ error: 'Outcome not found' });
		}

		const result = await calculateOutcomeScore(req.params.id);

		const pis = await PerformanceIndicator.find({ outcome_id: req.params.id }).lean();
		const pi_by_id = new Map(pis.map((pi) => [String(pi._id), pi]));

		const pi_results_with_labels = result.pi_results.map((pi_result) =>
		{
			const pi = pi_by_id.get(pi_result.pi_id);
			const pi_node = pi ? findNodeById(outcome.trees, pi.node_id) : null;

			const leaf_scores_with_labels = pi_result.leaf_scores.map((leaf) =>
			{
				const leaf_node = findNodeById(outcome.trees, leaf.node_id);

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
			outcome_code: outcome.code,
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