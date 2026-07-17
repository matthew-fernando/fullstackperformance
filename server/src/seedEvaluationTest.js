import 'dotenv/config';
import mongoose from 'mongoose';
import Outcome from './models/Outcome.js';
import PerformanceIndicator from './models/PerformanceIndicator.js';
import Assignment from './models/Assignment.js';
import LeafMapping from './models/LeafMapping.js';

const TEST_MARKER = 'EVAL_TEST';

/**
 * Recursively searches an array of TreeNode subdocuments for a node matching label.
 * @param {Array} nodes - array of TreeNode subdocuments to search.
 * @param {String} label - target node's label.
 * @returns {Object|null} the matching TreeNode subdocument, or null if not found.
 */
function findNodeByLabel(nodes, label)
{
    for (const node of nodes)
    {
        if (node.label === label)
        {
            return node;
        }

        if (node.children && node.children.length > 0)
        {
            const found = findNodeByLabel(node.children, label);

            if (found)
            {
                return found;
            }
        }
    }

    return null;
}

async function seedEvaluationTest()
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const outcome = await Outcome.findOne({ code: 'SO6' });

        if (!outcome)
        {
            throw new Error('SO6 not found — run seed.js first.');
        }

        const develop_node = findNodeByLabel(outcome.trees, 'DEVELOP');

        if (!develop_node)
        {
            throw new Error('DEVELOP node not found in SO6 tree.');
        }

        const plan_leaf = findNodeByLabel(outcome.trees, 'plan experiment');
        const paper_leaf = findNodeByLabel(outcome.trees, 'using paper');
        const software_leaf = findNodeByLabel(outcome.trees, 'using software');
        const leader_leaf = findNodeByLabel(outcome.trees, 'be a leader as well as a f');

        // Clean up any prior run of this test script so it's re-runnable.
        await Assignment.deleteMany({ name: TEST_MARKER });
        await PerformanceIndicator.deleteMany({ code: 'TEST-PI-DEVELOP' });
        console.log('Cleared previous evaluation test data');

        // Create the test PI, anchored at DEVELOP.
        const pi = await PerformanceIndicator.create({
            outcome_id: outcome._id,
            node_id: develop_node._id,
            code: 'TEST-PI-DEVELOP',
            title: 'Test PI — Develop Experiment',
            assessment_levels: []
        });

        const test_assignment = await Assignment.create({
            name: TEST_MARKER,
            questions: [
                { question_label: 'TEST-Q1', criteria: [] },
                { question_label: 'TEST-Q2', criteria: [] },
                { question_label: 'TEST-Q3', criteria: [] },
                { question_label: 'TEST-Q4', criteria: [] },
                { question_label: 'TEST-Q5', criteria: [] }
            ]
        });

        const question_by_label = new Map(
            test_assignment.questions.map((q) => [q.question_label, q])
        );

        await LeafMapping.deleteMany({ assignment_id: test_assignment._id });

        await LeafMapping.create([
            { outcome_id: outcome._id, node_id: plan_leaf._id, assignment_id: test_assignment._id, question_id: question_by_label.get('TEST-Q1')._id },
            { outcome_id: outcome._id, node_id: plan_leaf._id, assignment_id: test_assignment._id, question_id: question_by_label.get('TEST-Q2')._id },
            { outcome_id: outcome._id, node_id: paper_leaf._id, assignment_id: test_assignment._id, question_id: question_by_label.get('TEST-Q3')._id },
            { outcome_id: outcome._id, node_id: software_leaf._id, assignment_id: test_assignment._id, question_id: question_by_label.get('TEST-Q4')._id },
            { outcome_id: outcome._id, node_id: leader_leaf._id, assignment_id: test_assignment._id, question_id: question_by_label.get('TEST-Q5')._id }
        ]);

        console.log('Seeded test PI:', pi._id.toString());
        console.log('DEVELOP node normalized_weight:', develop_node.normalized_weight);
        console.log('Leaf weights -> plan:', plan_leaf.normalized_weight, '| paper:', paper_leaf.normalized_weight, '| software:', software_leaf.normalized_weight, '| leader:', leader_leaf.normalized_weight);
        console.log('\nExpected hand-calc (after running seedStudents.js):');
        console.log('  active leaves: plan(80), paper(85), software(95) — leader ungraded/excluded');
        console.log('  PI score  ~= 86.67');
        console.log('  coverage  ~= 0.66');
        console.log('\nNext: run `node src/seedStudents.js`, then `node src/testEvaluation.js`');

        await mongoose.disconnect();
        console.log('\nDone, disconnected');
    }
    catch (error)
    {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedEvaluationTest();
