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
    outcome_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outcome', required: true },
    node_id: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    assessment_levels: { type: [assessmentLevelSchema], default: [] }
},
{
    timestamps: true,
    collection: 'performance_indicators'
});

export default mongoose.model('PerformanceIndicator', performanceIndicatorSchema);