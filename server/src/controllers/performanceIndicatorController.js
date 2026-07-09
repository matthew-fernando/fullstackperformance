import PerformanceIndicator from '../models/PerformanceIndicator.js';

export async function saveBulk(req, res)
{
    try
    {
        const { outcome_id, pis } = req.body;

        if (!outcome_id || !Array.isArray(pis) || pis.length === 0)
        {
            return res.status(400).json({ error: 'outcome_id and a non-empty pis array are required' });
        }

        const operations = pis.map(pi => ({
            updateOne:
            {
                filter: { node_id: pi.node_id },
                update:
                {
                    outcome_id,
                    node_id: pi.node_id,
                    code: pi.code,
                    title: pi.title
                },
                upsert: true
            }
        }));

        const result = await PerformanceIndicator.bulkWrite(operations);
        const saved = await PerformanceIndicator.find({ node_id: { $in: pis.map(pi => pi.node_id) } });

        res.status(200).json({ result, saved });
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
}

export async function getByOutcome(req, res)
{
    try
    {
        const pis = await PerformanceIndicator.find({ outcome_id: req.params.outcome_id });
        res.status(200).json(pis);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
}