import mongoose from 'mongoose';
import treeNodeSchema from '../models/treeNodeSchema.js';

const classOutcomeSchema = new mongoose.Schema(
{
    outcome_id:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outcome',
        required: true
    },
    trees:
    {
        type: [treeNodeSchema],
        default: []
    }
},
{ _id: false });

const classSchema = new mongoose.Schema(
{
    course_code:
    {
        type: String,
        required: true
    },
    course_name:
    {
        type: String,
        required: true
    },
    term:
    {
        type: String
    },
    professor_id:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor'
    },
    outcomes:
    {
        type: [classOutcomeSchema],
        default: []
    }
},
{ timestamps: true });

const Class = mongoose.model('Class', classSchema);

export default Class;