import LeafMapping from "../models/LeafMapping.js";
import Assignment from "../models/Assignment.js";

async function getAssignments(req, res)
{
	const assignments = await Assignment.find({});
	res.json(assignments);
}

async function getMappingsForOutcome(req, res)
{
	const mappings = await LeafMapping.find({ outcome_id: req.params.outcome_id }).populate("assignment_id");
	res.json(mappings);
}

async function createMapping(req, res)
{
	const { outcome_id, node_id, assignment_id, question_id } = req.body;

	if (!outcome_id || !node_id || !assignment_id || !question_id)
	{
		return res.status(400).json({ error: "outcome_id, node_id, assignment_id, and question_id are required" });
	}

	try
	{
		const mapping = await LeafMapping.create({ outcome_id, node_id, assignment_id, question_id });
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

export { getAssignments, getMappingsForOutcome, createMapping, deleteMapping };