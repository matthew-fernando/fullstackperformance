import mongoose from "mongoose";

const leafMappingSchema = new mongoose.Schema(
{
	outcome_id: { type: mongoose.Schema.Types.ObjectId, ref: "Outcome", required: true },
	node_id: { type: mongoose.Schema.Types.ObjectId, required: true },
	rubric_id: { type: mongoose.Schema.Types.ObjectId, ref: "Rubric", required: true }
},
{ 
	timestamps: true,
	collection: "leaf_mappings"
}
);

leafMappingSchema.index({ node_id: 1, rubric_id: 1 }, { unique: true });

export default mongoose.model("LeafMapping", leafMappingSchema);