import LeafMapping from "../models/LeafMapping.js";
import Rubric from "../models/Rubric.js";

async function getRubrics(req, res)
{
	const rubrics = await Rubric.find({});
	res.json(rubrics);
}

async function getMappingsForOutcome(req, res)
{
	const mappings = await LeafMapping.find({ outcome_id: req.params.outcome_id }).populate("rubric_id");
	res.json(mappings);
}

async function createMapping(req, res)
{
	const { outcome_id, node_id, rubric_id } = req.body;

	if (!outcome_id || !node_id || !rubric_id)
	{
		return res.status(400).json({ error: "outcome_id, node_id, and rubric_id are required" });
	}

	try
	{
		const mapping = await LeafMapping.create({ outcome_id, node_id, rubric_id });
		res.status(201).json(mapping);
	}
	catch (err)
	{
		if (err.code === 11000)
		{
			return res.status(409).json({ error: "This leaf is already linked to this question" });
		}
		res.status(500).json({ error: err.message });
	}
}

async function deleteMapping(req, res)
{
	await LeafMapping.findByIdAndDelete(req.params.id);
	res.status(204).send();
}

export { getRubrics, getMappingsForOutcome, createMapping, deleteMapping };