import PerformanceIndicator from '../models/PerformanceIndicator.js';

export async function saveBulk(req, res)
{
    try
    {
        const { class_id, outcome_id, pis } = req.body;

        if (!class_id || !outcome_id || !Array.isArray(pis) || pis.length === 0)
        {
            return res.status(400).json({ error: 'class_id, outcome_id, and a non-empty pis array are required' });
        }

        const operations = pis.map(pi => ({
            updateOne:
            {
                filter: { class_id, node_id: pi.node_id },
                update:
                {
                    class_id,
                    outcome_id,
                    node_id: pi.node_id,
                    code: pi.code,
                    title: pi.title
                },
                upsert: true
            }
        }));

        const result = await PerformanceIndicator.bulkWrite(operations);
        const saved = await PerformanceIndicator.find({ class_id, node_id: { $in: pis.map(pi => pi.node_id) } });

        res.status(200).json({ result, saved });
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
}

export async function getByClassOutcome(req, res)
{
    try
    {
        const { class_id, outcome_id } = req.params;
        const pis = await PerformanceIndicator.find({ class_id, outcome_id });
        res.status(200).json(pis);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
}