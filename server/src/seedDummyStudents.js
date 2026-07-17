import 'dotenv/config';
import mongoose from 'mongoose';
import Assignment from './models/Assignment.js';
import Student from './models/Student.js';

const DUMMY_STUDENT_COUNT = 15;
const DUMMY_STUDENT_ID_START = 800001;

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Drew', 'Skyler', 'Reese', 'Cameron', 'Peyton', 'Dakota'];
const LAST_NAMES = ['Nguyen', 'Garcia', 'Smith', 'Patel', 'Kim', 'Rossi', 'Johnson', 'Chen', 'Martinez', 'Brown', 'Lee', 'Davis', 'Khan', 'Wilson', 'Torres'];

/**
 * Generates a randomized but plausible score for a question, centered around a
 * per-question target average with some per-student spread.
 * @param {Number} total - max points for the question.
 * @param {Number} target_average_fraction - target average as a fraction of total (0-1).
 * @returns {Number} earned points, clamped to [0, total].
 */
function generateScore(total, target_average_fraction)
{
    const spread = 0.15; // +/- 15% swing around the target
    const random_offset = (Math.random() * 2 - 1) * spread;
    const fraction = Math.min(Math.max(target_average_fraction + random_offset, 0), 1);

    return Math.round(fraction * total);
}

async function seedDummyStudents()
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const assignments = await Assignment.find({}).lean();

        if (assignments.length === 0)
        {
            console.log('No Assignment documents found. Run migrateRubricsToAssignments.js first (or create assignments) before seeding dummy students.');
            await mongoose.disconnect();
            return;
        }

        console.log(`Found ${assignments.length} assignments, generating ${DUMMY_STUDENT_COUNT} dummy students...`);

        // Pick one target average per question so the class has a believable, consistent spread.
        const target_by_question_key = new Map();

        for (const assignment of assignments)
        {
            for (const question of assignment.questions)
            {
                const key = `${assignment.name}::${question.question_label}`;
                const target = 0.7 + Math.random() * 0.2; // targets land between 70% and 90%
                target_by_question_key.set(key, target);
            }
        }

        const student_ids = [];

        for (let i = 0; i < DUMMY_STUDENT_COUNT; i++)
        {
            const student_id = DUMMY_STUDENT_ID_START + i;
            student_ids.push(student_id);

            const first_name = FIRST_NAMES[i % FIRST_NAMES.length];
            const last_name = LAST_NAMES[(i * 3) % LAST_NAMES.length];

            const assignments_field = {};

            for (const assignment of assignments)
            {
                const questions_field = {};

                for (const question of assignment.questions)
                {
                    // Small chance this student is missing this particular question (absence, late, etc).
                    const is_missing = Math.random() < 0.05;

                    if (is_missing)
                    {
                        questions_field[question.question_label] = {
                            total: 100,
                            scores: [],
                            annotations: [],
                            missing: true
                        };
                        continue;
                    }

                    const total = 100;
                    const target_fraction = target_by_question_key.get(`${assignment.name}::${question.question_label}`);
                    const earned = generateScore(total, target_fraction);

                    questions_field[question.question_label] = {
                        total,
                        scores: [earned],
                        annotations: [],
                        missing: false
                    };
                }

                const question_scores = Object.values(questions_field)
                    .filter((q) => !q.missing)
                    .map((q) => (q.scores[0] / q.total) * 100);

                const assignment_grade = question_scores.length > 0
                    ? Math.round(question_scores.reduce((a, b) => a + b, 0) / question_scores.length)
                    : 0;

                assignments_field[assignment.name] = {
                    questions: questions_field,
                    grade: assignment_grade
                };
            }

            await Student.findOneAndUpdate(
                { student_id },
                {
                    student_id,
                    first_name,
                    last_name,
                    section: (i % 2) + 1,
                    assignments: assignments_field
                },
                { upsert: true }
            );
        }

        console.log(`Seeded ${student_ids.length} dummy students (student_id ${student_ids[0]}-${student_ids[student_ids.length - 1]}).`);

        await mongoose.disconnect();
        console.log('Done, disconnected');
    }
    catch (error)
    {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDummyStudents();