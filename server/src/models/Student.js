import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
	student_id: { type: Number, required: true, unique: true },
	first_name: { type: String, required: true },
	last_name: { type: String, required: true },
	section: { type: Number, default: 0 },
	// Shape is dynamic per the source gradebook export (assignment name -> question_id -> {total, scores, annotations, missing}),
	// so this is intentionally Mixed rather than a strict nested schema.
	assignments: { type: mongoose.Schema.Types.Mixed, default: {} }
});

export default mongoose.model("Student", studentSchema, "students");
