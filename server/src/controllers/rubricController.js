import Outcome from '../models/Outcome.js';
import PerformanceIndicator from '../models/PerformanceIndicator.js';
import { buildOutcomeRubricContext } from '../utils/piAggregationUtils.js';
import { generateOutcomeRubric } from '../services/geminiService.js';

async function generateRubric(req, res)
{
    try
    {
        const outcome = await Outcome.findById(req.params.id);

        if (!outcome)
        {
            return res.status(404).json({ error: 'Outcome not found' });
        }

        const { level_count } = req.body;

        if (!level_count || level_count < 2)
        {
            return res.status(400).json({ error: 'level_count is required and must be at least 2' });
        }

        const pis = await PerformanceIndicator.find({ outcome_id: outcome._id });

        if (pis.length === 0)
        {
            return res.status(400).json({ error: 'No performance indicators exist for this outcome yet' });
        }

        const pi_contexts = await buildOutcomeRubricContext(outcome, pis);
        const rubric = await generateOutcomeRubric(outcome, level_count, pi_contexts);

        const pi_text_by_id = new Map(pis.map(pi => [pi._id.toString(), pi.title]));
        rubric.rows = rubric.rows.map(row => ({
            ...row,
            pi_text: pi_text_by_id.get(row.pi_id) ?? ''
        }));

        res.json(rubric);
    }
    catch (error)
    {
        console.error('Error generating rubric:', error);

        if (error.is_retryable)
        {
            return res.status(503).json({ error: error.message, retryable: true });
        }

        res.status(500).json({ error: 'Failed to generate rubric' });
    }
}

async function saveRubric(req, res)
{
    try
    {
        const outcome = await Outcome.findById(req.params.id);

        if (!outcome)
        {
            return res.status(404).json({ error: 'Outcome not found' });
        }

        const { levels, rows } = req.body;

        if (!Array.isArray(levels) || !Array.isArray(rows))
        {
            return res.status(400).json({ error: 'levels and rows are required arrays' });
        }

        const percentage_by_order = new Map(
            levels.map(level => [level.order, { percentage_min: level.percentage_min, percentage_max: level.percentage_max }])
        );

        const label_by_order = new Map(levels.map(level => [level.order, level.label]));

        const save_operations = rows.map(async row =>
        {
            const pi = await PerformanceIndicator.findById(row.pi_id);

            if (!pi || pi.outcome_id.toString() !== outcome._id.toString())
            {
                throw new Error(`PI ${row.pi_id} not found under this outcome`);
            }

            pi.assessment_levels = row.descriptors.map(descriptor =>
            {
                const percentages = percentage_by_order.get(descriptor.order);

                return {
                    order: descriptor.order,
                    label: label_by_order.get(descriptor.order),
                    descriptor_text: descriptor.text,
                    percentage_min: percentages.percentage_min,
                    percentage_max: percentages.percentage_max
                };
            });

            return pi.save();
        });

        const saved_pis = await Promise.all(save_operations);

        res.json(saved_pis);
    }
    catch (error)
    {
        console.error('Error saving rubric:', error);
        res.status(500).json({ error: 'Failed to save rubric' });
    }
}


async function getRubric(req, res)
{
    try
    {
        const outcome = await Outcome.findById(req.params.id);

        if (!outcome)
        {
            return res.status(404).json({ error: 'Outcome not found' });
        }

        const pis = await PerformanceIndicator.find({ outcome_id: outcome._id });
        const pis_with_levels = pis.filter(pi => pi.assessment_levels.length > 0);

        if (pis_with_levels.length === 0)
        {
            return res.json({ levels: [], rows: [] });
        }

        const reference_levels = pis_with_levels[0].assessment_levels
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(level => ({
                order: level.order,
                label: level.label,
                percentage_min: level.percentage_min,
                percentage_max: level.percentage_max
            }));

        const rows = pis_with_levels.map(pi => ({
            pi_id: pi._id.toString(),
            pi_code: pi.code,
            pi_text: pi.title,
            descriptors: pi.assessment_levels
                .slice()
                .sort((a, b) => a.order - b.order)
                .map(level => ({ order: level.order, text: level.descriptor_text }))
        }));

        res.json({ levels: reference_levels, rows });
    }
    catch (error)
    {
        console.error('Error fetching rubric:', error);
        res.status(500).json({ error: 'Failed to fetch rubric' });
    }
}

export { generateRubric, saveRubric, getRubric };