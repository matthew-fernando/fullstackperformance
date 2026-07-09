import mongoose from "mongoose";

const criteriaSchema = new mongoose.Schema(
{
	desc: { type: String, required: true },
	points: { type: Number, required: true },
	deduction: { type: [String], default: [] }
},
{ _id: false }
);

const rubricSchema = new mongoose.Schema({
	question_id: { type: String, required: true },
	assignment: { type: String, required: true },
	criteria: { type: [criteriaSchema], default: [] }
});

export default mongoose.model("Rubric", rubricSchema, "rubrics");