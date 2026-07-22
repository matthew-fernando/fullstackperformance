import LeafMapping from "../models/LeafMapping.js";
import Assignment from "../models/Assignment.js";

async function getAssignments(req, res)
{
	const { class_id } = req.query;

	if (!class_id)
	{
		return res.status(400).json({ error: "class_id query param is required" });
	}

	const assignments = await Assignment.find({ class_id });
	res.json(assignments);
}

async function getMappingsForClassOutcome(req, res)
{
	const { class_id, outcome_id } = req.params;
	const mappings = await LeafMapping.find({ class_id, outcome_id }).populate("assignment_id");
	res.json(mappings);
}

async function createMapping(req, res)
{
	const { class_id, outcome_id, node_id, assignment_id, question_id } = req.body;

	if (!class_id || !outcome_id || !node_id || !assignment_id || !question_id)
	{
		return res.status(400).json({ error: "class_id, outcome_id, node_id, assignment_id, and question_id are required" });
	}

	try
	{
		const mapping = await LeafMapping.create({ class_id, outcome_id, node_id, assignment_id, question_id });
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

export { getAssignments, getMappingsForClassOutcome, createMapping, deleteMapping };