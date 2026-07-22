import mongoose from 'mongoose';

const assessmentLevelSchema = new mongoose.Schema(
{
    order: { type: Number, required: true },
    label: { type: String, required: true },
    descriptor_text: { type: String, required: true },
    percentage_min: { type: Number, required: true },
    percentage_max: { type: Number, required: true }
},
{ _id: false });

const performanceIndicatorSchema = new mongoose.Schema(
{
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    outcome_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outcome', required: true },
    node_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    assessment_levels: { type: [assessmentLevelSchema], default: [] }
},
{
    timestamps: true,
    collection: 'performance_indicators'
});

performanceIndicatorSchema.index({ class_id: 1, node_id: 1 }, { unique: true });

export default mongoose.model('PerformanceIndicator', performanceIndicatorSchema);