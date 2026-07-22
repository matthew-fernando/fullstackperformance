import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
	class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
	student_id: { type: Number, required: true },
	first_name: { type: String, required: true },
	last_name: { type: String, required: true },
	section: { type: Number, default: 0 },
	// Shape is dynamic per the source gradebook export (assignment name -> question_id -> {total, scores, annotations, missing}),
	// so this is intentionally Mixed rather than a strict nested schema.
	assignments: { type: mongoose.Schema.Types.Mixed, default: {} }
});

studentSchema.index({ class_id: 1, student_id: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema, "students");