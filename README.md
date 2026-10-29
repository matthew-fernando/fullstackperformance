# Full Stack Performance

A performance-evaluation platform that turns vague, high-level outcomes into concrete, measurable indicators, maps real graded work to them, generates grounded rubrics, and evaluates results.

It was built for **ABET accreditation**, helping professors break student outcomes into measurable performance indicators. The app is configurable, so the same pipeline can evaluate performance against any goal that can be decomposed, mapped to evidence, and scored. See [Beyond ABET](#beyond-abet).

---

## The Problem

Accreditation outcomes and performance goals are usually vague. For example, one of the outcomes is, "An ability to develop and conduct appropriate experimentation", which doesn't tell you what to grade, which assignments count, or whether a course is delivering on it.

Full Stack Performance closes that gap end to end:

1. **Break down** an outcome into a weighted tree of keywords.
2. **Generate** performance indicators (PIs) from that tree.
3. **Map** assignment questions to the tree's leaf nodes.
4. **Generate** assessment rubrics for each outcome, grounded in the PIs.
5. **Evaluate** performance with leaf, PI, and outcome scores plus true coverage.

---

## Features

### Tree editor
- React Flow canvas with Dagre auto-layout for default positions and free drag-to-arrange
- Outcomes can have multiple root trees, created by highlighting keywords in the outcome statement
- Hold-to-add-multiple children
- **Logical nodes** that carry only a weight and threshold, for rules like "2 of these 3"
- Configurable thresholds per node, displayed as "All" when every child is required
- Deletion with cascade rules; nodes locked by PIs are protected
- Weights normalized so siblings sum correctly and every outcome totals 100%

### PI generation
- Three modes feeding one pipeline: **Manual** (pick nodes), **Fixed** (top N by weight), and **Weighted** (everything above a threshold)
- Unified flow: selection, then review and edit, then generate
- LLM-assisted, with Gemini as the primary provider and Ollama as a local fallback

### Rubric generation
- One LLM call per outcome, so tone and structure stay consistent across PIs
- Assessment levels embedded on each PI
- Percentage boundaries use an N-1 boundary-value model (0 and 100 are implicit)

### Evaluation engine
- Computes leaf, PI, and outcome scores
- Coverage reflects true weighted-tree coverage: the sum of `pi.normalized_weight × pi.coverage` across all PIs

### Multi-class support
- Classes contain outcomes, each with its own trees, PIs, and mappings
- Compound indexes throughout (e.g. `class_id + node_id`, `class_id + student_id`)

### UI
- Consistent design system with a collapsible sidebar (state persisted in localStorage)
- `MainLayout` and `CourseLayout` shells
- Two-step arm-then-confirm deletion across all entity types

---

## Core Concepts

| Concept | Description |
|---|---|
| **Class** | A course context that contains outcomes and everything attached to them. |
| **Outcome** | A high-level goal with a `code` and `statement` (e.g. `SO6`). |
| **Tree / TreeNode** | A recursive weighted structure per outcome. Node types are `root`, `keyword`, and `logical`. |
| **Performance Indicator (PI)** | A measurable indicator derived from tree nodes, with embedded assessment levels. |
| **LeafMapping** | Links an assignment question to a leaf node of the tree. |
| **Assignment rubric** | Real grading criteria for a question, used to ground generated PI descriptors. |

### Weight normalization

A node's `normalized_weight` is its raw weight divided by the sum of its sibling weights, multiplied by its parent's `normalized_weight`. This cascades down, so a node's children always sum to that node's own value. All of an outcome's root trees are siblings that sum to `1`.

Because of floating-point arithmetic, sums can land at values like `0.9999999999999999`. Equality checks use a tolerance, never `===`.

### Thresholds

`threshold` is stored as a number. "All" is a display label shown when `threshold === children.length`.

---

## Tech Stack

- **Frontend:** React, Vite, React Router, React Flow (`@xyflow/react`), Dagre, lucide-react. Plain JavaScript.
- **Backend:** Node.js, Express (ESM modules), plain JavaScript
- **Database:** MongoDB with Mongoose
- **LLM calls:** server-side only, behind a service layer. The frontend never calls an LLM API directly.
- **Docs and typing:** JSDoc in place of TypeScript

---

## Project Structure

```
/
├── client/                  # Vite + React app
│   └── src/
│       ├── App.jsx
│       ├── OutcomeTreePage.jsx      # Outcome picker, text highlighting, tree canvas
│       ├── TreeNodeComponent.jsx    # Custom React Flow node
│       ├── treeFlowUtils.js         # Nested tree -> React Flow nodes/edges
│       ├── treeStateUtils.js        # Pure add/delete/update operations on the tree
│       └── dagreLayout.js           # Default auto-layout
└── server/                  # Express API
    └── src/
        ├── app.js
        ├── server.js
        ├── db.js
        ├── seed.js                  # Seeds the 7 ABET outcomes
        ├── models/Outcome.js
        ├── controllers/outcomeController.js
        ├── routes/outcomeRoutes.js
        └── utils/treeUtils.js       # normalizeSiblings
```

---

## Getting Started

### Prerequisites

- Node.js
- MongoDB running locally

### Setup

```bash
# Server
cd server
npm install
```

Create `server/.env`:

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/fullstackperformance
```

> Port 5001 is used because macOS's AirPlay Receiver occupies 5000.

```bash
node src/seed.js    # seed the outcomes (clears and reinserts)
npm start           # or: node src/server.js
```

```bash
# Client (in a second terminal)
cd client
npm install
npm run dev
```

### API (current)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/outcomes` | List all outcomes |
| `POST` | `/api/outcomes` | Create an outcome |
| `GET` | `/api/outcomes/:id` | Fetch one outcome with its trees |

---

## Beyond ABET

ABET is the first use case, not a limit of the design. Nothing in the core engine knows what ABET is. The pipeline only needs:

- a **top-level goal** (an outcome)
- a way to **decompose** it into weighted, logic-aware pieces (the tree)
- **measurable indicators** derived from those pieces (PIs)
- **evidence** that maps to those indicators (graded items and their rubrics)
- **performance levels** to score against

Each of these is data, not hard-coded behavior, so the platform can be adapted to other frameworks:

| Domain | "Outcome" becomes | "Question / item" becomes |
|---|---|---|
| **Other accreditors** (AACSB, regional accreditation) | Learning goals or standards | Assignments, exams |
| **Program / curriculum assessment** | Program learning objectives | Course assessments |
| **Medical and nursing education** | Clinical competencies (e.g. "Patient Care", "Communication") | Clinical exams, simulations, preceptor evaluations |
| **Resident and trainee evaluation** | Milestones or entrustable professional activities | Direct observations, procedure logs, rotation assessments |
| **Clinical competency assessment** | Required skills for a role (e.g. "Medication Safety") | Skills checklists, supervised procedures, case reviews |
| **Healthcare quality and program evaluation** | Quality or care-delivery goals | Audits, chart reviews, performance metrics |
| **Corporate competency frameworks** | Competencies (e.g. "Leadership") | Projects, reviews, evaluations |
| **Employee performance reviews** | Role expectations or OKRs | Deliverables, feedback cycles |
| **Training and certification** | Certification domains | Practical tests, quizzes |
| **Skills-gap analysis** | Required skills | Evidence of skill demonstrated |

### What makes this work

- **Outcome-agnostic.** The 7 ABET outcomes are only seed data. Outcomes are ordinary documents, so any framework's goals can be loaded in their place.
- **Configurable performance levels.** Levels (Beginning / Developing / Proficient / Exemplary, or any number and labels you choose) are set by the user, not fixed. Every PI shares the same level set so the rubric stays square.
- **Logic, not just hierarchy.** Logical nodes with thresholds let you express rules like "satisfied if 2 of 3 sub-skills are met" for any domain.
- **Grounded generation.** Rubric descriptors are generated from the real grading criteria of mapped items, so they reflect actual practice in whatever domain you apply them to.
- **Templates.** A framework set up once can be reused across many instances (semesters, cohorts, review cycles, teams).

### Adapting it to a new framework

1. Replace or extend the seed data with your framework's outcomes or goals.
2. Break each goal into trees using the editor.
3. Choose your performance levels.
4. Map your own assessable work to the generated indicators.

Terminology in the UI is currently ABET and education oriented (professor, course, assignment). Making those labels configurable is a planned step toward fully domain-neutral use.

---

## Conventions

- **Naming:** PascalCase for components and classes, camelCase for functions, snake_case for variables
- **Style:** Allman braces (opening brace on its own line)
- **State:** the nested `trees` array is the single source of truth in the editor; React Flow's flat nodes and edges are regenerated from it
- **Pure utilities:** tree operations return new structures instead of mutating