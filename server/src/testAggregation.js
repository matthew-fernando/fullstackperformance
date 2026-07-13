import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Outcome from './models/Outcome.js';
import PerformanceIndicator from './models/PerformanceIndicator.js';
import { buildOutcomeRubricContext } from './utils/piAggregationUtils.js';
import Rubric from './models/Rubric.js';

dotenv.config();

async function run()
{
    await mongoose.connect(process.env.MONGODB_URI);

    const outcome_code = process.argv[2] || 'SO6';
    const outcome = await Outcome.findOne({ code: outcome_code });

    if (!outcome)
    {
        console.error(`No outcome found for code ${outcome_code}`);
        process.exit(1);
    }

    const pis = await PerformanceIndicator.find({ outcome_id: outcome._id });

    if (pis.length === 0)
    {
        console.error(`No PIs found for outcome ${outcome_code} — generate/save PIs first`);
        process.exit(1);
    }

    const context = await buildOutcomeRubricContext(outcome, pis);

    console.log(JSON.stringify(context, null, 2));

    await mongoose.disconnect();
}

run();