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

async function createAssignment(req, res)
{
	const { class_id, name, questions } = req.body;

	if (!class_id || !name)
	{
		return res.status(400).json({ error: "class_id and name are required" });
	}

	try
	{
		const assignment = await Assignment.create({ class_id, name, questions: questions ?? [] });
		res.status(201).json(assignment);
	}
	catch (err)
	{
		res.status(500).json({ error: err.message });
	}
}

async function updateAssignment(req, res)
{
	const { name, questions } = req.body;

	try
	{
		const assignment = await Assignment.findById(req.params.id);

		if (!assignment)
		{
			return res.status(404).json({ error: "Assignment not found" });
		}

		if (name !== undefined) assignment.name = name;

		if (questions !== undefined)
		{
			const old_question_ids = assignment.questions.map(q => q._id.toString());
			const new_question_ids = new Set(questions.filter(q => q._id).map(q => q._id.toString()));
			const removed_question_ids = old_question_ids.filter(id => !new_question_ids.has(id));

			if (removed_question_ids.length > 0)
			{
				await LeafMapping.deleteMany({ assignment_id: assignment._id, question_id: { $in: removed_question_ids } });
			}

			assignment.questions = questions;
		}

		await assignment.save();
		res.json(assignment);
	}
	catch (err)
	{
		res.status(500).json({ error: err.message });
	}
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

async function deleteAssignment(req, res)
{
	try
	{
		const deleted = await Assignment.findByIdAndDelete(req.params.id);

		if (!deleted)
		{
			return res.status(404).json({ error: "Assignment not found" });
		}

		await LeafMapping.deleteMany({ assignment_id: req.params.id });

		res.status(200).json({ success: true });
	}
	catch (err)
	{
		res.status(500).json({ error: err.message });
	}
}

export { getAssignments, createAssignment, updateAssignment, deleteAssignment, 
		getMappingsForClassOutcome, createMapping, deleteMapping };
