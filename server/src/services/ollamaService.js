import { buildPIPrompt, buildRubricPrompt } from './promptBuilders.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'gemma4:12b';

async function callOllama(prompt, model)
{
    const model_to_use = model || DEFAULT_OLLAMA_MODEL;

    let response;
    try
    {
        response = await fetch(`${OLLAMA_BASE_URL}/api/chat`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
            {
                model: model_to_use,
                messages: [
                    // 1. Add a strict system prompt to disable reasoning
                    { 
                        role: 'system', 
                        content: 'You are a strict data processor. Do not use step-by-step reasoning, do not explain your thought process, and do not output <think> tags. Provide ONLY valid JSON.' 
                    },
                    { 
                        role: 'user', 
                        content: prompt 
                    }
                ],
                format: 'json',
                stream: false,
                // 2. Add options to drop the temperature
                options: {
                    temperature: 0
                }
            })
        });
    }
    catch (error)
    {
        const service_error = new Error(`Could not reach Ollama at ${OLLAMA_BASE_URL} — is it running? (ollama serve)`);
        service_error.is_retryable = true;
        throw service_error;
    }

    if (!response.ok)
    {
        const body_text = await response.text();

        if (response.status === 404)
        {
            const service_error = new Error(`Ollama model "${model_to_use}" not found — run: ollama pull ${model_to_use}`);
            throw service_error;
        }

        const service_error = new Error(`Ollama request failed (${response.status}): ${body_text}`);
        service_error.is_retryable = true;
        throw service_error;
    }

    const data = await response.json();
    const raw_text = data.message?.content ?? '';

    // --- TEMP: verification logging, safe to delete once you're done testing models ---
    console.log(`\n[ollamaService] RAW OUTPUT from ${model_to_use}:\n${raw_text}\n`);
    // --- END TEMP ---

    let parsed;

    try
    {
        parsed = JSON.parse(raw_text);
    }
    catch (parse_error)
    {
        throw new Error(`Ollama (${model_to_use}) did not return valid JSON: ${raw_text.slice(0, 200)}`);
    }

    // Local models often wrap the array in an object instead of returning it bare
    // (e.g. { "pis": [...] } or { "result": [...] }) even when told not to.
    if (!Array.isArray(parsed) && parsed && typeof parsed === 'object')
    {
        const array_candidate = Object.values(parsed).find(value => Array.isArray(value));

        if (array_candidate)
        {
            console.log(`[ollamaService] Unwrapped array from key inside object response`); // TEMP
            return array_candidate;
        }
    }

    return parsed;
}


async function generatePIsFromNodes(selected_nodes, outcome, model)
{
    const prompt = buildPIPrompt(selected_nodes, outcome);
    return callOllama(prompt, model);
}

async function generateOutcomeRubric(outcome, level_count, pi_contexts, model)
{
    const prompt = buildRubricPrompt(outcome, level_count, pi_contexts);
    return callOllama(prompt, model);
}

export { generatePIsFromNodes, generateOutcomeRubric };