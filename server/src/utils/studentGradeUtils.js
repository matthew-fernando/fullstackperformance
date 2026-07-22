import Student from '../models/Student.js';

async function calculateClassAverageForQuestion(class_id, assignment_name, question_label)
{
    const existence_path = `assignments.${assignment_name}.questions.${question_label}`;

    const students = await Student.find({ class_id, [existence_path]: { $exists: true } }).lean();

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