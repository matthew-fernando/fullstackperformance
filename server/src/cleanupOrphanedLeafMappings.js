import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './db.js';
import LeafMapping from './models/LeafMapping.js';
import Assignment from './models/Assignment.js';

await connectDB();

const mappings = await LeafMapping.find();
const assignment_ids = new Set((await Assignment.find().select('_id')).map(a => a._id.toString()));

const orphaned = mappings.filter(m => !assignment_ids.has(m.assignment_id.toString()));

console.log(`Found ${orphaned.length} orphaned leaf mapping(s).`);

if (orphaned.length > 0)
{
    await LeafMapping.deleteMany({ _id: { $in: orphaned.map(m => m._id) } });
    console.log('Deleted.');
}

await mongoose.disconnect();