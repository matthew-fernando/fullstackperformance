import 'dotenv/config';
import mongoose from 'mongoose';
import Class from './models/Class.js';
import Assignment from './models/Assignment.js';
import Student from './models/Student.js';

const DUMMY_STUDENT_COUNT = 15;
const DUMMY_STUDENT_ID_START = 800001;

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Drew', 'Skyler', 'Reese', 'Cameron', 'Peyton', 'Dakota'];
const LAST_NAMES = ['Nguyen', 'Garcia', 'Smith', 'Patel', 'Kim', 'Rossi', 'Johnson', 'Chen', 'Martinez', 'Brown', 'Lee', 'Davis', 'Khan', 'Wilson', 'Torres'];

const TEST_ASSIGNMENTS =
[
    {
        name: 'HW1',
        questions:
        [
            { question_label: 'Q1', criteria: [{ desc: 'Correct setup', points: 50, deduction: ['Wrong units', 'Missing steps'] }] },
            { question_label: 'Q2', criteria: [{ desc: 'Correct result', points: 50, deduction: ['Sign error', 'Rounding error'] }] }
        ]
    },
    {
        name: 'Lab1',
        questions:
        [
            { question_label: 'E1', criteria: [{ desc: 'Followed procedure', points: 40, deduction: ['Skipped step', 'Wrong order'] }] },
            { question_label: 'E2', criteria: [{ desc: 'Correct analysis', points: 60, deduction: ['Missing units', 'Incomplete conclusion'] }] }
        ]
    }
];

function generateScore(total, target_average_fraction)
{
    const spread = 0.15;
    const random_offset = (Math.random() * 2 - 1) * spread;
    const fraction = Math.min(Math.max(target_average_fraction + random_offset, 0), 1);

    return Math.round(fraction * total);
}

async function seedClassTestData()
{
    const class_id = process.argv[2];

    if (!class_id)
    {
        console.error('Usage: node src/seedClassTestData.js <class_id>');
        process.exit(1);
    }

    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const class_doc = await Class.findById(class_id);

        if (!class_doc)
        {
            console.error(`No Class found with id ${class_id}`);
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`Seeding test data for class: ${class_doc.course_code} — ${class_doc.course_name}`);

        await Assignment.deleteMany({ class_id });
        await Student.deleteMany({ class_id });
        console.log('Cleared any existing assignments/students for this class');

        const assignments = await Assignment.insertMany(
            TEST_ASSIGNMENTS.map(assignment => ({ ...assignment, class_id }))
        );
        console.log(`Created ${assignments.length} assignments`);

        const target_by_question_key = new Map();

        for (const assignment of assignments)
        {
            for (const question of assignment.questions)
            {
                const key = `${assignment.name}::${question.question_label}`;
                target_by_question_key.set(key, 0.7 + Math.random() * 0.2);
            }
        }

        const students = [];

        for (let i = 0; i < DUMMY_STUDENT_COUNT; i++)
        {
            const student_id = DUMMY_STUDENT_ID_START + i;
            const first_name = FIRST_NAMES[i % FIRST_NAMES.length];
            const last_name = LAST_NAMES[(i * 3) % LAST_NAMES.length];

            const assignments_field = {};

            for (const assignment of assignments)
            {
                const questions_field = {};

                for (const question of assignment.questions)
                {
                    const is_missing = Math.random() < 0.05;

                    if (is_missing)
                    {
                        questions_field[question.question_label] = { total: 100, scores: [], annotations: [], missing: true };
                        continue;
                    }

                    const total = 100;
                    const target_fraction = target_by_question_key.get(`${assignment.name}::${question.question_label}`);
                    const earned = generateScore(total, target_fraction);

                    questions_field[question.question_label] = { total, scores: [earned], annotations: [], missing: false };
                }

                const question_scores = Object.values(questions_field)
                    .filter(q => !q.missing)
                    .map(q => (q.scores[0] / q.total) * 100);

                const assignment_grade = question_scores.length > 0
                    ? Math.round(question_scores.reduce((a, b) => a + b, 0) / question_scores.length)
                    : 0;

                assignments_field[assignment.name] = { questions: questions_field, grade: assignment_grade };
            }

            students.push({
                class_id,
                student_id,
                first_name,
                last_name,
                section: (i % 2) + 1,
                assignments: assignments_field
            });
        }

        await Student.insertMany(students);
        console.log(`Seeded ${students.length} dummy students (student_id ${DUMMY_STUDENT_ID_START}-${DUMMY_STUDENT_ID_START + students.length - 1})`);

        await mongoose.disconnect();
        console.log('Done, disconnected');
    }
    catch (error)
    {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedClassTestData();