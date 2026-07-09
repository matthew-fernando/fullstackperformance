import mongoose from 'mongoose';

const performanceIndicatorSchema = new mongoose.Schema(
{
    outcome_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Outcome', required: true },
    node_id: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    code: { type: String, required: true },
    title: { type: String, required: true }
},
{
    timestamps: true,
    collection: 'performance_indicators'
});

export default mongoose.model('PerformanceIndicator', performanceIndicatorSchema);