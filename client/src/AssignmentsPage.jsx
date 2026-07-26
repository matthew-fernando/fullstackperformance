import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ReactFlow, Background, BackgroundVariant, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Pencil, ChevronDown, ChevronRight, Workflow, X, FileText } from 'lucide-react';
import { treesToFlow } from './treeFlowUtils.js';
import { layoutWithDagre } from './dagreLayout.js';
import AssignmentLeafNode from './AssignmentLeafNode.jsx';
import AssignmentFormModal from './components/AssignmentFormModal.jsx';

const API_BASE = 'http://localhost:5001/api';
const nodeTypes = { treeNode: AssignmentLeafNode };

function countChildren(node_array, id_to_count_map)
{
    node_array.forEach(node =>
    {
        id_to_count_map[node._id] = node.children.length;
        countChildren(node.children, id_to_count_map);
    });
}

function AssignmentsPage()
{
    const { classId } = useOutletContext();

    const [assignments, setAssignments] = useState([]);
    const [expanded_assignments, setExpandedAssignments] = useState(new Set());
    const [hovered_assignment_id, setHoveredAssignmentId] = useState(null);
    const [is_form_open, setIsFormOpen] = useState(false);
    const [editing_assignment, setEditingAssignment] = useState(null);

    const [is_link_mode, setIsLinkMode] = useState(false);
    const [selected_assignment_id, setSelectedAssignmentId] = useState(null);
    const [selected_question_id, setSelectedQuestionId] = useState(null);
    const [class_doc, setClassDoc] = useState(null);
    const [selected_outcome_id, setSelectedOutcomeId] = useState('');
    const [trees, setTrees] = useState([]);
    const [selected_leaf_ids, setSelectedLeafIds] = useState(new Set());
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [save_status, setSaveStatus] = useState('');
    const [linked_map, setLinkedMap] = useState(new Map());
    const [initial_leaf_ids, setInitialLeafIds] = useState(new Set());

    useEffect(() => { fetchAssignments(); }, [classId]);

    useEffect(() =>
    {
        fetch(`${API_BASE}/classes/${classId}`).then(res => res.json()).then(setClassDoc);
    }, [classId]);

    async function fetchAssignments()
    {
        const response = await fetch(`${API_BASE}/assignments?class_id=${classId}`);
        setAssignments(await response.json());
    }

    const outcome_entries = class_doc?.outcomes ?? [];

    useEffect(() =>
    {
        const entry = outcome_entries.find(o => o.outcome_id._id === selected_outcome_id);
        setTrees(entry ? entry.trees : []);
    }, [selected_outcome_id, class_doc]);

    useEffect(() =>
    {
        if (!selected_outcome_id || !selected_question_id)
        {
            setLinkedMap(new Map());
            setInitialLeafIds(new Set());
            setSelectedLeafIds(new Set());
            return;
        }

        fetch(`${API_BASE}/classes/${classId}/outcomes/${selected_outcome_id}/leaf-mappings`)
            .then(res => res.json())
            .then(mappings =>
            {
                const relevant = mappings.filter(m => String(m.question_id) === selected_question_id);
                const node_ids = relevant.map(m => m.node_id);
                const map = new Map(relevant.map(m => [m.node_id, m._id]));

                setLinkedMap(map);
                setInitialLeafIds(new Set(node_ids));
                setSelectedLeafIds(new Set(node_ids));
            });
    }, [classId, selected_outcome_id, selected_question_id]);

    const toggleLeaf = useCallback(node_id =>
    {
        setSelectedLeafIds(prev =>
        {
            const next = new Set(prev);
            if (next.has(node_id)) next.delete(node_id); else next.add(node_id);
            return next;
        });
    }, []);

    function rebuildFlow(updated_trees, current_selected_leaf_ids)
    {
        const { nodes: flow_nodes, edges: flow_edges } = treesToFlow(updated_trees);

        const child_count_map = {};
        countChildren(updated_trees, child_count_map);

        const styled_edges = flow_edges.map(edge => ({ ...edge, style: { stroke: '#94A3B8', strokeWidth: 1.5 } }));

        const enriched_nodes = flow_nodes.map(node => ({
            ...node,
            type: 'treeNode',
            data: {
                ...node.data,
                child_count: child_count_map[node.id] ?? 0,
                is_leaf: !flow_edges.some(e => e.source === node.id),
                is_selected: current_selected_leaf_ids.has(node.id),
                onToggle: toggleLeaf
            }
        }));

        const root_ids = updated_trees.map(root => root._id);
        const final_nodes = layoutWithDagre(enriched_nodes, styled_edges, root_ids);

        setNodes(final_nodes);
        setEdges(styled_edges);
    }

    useEffect(() =>
    {
        if (is_link_mode) rebuildFlow(trees, selected_leaf_ids);
    }, [trees, selected_leaf_ids, toggleLeaf, is_link_mode]);

    function toggleAssignment(assignment_id)
    {
        setExpandedAssignments(prev =>
        {
            const next = new Set(prev);
            if (next.has(assignment_id)) next.delete(assignment_id); else next.add(assignment_id);
            return next;
        });
    }

    function handleSelectQuestion(assignment_id, question_id)
    {
        setSelectedAssignmentId(assignment_id);
        setSelectedQuestionId(question_id);
        setSaveStatus('');
    }

    function openAddModal()
    {
        setEditingAssignment(null);
        setIsFormOpen(true);
    }

    function openEditModal(assignment)
    {
        setEditingAssignment(assignment);
        setIsFormOpen(true);
    }

    async function handleFormSave(payload)
    {
        const url = editing_assignment
            ? `${API_BASE}/assignments/${editing_assignment._id}`
            : `${API_BASE}/assignments`;

        const response = await fetch(url, {
            method: editing_assignment ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editing_assignment ? payload : { ...payload, class_id: classId })
        });

        if (!response.ok)
        {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || 'Failed to save assignment');
        }

        setIsFormOpen(false);
        setEditingAssignment(null);
        fetchAssignments();
    }

    async function handleSaveLinks()
    {
        if (!selected_question_id || !selected_assignment_id || !selected_outcome_id) return;

        setSaveStatus('Saving...');

        const to_add = [...selected_leaf_ids].filter(id => !initial_leaf_ids.has(id));
        const to_remove = [...initial_leaf_ids].filter(id => !selected_leaf_ids.has(id));

        const add_results = await Promise.all(
            to_add.map(node_id =>
                fetch(`${API_BASE}/leaf-mappings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        class_id: classId,
                        outcome_id: selected_outcome_id,
                        node_id,
                        assignment_id: selected_assignment_id,
                        question_id: selected_question_id
                    })
                })
            )
        );

        const remove_results = await Promise.all(
            to_remove.map(node_id =>
            {
                const mapping_id = linked_map.get(node_id);
                return fetch(`${API_BASE}/leaf-mappings/${mapping_id}`, { method: 'DELETE' });
            })
        );

        const all_ok = add_results.every(r => r.ok || r.status === 409) && remove_results.every(r => r.ok);

        if (all_ok)
        {
            setInitialLeafIds(new Set(selected_leaf_ids));
            const new_map = new Map(linked_map);
            to_remove.forEach(id => new_map.delete(id));
            setLinkedMap(new_map);
            setSaveStatus('Saved.');
        }
        else
        {
            setSaveStatus('Some changes failed to save.');
        }
    }

    function closeLinkMode()
    {
        setIsLinkMode(false);
        setSelectedAssignmentId(null);
        setSelectedQuestionId(null);
        setSaveStatus('');
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: is_link_mode ? '-24px' : 0 }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: is_link_mode ? '16px 24px' : '0 0 20px', borderBottom: is_link_mode ? '1px solid var(--border)' : 'none',
                background: is_link_mode ? 'var(--surface)' : 'transparent'
            }}>
                <h1>Assignments</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!is_link_mode && (
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <Plus size={15} /> Add Assignment
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => (is_link_mode ? closeLinkMode() : setIsLinkMode(true))}>
						{is_link_mode ? (<><X size={14} /> Close</>) : (<><Workflow size={14} /> Link Leaves</>)}
					</button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                <div style={{
                    width: is_link_mode ? '300px' : '100%',
                    overflowY: 'auto',
                    padding: is_link_mode ? '16px' : '20px 0 0',
                    borderRight: is_link_mode ? '1px solid var(--border)' : 'none',
                    flexShrink: 0
                }}>
                    {assignments.length === 0 && (
                        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <FileText size={22} style={{ marginBottom: '10px', color: 'var(--text-muted)' }} />
                            <p>No assignments yet. Click "Add Assignment" to create your first one.</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: is_link_mode ? '8px' : '10px' }}>
                        {assignments.map(assignment =>
                        {
                            const is_expanded = expanded_assignments.has(assignment._id);

                            return (
                                <div key={assignment._id} className="card">
                                    <div
                                        onMouseEnter={() => setHoveredAssignmentId(assignment._id)}
                                        onMouseLeave={() => setHoveredAssignmentId(null)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer' }}
                                        onClick={() => toggleAssignment(assignment._id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {is_expanded ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
                                            <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{assignment.name}</span>
                                            <span className="badge badge-gray">{assignment.questions.length} questions</span>
                                        </div>

                                        {hovered_assignment_id === assignment._id && !is_link_mode && (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={e => { e.stopPropagation(); openEditModal(assignment); }}
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>
                                        )}
                                    </div>

                                    {is_expanded && (
                                        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px 12px' }}>
                                            {assignment.questions.map(question => (
                                                <div
                                                    key={question._id}
                                                    onClick={() => is_link_mode && handleSelectQuestion(assignment._id, question._id)}
                                                    style={{
                                                        padding: '7px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        cursor: is_link_mode ? 'pointer' : 'default',
                                                        background: selected_question_id === question._id ? 'var(--blue-bg)' : 'transparent',
                                                        color: selected_question_id === question._id ? 'var(--blue)' : 'var(--text)',
                                                        marginBottom: '2px'
                                                    }}
                                                >
                                                    {question.question_label}
                                                    {!is_link_mode && (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginLeft: '8px' }}>
                                                            {question.criteria.length} criteria
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {is_link_mode && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--surface)' }}>
                            <div className="form-group" style={{ marginBottom: 0, width: '200px' }}>
                                <select className="form-select" value={selected_outcome_id} onChange={e => setSelectedOutcomeId(e.target.value)}>
                                    <option value="">Select outcome...</option>
                                    {outcome_entries.map(entry => (
                                        <option key={entry.outcome_id._id} value={entry.outcome_id._id}>{entry.outcome_id.code}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="btn btn-primary btn-sm" onClick={handleSaveLinks} disabled={!selected_question_id || !selected_outcome_id}>
                                Save Links
                            </button>

                            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                {selected_question_id ? save_status : 'Select a question on the left to begin.'}
                            </span>
                        </div>

                        <div style={{ flex: 1, background: '#FFFFFF' }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                nodeTypes={nodeTypes}
                                minZoom={0.1}
                                maxZoom={2}
                            >
                                <Background variant={BackgroundVariant.Dots} color="#CBD5E1" gap={18} size={1.5} />
                                <Controls showInteractive={false} />
                            </ReactFlow>
                        </div>
                    </div>
                )}
            </div>

            {is_form_open && (
                <AssignmentFormModal
                    initial_assignment={editing_assignment}
                    onClose={() => { setIsFormOpen(false); setEditingAssignment(null); }}
                    onSave={handleFormSave}
                />
            )}
        </div>
    );
}

export default AssignmentsPage;