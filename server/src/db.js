import mongoose from 'mongoose';
import PerformanceIndicator from '../src/models/PerformanceIndicator.js';
import LeafMapping from '../src/models/LeafMapping.js';
import Student from '../src/models/Student.js';

async function connectDB()
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        await PerformanceIndicator.syncIndexes();
        await LeafMapping.syncIndexes();
        await Student.syncIndexes();
        console.log('Indexes synced');
    }
    catch (error)
    {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export default connectDB;