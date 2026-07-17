import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import Student from './models/Student.js';

async function importStudents()
{
    const file_path = process.argv[2];

    if (!file_path)
    {
        console.error('Usage: node src/importStudents.js <path-to-gradebook.json>');
        process.exit(1);
    }

    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const raw = fs.readFileSync(file_path, 'utf-8');
        const students = JSON.parse(raw);

        if (!Array.isArray(students))
        {
            throw new Error('Expected the JSON file to contain an array of student objects.');
        }

        const operations = students.map((student) => ({
            updateOne: {
                filter: { student_id: student.student_id },
                update: { $set: student },
                upsert: true
            }
        }));

        const result = await Student.bulkWrite(operations);

        console.log(`Upserted ${result.upsertedCount} new students, modified ${result.modifiedCount} existing.`);

        await mongoose.disconnect();
        console.log('Done, disconnected');
    }
    catch (error)
    {
        console.error('Import error:', error);
        process.exit(1);
    }
}

importStudents();