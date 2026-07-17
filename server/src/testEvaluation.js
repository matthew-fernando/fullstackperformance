import 'dotenv/config';
import mongoose from 'mongoose';
import PerformanceIndicator from './models/PerformanceIndicator.js';
import { calculatePIScoreFromLeaves, calculateOutcomeScore } from './utils/evaluationEngine.js';

async function testEvaluation()
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected\n');

        const pi = await PerformanceIndicator.findOne({ code: 'TEST-PI-DEVELOP' });

        if (!pi)
        {
            throw new Error('TEST-PI-DEVELOP not found — run seedEvaluationTest.js first.');
        }

        const result = await calculatePIScoreFromLeaves(pi._id);

        console.log('--- Leaf breakdown ---');
        result.leaf_scores.forEach((leaf) =>
        {
            console.log(
                `  node_id: ${leaf.node_id} | active: ${leaf.is_active} | score: ${leaf.score} | weight: ${leaf.normalized_weight} | graded ${leaf.graded_question_count}/${leaf.total_question_count} questions`
            );
        });

        console.log('\n--- PI result ---');
        console.log('PI score:', result.score);
        console.log('Coverage:', result.coverage);
        console.log('Active leaves:', result.active_leaf_count, '/', result.total_leaf_count);

        console.log('\n--- Expected (hand-calc) ---');
        console.log('PI score  ~= 86.67');
        console.log('Coverage  ~= 0.66');

        const outcome_result = await calculateOutcomeScore(pi.outcome_id);

        console.log('\n--- Outcome result ---');
        console.log('Outcome score:', outcome_result.score);
        console.log('Outcome coverage:', outcome_result.coverage);
        console.log('Active PIs:', outcome_result.active_pi_count, '/', outcome_result.total_pi_count);

        await mongoose.disconnect();
        console.log('\nDone, disconnected');
    }
    catch (error)
    {
        console.error('Test error:', error);
        process.exit(1);
    }
}

testEvaluation();
