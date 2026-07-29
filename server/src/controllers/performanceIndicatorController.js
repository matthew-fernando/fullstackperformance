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

        const incoming_node_ids = new Set(pis.map(pi => pi.node_id));

        const existing_pis = await PerformanceIndicator.find({ class_id, outcome_id });

        const code_owned_elsewhere = new Map();
        existing_pis.forEach(pi =>
        {
            if (!incoming_node_ids.has(pi.node_id.toString()))
            {
                code_owned_elsewhere.set(pi.code, pi.node_id.toString());
            }
        });

        const seen_in_this_save = new Map();

        for (const pi of pis)
        {
            if (code_owned_elsewhere.has(pi.code))
            {
                return res.status(409).json({ error: `PI code "${pi.code}" is already used by another performance indicator in this outcome.` });
            }

            const owner = seen_in_this_save.get(pi.code);

            if (owner && owner !== pi.node_id)
            {
                return res.status(409).json({ error: `PI code "${pi.code}" is used by more than one performance indicator here — codes must be unique within an outcome.` });
            }

            seen_in_this_save.set(pi.code, pi.node_id);
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

export async function getAllForClass(req, res)
{
    try
    {
        const { class_id } = req.params;
        const pis = await PerformanceIndicator.find({ class_id });
        res.status(200).json(pis);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
}

export async function deletePI(req, res)
{
    try
    {
        const deleted = await PerformanceIndicator.findByIdAndDelete(req.params.id);

        if (!deleted)
        {
            return res.status(404).json({ error: 'Performance indicator not found' });
        }

        res.status(200).json({ success: true, node_id: deleted.node_id });
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
}