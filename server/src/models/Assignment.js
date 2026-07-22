import mongoose from "mongoose";

const criteriaSchema = new mongoose.Schema(
{
	desc: { type: String, required: true },
	points: { type: Number, required: true },
	deduction: { type: [String], default: [] }
},
{ _id: false }
);

const questionSchema = new mongoose.Schema(
{
	question_label: { type: String, required: true },
	criteria: { type: [criteriaSchema], default: [] }
}
);

const assignmentSchema = new mongoose.Schema(
{
	class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
	name: { type: String, required: true },
	questions: { type: [questionSchema], default: [] }
}
);

export default mongoose.model("Assignment", assignmentSchema, "assignments");