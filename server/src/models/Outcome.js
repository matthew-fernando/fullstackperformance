import mongoose from 'mongoose';

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
    }
});

const Outcome = mongoose.model('Outcome', outcomeSchema);

export default Outcome;