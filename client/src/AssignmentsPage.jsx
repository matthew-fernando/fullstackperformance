import { useState, useEffect, useCallback } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { treesToFlow } from './treeFlowUtils.js';
import { layoutWithDagre } from './dagreLayout.js';
import AssignmentLeafNode from './AssignmentLeafNode.jsx';

const API_BASE = 'http://localhost:5001/api';
const nodeTypes = { treeNode: AssignmentLeafNode };

function countChildren(node_array, id_to_count_map)
{
	node_array.forEach((node) =>
	{
		id_to_count_map[node._id] = node.children.length;
		countChildren(node.children, id_to_count_map);
	});
}

function AssignmentsPage()
{
	const [rubrics, setRubrics] = useState([]);
	const [selectedRubricId, setSelectedRubricId] = useState(null);
	const [outcomes, setOutcomes] = useState([]);
	const [selectedOutcomeId, setSelectedOutcomeId] = useState('');
	const [trees, setTrees] = useState([]);
	const [selectedLeafIds, setSelectedLeafIds] = useState(new Set());
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [saveStatus, setSaveStatus] = useState('');
	const [expandedAssignments, setExpandedAssignments] = useState(new Set());
	const [linkedMap, setLinkedMap] = useState(new Map()); // node_id -> mapping_id
	const [initialLeafIds, setInitialLeafIds] = useState(new Set());

	useEffect(() =>
	{
		fetch(`${API_BASE}/rubrics`).then((res) => res.json()).then(setRubrics);
		fetch(`${API_BASE}/outcomes`).then((res) => res.json()).then(setOutcomes);
	}, []);
	
	
	useEffect(() =>
	{
		if (!selectedOutcomeId)
		{
			setTrees([]);
			return;
		}

		fetch(`${API_BASE}/outcomes/${selectedOutcomeId}`)
			.then((res) => res.json())
			.then((outcome) =>
			{
				setTrees(outcome.trees);
			});
	}, [selectedOutcomeId]);

	useEffect(() =>
	{
		if (!selectedOutcomeId || !selectedRubricId)
		{
			setLinkedMap(new Map());
			setInitialLeafIds(new Set());
			setSelectedLeafIds(new Set());
			return;
		}

		fetch(`${API_BASE}/outcomes/${selectedOutcomeId}/leaf-mappings`)
			.then((res) => res.json())
			.then((mappings) =>
			{
				const relevant = mappings.filter((m) => m.rubric_id._id === selectedRubricId);
				const node_ids = relevant.map((m) => m.node_id);
				const map = new Map(relevant.map((m) => [m.node_id, m._id]));

				setLinkedMap(map);
				setInitialLeafIds(new Set(node_ids));
				setSelectedLeafIds(new Set(node_ids));
			});
	}, [selectedOutcomeId, selectedRubricId]);

	const toggleLeaf = useCallback((node_id) =>
	{
		setSelectedLeafIds((prev) =>
		{
			const next = new Set(prev);
			if (next.has(node_id))
			{
				next.delete(node_id);
			}
			else
			{
				next.add(node_id);
			}
			return next;
		});
	}, []);

	function rebuildFlow(updated_trees, current_selected_leaf_ids)
	{
		const { nodes: flow_nodes, edges: flow_edges } = treesToFlow(updated_trees);

		const child_count_map = {};
		countChildren(updated_trees, child_count_map);

		const enriched_nodes = flow_nodes.map((node) => ({
			...node,
			type: 'treeNode',
			data: {
				...node.data,
				child_count: child_count_map[node.id] ?? 0,
				is_leaf: !flow_edges.some((e) => e.source === node.id),
				is_selected: current_selected_leaf_ids.has(node.id),
				onToggle: toggleLeaf
			}
		}));

		const root_ids = updated_trees.map((root) => root._id);
		const final_nodes = layoutWithDagre(enriched_nodes, flow_edges, root_ids);

		setNodes(final_nodes);
		setEdges(flow_edges);
	}

	useEffect(() =>
	{
		rebuildFlow(trees, selectedLeafIds);
	}, [trees, selectedLeafIds, toggleLeaf]);

	function handleSelectRubric(rubric_id)
	{
		setSelectedRubricId(rubric_id);
		setSaveStatus('');
	}

	function toggleAssignment(assignment)
	{
		setExpandedAssignments((prev) =>
		{
			const next = new Set(prev);
			if (next.has(assignment))
			{
				next.delete(assignment);
			}
			else
			{
				next.add(assignment);
			}
			return next;
		});
	}

	async function handleSave()
	{
		if (!selectedRubricId || !selectedOutcomeId)
		{
			return;
		}

		setSaveStatus('Saving...');

		const to_add = [...selectedLeafIds].filter((id) => !initialLeafIds.has(id));
		const to_remove = [...initialLeafIds].filter((id) => !selectedLeafIds.has(id));

		const add_results = await Promise.all(
			to_add.map((node_id) =>
				fetch(`${API_BASE}/leaf-mappings`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ outcome_id: selectedOutcomeId, node_id, rubric_id: selectedRubricId })
				})
			)
		);

		const remove_results = await Promise.all(
			to_remove.map((node_id) =>
			{
				const mapping_id = linkedMap.get(node_id);
				return fetch(`${API_BASE}/leaf-mappings/${mapping_id}`, { method: 'DELETE' });
			})
		);

		const all_ok = add_results.every((r) => r.ok || r.status === 409) && remove_results.every((r) => r.ok);

		if (all_ok)
		{
			setInitialLeafIds(new Set(selectedLeafIds));
			const new_map = new Map(linkedMap);
			to_remove.forEach((id) => new_map.delete(id));
			setLinkedMap(new_map);
			setSaveStatus('Saved.');
		}
		else
		{
			setSaveStatus('Some changes failed to save.');
		}
	}

	const grouped = rubrics.reduce((acc, rubric) =>
	{
		if (!acc[rubric.assignment])
		{
			acc[rubric.assignment] = [];
		}
		acc[rubric.assignment].push(rubric);
		return acc;
	}, {});

	return (
		<div style={{ display: 'flex', height: '100vh' }}>
			<div style={{ width: 260, borderRight: '1px solid #ddd', overflowY: 'auto', padding: 12 }}>
				{Object.entries(grouped).map(([assignment, questions]) => {
					const is_expanded = expandedAssignments.has(assignment);

					return (
						<div key={assignment} style={{ marginBottom: 8 }}>
							<button
								type="button"
								onClick={() => toggleAssignment(assignment)}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									width: '100%',
									padding: '8px 10px',
									border: '1px solid var(--border)',
									borderRadius: 6,
									background: is_expanded ? 'var(--code-bg)' : 'var(--bg)',
									color: 'var(--text-h)',
									fontWeight: 600,
									fontSize: 13,
									cursor: 'pointer',
									textAlign: 'left'
								}}
							>
								<span>{assignment}</span>
								<span style={{ fontSize: 11, color: 'var(--text)' }}>{is_expanded ? '▾' : '▸'}</span>
							</button>

							{is_expanded && (
								<div style={{ marginTop: 4, paddingLeft: 8 }}>
									{questions.map((q) => (
										<div
											key={q._id}
											onClick={() => handleSelectRubric(q._id)}
											style={{
												padding: '4px 8px',
												cursor: 'pointer',
												color: 'var(--text-h)',
												background: selectedRubricId === q._id ? 'var(--accent-bg)' : 'transparent',
												borderRadius: 4
											}}
										>
											{q.question_id}
										</div>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<div style={{ padding: 12, borderBottom: '1px solid #ddd', display: 'flex', gap: 12, alignItems: 'center' }}>
					<select value={selectedOutcomeId} onChange={(e) => setSelectedOutcomeId(e.target.value)}>
						<option value="">Select outcome...</option>
						{outcomes.map((o) => (
							<option key={o._id} value={o._id}>{o.code}</option>
						))}
					</select>

					<button onClick={handleSave} disabled={!selectedRubricId || !selectedOutcomeId}>
						Save
					</button>

					<span>{saveStatus}</span>
				</div>

				<div style={{ flex: 1, background: '#4e5153ff' }}>
					<ReactFlow
						nodes={nodes}
						edges={edges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						nodeTypes={nodeTypes}
						minZoom={0.1}
						maxZoom={2}
					>
						<Background color="#cbd5e1" gap={16} />
						<Controls />
					</ReactFlow>
				</div>
			</div>
		</div>
	);
}

export default AssignmentsPage;