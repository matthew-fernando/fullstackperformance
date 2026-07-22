import mongoose from "mongoose";

const leafMappingSchema = new mongoose.Schema(
{
	class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
	outcome_id: { type: mongoose.Schema.Types.ObjectId, ref: "Outcome", required: true },
	node_id: { type: mongoose.Schema.Types.ObjectId, required: true },
	assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
	question_id: { type: mongoose.Schema.Types.ObjectId, required: true }
},
{
	timestamps: true,
	collection: "leaf_mappings"
}
);

leafMappingSchema.index({ class_id: 1, node_id: 1, question_id: 1 }, { unique: true });

export default mongoose.model("LeafMapping", leafMappingSchema);