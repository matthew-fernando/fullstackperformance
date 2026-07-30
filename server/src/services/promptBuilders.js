import { getHardcodedLabels } from '../constants/rubricLevelLabels.js';

function buildPIPrompt(selected_nodes, outcome)
{
    const outcome_number = outcome.code.replace('SO', '');

    const nodes_for_prompt = selected_nodes.map(entry => ({
        node_id: entry.node_id,
        path: entry.path,
        subtree: entry.subtree
    }));

    return `You are helping a professor generate ABET Performance Indicators (PIs) for a course.

Student Outcome:
"${outcome.statement}"

Outcome Code:
"${outcome.code}"

The professor has selected one or more nodes from a weighted concept tree. Each selected node represents the root of a subtree that defines a measurable learning competency.

Selected nodes with complete subtrees (JSON):
${JSON.stringify(nodes_for_prompt, null, 2)}

For EACH selected node, generate EXACTLY ONE Performance Indicator.

Requirements:

1. Represent the entire selected subtree.
   - The PI must reflect the selected node AND all meaningful descendants beneath it.
   - Do not ignore deeper descendants simply because they are several levels below the selected node.

2. Use the tree hierarchy.
   - Parent nodes describe the overall competency.
   - Child and grandchild nodes provide the specific skills or knowledge that define that competency.
   - Do not reduce the PI to only the deepest leaf nodes.

3. Follow the normalized weights.
   - Use normalized_weight to determine emphasis, not inclusion.
   - Higher-weight branches should receive noticeably more emphasis.
   - Lower-weight branches should still be acknowledged briefly.
   - Sibling concepts with similar weights should receive similar emphasis.
   - Do NOT give every concept equal attention.

4. Synthesize rather than list.
   - Do NOT enumerate keywords.
   - Infer the educational competency represented by the subtree.
   - Combine concepts naturally into one measurable learning outcome.

5. Write like an experienced professor.
   - Produce one concise Performance Indicator.
   - Prefer 20–35 words.
   - Avoid unnecessary adjectives or filler.
   - Use clear, measurable educational language suitable for ABET assessment.

6. Do not hallucinate.
   - Do not introduce concepts that are not present in the subtree.
   - If a concept is not represented in the selected subtree, do not mention it.

7. Keep the highest-weight concept central.
   - The dominant weighted branch should define the primary competency.
   - Lower-weight branches should support that competency rather than compete with it.

Good emphasis example:

Weights:
Data Structures (3)
├── Hash Maps (2)
└── Arrays (1)

Better:
"Students demonstrate the ability to apply fundamental data structures, particularly hash maps while recognizing related structures such as arrays."

Worse:
"Students demonstrate knowledge of arrays, hash maps, data structures, sorting, trees, and algorithms."

Return ONLY a JSON array.

[
  {
    "node_id": "<node_id>",
    "code": "PI ${outcome_number}.1",
    "title": "<performance indicator>"
  }
]

Number sequentially beginning with PI ${outcome_number}.1.`;
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