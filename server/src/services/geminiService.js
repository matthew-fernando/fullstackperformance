import { GoogleGenAI } from '@google/genai';
import { buildPIPrompt, buildRubricPrompt } from './promptBuilders.js';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_GEMINI_MODEL = 'gemma-4-31b-it';

async function generatePIsFromNodes(selected_nodes, outcome, model)
{
    const model_to_use = model || DEFAULT_GEMINI_MODEL;
    const prompt = buildPIPrompt(selected_nodes, outcome);

    let response;
    try
    {
        response = await genai.models.generateContent(
        {
            model: model_to_use,
            contents: prompt,
            config:
            {
                thinkingConfig: { thinkingLevel: 'MINIMAL' },
                responseMimeType: 'application/json'
            }
        });
    }
    catch (error)
    {
        if (error.status === 503)
        {
            const service_error = new Error('Gemini is temporarily overloaded, please try again');
            service_error.is_retryable = true;
            throw service_error;
        }
        throw error;
    }

    return JSON.parse(response.text);
}

async function generateOutcomeRubric(outcome, level_count, pi_contexts, model)
{
    const model_to_use = model || DEFAULT_GEMINI_MODEL;
    const prompt = buildRubricPrompt(outcome, level_count, pi_contexts);

    let response;
    try
    {
        response = await genai.models.generateContent(
        {
            model: model_to_use,
            contents: prompt,
            config:
            {
                responseMimeType: 'application/json'
            }
        });
    }
    catch (error)
    {
        if (error.status === 503)
        {
            const service_error = new Error('Gemini is temporarily overloaded, please try again');
            service_error.is_retryable = true;
            throw service_error;
        }
        throw error;
    }

    return JSON.parse(response.text);
}

export { generatePIsFromNodes, generateOutcomeRubric };