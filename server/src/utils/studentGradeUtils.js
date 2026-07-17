import Student from '../models/Student.js';

/**
 * Calculates a single question's class average as a percentage, by scanning every
 * Student record for that assignment/question, summing each student's scores against
 * the question's total, and averaging across students who were actually graded.
 * @param {String} assignment_name - matches Assignment.name / the Student gradebook key.
 * @param {String} question_label - matches Assignment.questions[].question_label / the Student gradebook key.
 * @returns {Promise<Number|null>} class average percentage (0-100), or null if no students have a graded entry.
 */
async function calculateClassAverageForQuestion(assignment_name, question_label)
{
    const existence_path = `assignments.${assignment_name}.questions.${question_label}`;

    const students = await Student.find({ [existence_path]: { $exists: true } }).lean();

    const percentages = [];

    for (const student of students)
    {
        const assignment = student.assignments?.[assignment_name];
        const question = assignment?.questions?.[question_label];

        if (!question || question.missing)
        {
            continue;
        }

        if (!question.total || question.total <= 0)
        {
            continue;
        }

        const earned = (question.scores || []).reduce((sum, score) => sum + score, 0);
        percentages.push((earned / question.total) * 100);
    }

    if (percentages.length === 0)
    {
        return null;
    }

    const sum = percentages.reduce((acc, percentage) => acc + percentage, 0);

    return sum / percentages.length;
}

export { calculateClassAverageForQuestion };