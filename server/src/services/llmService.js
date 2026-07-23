import * as geminiService from './geminiService.js';
import * as ollamaService from './ollamaService.js';

// ============================================================
// SWITCH MODEL HERE
// ============================================================
const LLM_PROVIDER = 'gemini';     // 'gemini' | 'ollama'
const LLM_MODEL = 'gemma-4-31b-it';    // gemma-4-31b-it, gemma4:12b, etc.
// ============================================================

const providers =
{
    gemini: geminiService,
    ollama: ollamaService
};

const active_provider = providers[LLM_PROVIDER];

if (!active_provider)
{
    throw new Error(`Unknown LLM_PROVIDER "${LLM_PROVIDER}" — expected "gemini" or "ollama"`);
}

// --- TEMP: verification logging, safe to delete once you're done testing models ---
console.log(`\n[llmService] ACTIVE → provider: ${LLM_PROVIDER} | model: ${LLM_MODEL}\n`);

function tagWithModelMeta(result)
{
    const meta = { provider: LLM_PROVIDER, model: LLM_MODEL };

    if (Array.isArray(result))
    {
        result._llm_meta = meta; // non-enumerable-ish, won't show in JSON.stringify of array by default
        return result;
    }

    return { ...result, _llm_meta: meta };
}
// --- END TEMP ---

async function generatePIsFromNodes(selected_nodes, outcome)
{
    console.log(`[llmService] generatePIsFromNodes → ${LLM_PROVIDER}/${LLM_MODEL}`); // TEMP
    const result = await active_provider.generatePIsFromNodes(selected_nodes, outcome, LLM_MODEL);
    return tagWithModelMeta(result);
}

async function generateOutcomeRubric(outcome, level_count, pi_contexts)
{
    console.log(`[llmService] generateOutcomeRubric → ${LLM_PROVIDER}/${LLM_MODEL}`); // TEMP
    const result = await active_provider.generateOutcomeRubric(outcome, level_count, pi_contexts, LLM_MODEL);
    return tagWithModelMeta(result);
}

export { generatePIsFromNodes, generateOutcomeRubric };