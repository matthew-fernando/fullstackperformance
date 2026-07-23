import { getHardcodedLabels } from '../constants/rubricLevelLabels.js';

function buildPIPrompt(selected_nodes, outcome)
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

function buildRubricPrompt(outcome, level_count, pi_contexts)
{
    const hardcoded_labels = getHardcodedLabels(level_count);

    const label_instruction = hardcoded_labels
        ? `Use exactly these ${level_count} level labels, in this order, low to high: ${JSON.stringify(hardcoded_labels)}.`
        : `Invent exactly ${level_count} level labels yourself, ordered low to high (e.g. progressing from something like "Beginning" up through something like "Exemplary"), appropriate for an ABET performance rubric. Keep each label to one or two words.`;

    const pis_for_prompt = pi_contexts.map(pi => ({
        pi_id: pi.pi_id,
        pi_code: pi.pi_code,
        pi_text: pi.pi_text,
        leaf_contexts: pi.leaf_contexts
    }));

    return `You are helping a professor create an ABET Outcome Grading Rubric for a course.

Student Outcome: "${outcome.statement}"
Outcome code: ${outcome.code}

The rubric has ${level_count} assessment levels, shared across every Performance Indicator (PI) — every PI uses the same set of level labels. ${label_instruction}

Below is each PI for this outcome, along with the real grading rubric criteria from every assignment question that has been mapped to it (via the leaf nodes beneath that PI in the course's outcome tree). Some PIs may have no mapped questions yet — for those, write reasonable descriptors based on the PI's own text alone, since there is no grounding data available.

PIs with grounding data (JSON):
${JSON.stringify(pis_for_prompt, null, 2)}

For each PI, write exactly ${level_count} descriptor strings, one per level, ordered from lowest to highest performance:
- The lowest level should describe failure to meet the PI, using language like "cannot," "fails to," or "does not demonstrate."
- The highest level should describe full mastery, using language like "consistently," "fully," or "completely."
- Middle levels should show clear, distinguishable gradation between the lowest and highest — not just minor rewording.
- Ground each descriptor in the actual criteria and deduction categories from the mapped questions where available (e.g. reference the kinds of mistakes or successes described in the criteria), rather than writing generic language.
- Each descriptor should be a single sentence or short clause suitable for a rubric cell — not a paragraph.
- Descriptors across different PIs should read consistently in tone and adjective strength at the same level (e.g. every PI's lowest level should feel comparably harsh, every PI's highest level comparably strong).

Return ONLY a JSON object, no markdown formatting, no preamble, in this exact shape:
{
  "levels": [
    { "order": 0, "label": "the lowest level label" },
    { "order": ${level_count - 1}, "label": "the highest level label" }
  ],
  "rows": [
    {
      "pi_id": "the pi_id from input",
      "pi_code": "the pi_code from input",
      "descriptors": [
        { "order": 0, "text": "descriptor for the lowest level" },
        { "order": ${level_count - 1}, "text": "descriptor for the highest level" }
      ]
    }
  ]
}

Include all ${level_count} levels (order 0 through ${level_count - 1}) for the "levels" array, and all ${level_count} descriptors for every row in "rows" — the example above only shows the first and last entries for brevity.`;
}

export { buildPIPrompt, buildRubricPrompt };