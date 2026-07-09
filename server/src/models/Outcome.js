import mongoose from 'mongoose';

const treeNodeSchema = new mongoose.Schema(
{
    label:
    {
        type: String,
        required: true
    },
    type:
    {
        type: String,
        enum: ['root', 'keyword', 'logical'],
        required: true
    },
    level:
    {
        type: Number,
        required: true
    },
    weight:
    {
        type: Number,
        required: true,
        default: 1
    },
    normalized_weight:
    {
        type: Number,
        default: 1
    },
    threshold:
    {
        type: Number,
        required: true
    },
    x:
    {
        type: Number,
        required: true,
        default: 0
    },
    y:
    {
        type: Number,
        required: true,
        default: 0
    },
    children:
    {
        type: [],
        default: []
    }
});

treeNodeSchema.add({ children: [treeNodeSchema] });

const outcomeSchema = new mongoose.Schema(
{
    code:
    {
        type: String,
        required: true,
        unique: true
    },
    statement:
    {
        type: String,
        required: true
    },
    trees:
    {
        type: [treeNodeSchema],
        default: []
    }
});

const Outcome = mongoose.model('Outcome', outcomeSchema);

export default Outcome;
