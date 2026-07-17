import 'dotenv/config';
import mongoose from 'mongoose';
import Student from './models/Student.js';

const TEST_STUDENT_IDS = [900001, 900002, 900003];

/**
 * Builds a question entry in the shape stored on Student.assignments.
 * @param {Number} total - max points for the question.
 * @param {Number} earned - points earned (stored as a single-element scores array).
 * @returns {Object} question entry.
 */
function makeQuestion(total, earned)
{
    return {
        total,
        scores: [earned],
        annotations: [],
        missing: false
    };
}

async function seedStudents()
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        // Clean up any prior run.
        await Student.deleteMany({ student_id: { $in: TEST_STUDENT_IDS } });
        console.log('Cleared previous test students');

        // TEST-Q1 -> avg 70 (60, 70, 80)
        // TEST-Q2 -> avg 90 (85, 90, 95)
        // TEST-Q3 -> avg 85 (80, 85, 90)
        // TEST-Q4 -> avg 95 (90, 95, 100)
        // TEST-Q5 -> intentionally not present for any student, stays ungraded
        const students = [
            {
                student_id: TEST_STUDENT_IDS[0],
                first_name: 'Alice',
                last_name: 'Anderson',
                section: 1,
                assignments: {
                    EVAL_TEST: {
                        questions: {
                            'TEST-Q1': makeQuestion(100, 60),
                            'TEST-Q2': makeQuestion(100, 85),
                            'TEST-Q3': makeQuestion(100, 80),
                            'TEST-Q4': makeQuestion(100, 90)
                        },
                        grade: 79
                    }
                }
            },
            {
                student_id: TEST_STUDENT_IDS[1],
                first_name: 'Ben',
                last_name: 'Bishop',
                section: 1,
                assignments: {
                    EVAL_TEST: {
                        questions: {
                            'TEST-Q1': makeQuestion(100, 70),
                            'TEST-Q2': makeQuestion(100, 90),
                            'TEST-Q3': makeQuestion(100, 85),
                            'TEST-Q4': makeQuestion(100, 95)
                        },
                        grade: 85
                    }
                }
            },
            {
                student_id: TEST_STUDENT_IDS[2],
                first_name: 'Carla',
                last_name: 'Cruz',
                section: 1,
                assignments: {
                    EVAL_TEST: {
                        questions: {
                            'TEST-Q1': makeQuestion(100, 80),
                            'TEST-Q2': makeQuestion(100, 95),
                            'TEST-Q3': makeQuestion(100, 90),
                            'TEST-Q4': makeQuestion(100, 100)
                        },
                        grade: 91
                    }
                }
            }
        ];

        await Student.insertMany(students);

        console.log('Seeded', students.length, 'test students');
        console.log('\nExpected class averages:');
        console.log('  TEST-Q1 ~= 70');
        console.log('  TEST-Q2 ~= 90');
        console.log('  TEST-Q3 ~= 85');
        console.log('  TEST-Q4 ~= 95');
        console.log('  TEST-Q5: no data (ungraded)');

        await mongoose.disconnect();
        console.log('\nDone, disconnected');
    }
    catch (error)
    {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedStudents();
