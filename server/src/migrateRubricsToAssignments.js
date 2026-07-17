import 'dotenv/config';
import mongoose from 'mongoose';
import Assignment from './models/Assignment.js';

async function migrateRubricsToAssignments()
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const db = mongoose.connection.db;
        const old_rubrics = await db.collection('rubrics').find({}).toArray();

        if (old_rubrics.length === 0)
        {
            console.log('No documents found in the old "rubrics" collection. Nothing to migrate.');
            await mongoose.disconnect();
            return;
        }

        console.log(`Found ${old_rubrics.length} old rubric ("question") documents.`);

        // Group old rubrics by assignment name.
        const rubrics_by_assignment = new Map();

        for (const rubric of old_rubrics)
        {
            if (!rubrics_by_assignment.has(rubric.assignment))
            {
                rubrics_by_assignment.set(rubric.assignment, []);
            }
            rubrics_by_assignment.get(rubric.assignment).push(rubric);
        }

        // old_rubric_id (as string) -> { assignment_id, question_id }
        const id_translation_map = new Map();

        for (const [assignment_name, rubrics] of rubrics_by_assignment.entries())
        {
            const existing = await Assignment.findOne({ name: assignment_name });

            if (existing)
            {
                console.log(`Assignment "${assignment_name}" already exists in the new collection, skipping creation but still mapping IDs.`);

                for (const rubric of rubrics)
                {
                    const question = existing.questions.find((q) => q.question_label === rubric.question_id);

                    if (question)
                    {
                        id_translation_map.set(String(rubric._id), {
                            assignment_id: existing._id,
                            question_id: question._id
                        });
                    }
                }

                continue;
            }

            const assignment = await Assignment.create({
                name: assignment_name,
                questions: rubrics.map((rubric) => ({
                    question_label: rubric.question_id,
                    criteria: rubric.criteria || []
                }))
            });

            rubrics.forEach((rubric, index) =>
            {
                id_translation_map.set(String(rubric._id), {
                    assignment_id: assignment._id,
                    question_id: assignment.questions[index]._id
                });
            });

            console.log(`Created assignment "${assignment_name}" with ${rubrics.length} questions.`);
        }

        // Repoint existing LeafMapping documents from rubric_id -> assignment_id/question_id.
        const old_mappings = await db.collection('leaf_mappings').find({ rubric_id: { $exists: true } }).toArray();

        let updated_count = 0;
        let skipped_count = 0;

        for (const mapping of old_mappings)
        {
            const translation = id_translation_map.get(String(mapping.rubric_id));

            if (!translation)
            {
                console.warn(`No translation found for old rubric_id ${mapping.rubric_id} on mapping ${mapping._id}, skipping.`);
                skipped_count++;
                continue;
            }

            await db.collection('leaf_mappings').updateOne(
                { _id: mapping._id },
                {
                    $set: { assignment_id: translation.assignment_id, question_id: translation.question_id },
                    $unset: { rubric_id: '' }
                }
            );

            updated_count++;
        }

        console.log(`Updated ${updated_count} leaf mappings, skipped ${skipped_count}.`);
        console.log('\nMigration complete. The old "rubrics" collection was left untouched (not dropped) as a safety net.');
        console.log('Once you\'ve confirmed everything works, you can drop it manually in Compass.');

        await mongoose.disconnect();
        console.log('Done, disconnected');
    }
    catch (error)
    {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateRubricsToAssignments();