const { GoogleGenAI } = require('@google/genai');

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generatePIsFromNodes(selected_nodes, outcome)
{
    const prompt = buildPrompt(selected_nodes, outcome);

    let response;
    try
    {
        response = await genai.models.generateContent(
        {
            model: 'gemma-4-31b-it',
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

    const raw_text = response.text;
    return JSON.parse(raw_text);
}

function buildPrompt(selected_nodes, outcome)
{
    const outcome_number = outcome.code.replace('SO', '');

    const nodes_for_prompt = selected_nodes.map(entry => ({
        node_id: entry.node_id,
        path: entry.path,
        subtree: entry.subtree
    }));

    return `You are helping a professor create ABET Performance Indicators (PIs) for a course.

Student Outcome: "${outcome.statement}"
Outcome code: ${outcome.code}

The professor has selected the following nodes from their course-specific breakdown of this outcome. Each selected node, along with its ENTIRE subtree of children, should be synthesized into exactly ONE Performance Indicator.

Selected nodes with full subtrees (JSON):
${JSON.stringify(nodes_for_prompt, null, 2)}

For each selected node:
- Write ONE Performance Indicator that represents the selected node AND everything beneath it in its subtree.
- Give each child concept emphasis in the PI's wording proportional to its normalized_weight relative to its siblings. A child weighted much higher than its siblings should be clearly reflected in the PI; a child weighted much lower should still be mentioned, but more briefly or as a secondary consideration. Children with equal weight should receive roughly equal emphasis.
- Go deep into nested children, not just the immediate children, when writing the PI. A grandchild with high relative weight matters just as much as a direct child with high relative weight.
- The PI should read as ONE coherent sentence or short clause, not a list — synthesize the subtree into natural, assessable language, the way an experienced professor would describe what they are actually measuring.

Return ONLY a JSON array, no markdown formatting, no preamble, in this exact shape:
[
  {
    "node_id": "the node_id from input",
    "code": "PI ${outcome_number}.1",
    "title": "the performance indicator sentence"
  }
]

Number the codes sequentially starting from 1 in the order given, using the format "PI ${outcome_number}.N".`;
}

module.exports = { generatePIsFromNodes };