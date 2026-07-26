import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ReactFlow, Background, BackgroundVariant, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Sparkles, Save } from 'lucide-react';
import TreeNodeComponent from './TreeNodeComponent';
import { treesToFlow } from './treeFlowUtils';
import { layoutWithDagre } from './dagreLayout';
import { createRootNode, addChildToNode, deleteNode, updateNodeField } from './treeStateUtils';

const nodeTypes = { treeNode: TreeNodeComponent };

function OutcomeTreePage()
{
    const navigate = useNavigate();
    const { classId } = useOutletContext();

    const [class_doc, setClassDoc] = useState(null);
    const [selected_outcome_id, setSelectedOutcomeId] = useState('');
    const [trees, setTrees] = useState([]);
    const [selected_text, setSelectedText] = useState('');
    const [is_saving, setIsSaving] = useState(false);
    const [is_generating, setIsGenerating] = useState(false);
    const [selected_node_ids, setSelectedNodeIds] = useState([]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() =>
    {
        fetch(`http://localhost:5001/api/classes/${classId}`)
            .then(response => response.json())
            .then(data => setClassDoc(data))
            .catch(error => console.error('Error fetching class:', error));
    }, [classId]);

    const outcome_entries = class_doc?.outcomes ?? [];

    const selected_entry = useMemo(
        () => outcome_entries.find(entry => entry.outcome_id._id === selected_outcome_id),
        [outcome_entries, selected_outcome_id]
    );

    useEffect(() =>
    {
        setTrees(selected_entry ? (selected_entry.trees || []) : []);
        setSelectedNodeIds([]);
    }, [selected_entry]);

    function countChildren(node_array, id_to_count_map)
    {
        node_array.forEach(node =>
        {
            id_to_count_map[node._id] = node.children.length;
            countChildren(node.children, id_to_count_map);
        });
    }

    function rebuildFlow(updated_trees, current_selected_ids)
    {
        const { nodes: flow_nodes, edges: flow_edges } = treesToFlow(updated_trees);

        const child_count_map = {};
        countChildren(updated_trees, child_count_map);

        const styled_edges = flow_edges.map(edge => ({
            ...edge,
            style: { stroke: '#94A3B8', strokeWidth: 1.5 }
        }));

        const enriched_nodes = flow_nodes.map(node => ({
            ...node,
            type: 'treeNode',
            data:
            {
                ...node.data,
                child_count: child_count_map[node.id] ?? 0,
                is_selected: current_selected_ids.includes(node.id),
                onLabelChange: handleLabelChange,
                onWeightChange: handleWeightChange,
                onThresholdChange: handleThresholdChange,
                onAddChild: handleAddChild,
                onAddLogical: handleAddLogical,
                onDelete: handleDelete,
                onToggleSelect: handleToggleSelect
            }
        }));

        const root_ids = updated_trees.map(root => root._id);

        const final_nodes = layoutWithDagre(enriched_nodes, styled_edges, root_ids);

        setNodes(final_nodes);
        setEdges(styled_edges);
    }

    useEffect(() =>
    {
        rebuildFlow(trees, selected_node_ids);
    }, [trees, selected_node_ids]);

    function handleTextSelection()
    {
        const selection = window.getSelection().toString().trim();
        setSelectedText(selection);
    }

    function handleAddRoot()
    {
        if (!selected_text) return;

        const new_root = createRootNode(selected_text);

        setTrees([...trees, new_root]);
        setSelectedText('');
    }

    function handleAddChild(parent_id)
    {
        setTrees(prev_trees => addChildToNode(prev_trees, parent_id, false));
    }

    function handleAddLogical(parent_id)
    {
        setTrees(prev_trees => addChildToNode(prev_trees, parent_id, true));
    }

    function handleDelete(node_id)
    {
        setTrees(prev_trees => deleteNode(prev_trees, node_id));
        setSelectedNodeIds(prev_ids => prev_ids.filter(id => id !== node_id));
    }

    function handleLabelChange(node_id, new_label)
    {
        setTrees(prev_trees => updateNodeField(prev_trees, node_id, 'label', new_label));
    }

    function handleWeightChange(node_id, new_weight)
    {
        setTrees(prev_trees => updateNodeField(prev_trees, node_id, 'weight', new_weight));
    }

    function handleThresholdChange(node_id, new_threshold)
    {
        setTrees(prev_trees => updateNodeField(prev_trees, node_id, 'threshold', new_threshold));
    }

    function handleToggleSelect(node_id, is_checked)
    {
        setSelectedNodeIds(prev_ids =>
            is_checked
                ? [...prev_ids, node_id]
                : prev_ids.filter(id => id !== node_id)
        );
    }

    async function handleSave()
    {
        if (!selected_outcome_id) return;

        setIsSaving(true);

        try
        {
            const response = await fetch(`http://localhost:5001/api/classes/${classId}/outcomes/${selected_outcome_id}/trees`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trees })
            });

            if (!response.ok)
            {
                throw new Error('Save failed');
            }

            const updated_entry = await response.json();

            setClassDoc(prev_class =>
            {
                if (!prev_class) return prev_class;

                return {
                    ...prev_class,
                    outcomes: prev_class.outcomes.map(entry =>
                        entry.outcome_id._id === selected_outcome_id
                            ? { ...entry, trees: updated_entry.trees }
                            : entry
                    )
                };
            });

            setTrees(updated_entry.trees);
            setSelectedNodeIds([]);
        }
        catch (error)
        {
            console.error('Error saving trees:', error);
            alert('Failed to save. Check the console for details.');
        }
        finally
        {
            setIsSaving(false);
        }
    }

    async function handleGeneratePIs()
    {
        if (!selected_outcome_id || selected_node_ids.length === 0) return;

        setIsGenerating(true);

        try
        {
            const response = await fetch(`http://localhost:5001/api/classes/${classId}/outcomes/${selected_outcome_id}/generate-pis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selected_node_ids })
            });

            if (!response.ok)
            {
                const error_body = await response.json();
                throw new Error(error_body.error || 'Generation failed');
            }

            const pis = await response.json();

            navigate(`/classes/${classId}/pis`, {
                state:
                {
                    pis,
                    outcome_id: selected_outcome_id,
                    outcome_code: selected_entry.outcome_id.code
                }
            });
        }
        catch (error)
        {
            console.error('Error generating PIs:', error);
            alert(error.message || 'Failed to generate PIs. Check the console for details.');
        }
        finally
        {
            setIsGenerating(false);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: '-24px' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0, width: '220px' }}>
                        <label className="form-label">Outcome</label>
                        <select
                            className="form-select"
                            value={selected_outcome_id}
                            onChange={event => setSelectedOutcomeId(event.target.value)}
                        >
                            <option value="">Select an outcome...</option>
                            {outcome_entries.map(entry => (
                                <option key={entry.outcome_id._id} value={entry.outcome_id._id}>
                                    {entry.outcome_id.code}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button className="btn btn-secondary" onClick={handleSave} disabled={!selected_outcome_id || is_saving}>
                        <Save size={14} /> {is_saving ? 'Saving...' : 'Save Tree'}
                    </button>

                    <button className="btn" style={{ background: '#0891B2', color: '#fff' }} onClick={handleGeneratePIs} disabled={selected_node_ids.length === 0 || is_generating}>
                        <Sparkles size={14} /> {is_generating ? 'Generating...' : `Generate PIs (${selected_node_ids.length} selected)`}
                    </button>
                </div>

                {selected_entry && (
                    <div
                        onMouseUp={handleTextSelection}
                        style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '8px', lineHeight: 1.6, fontSize: '13px' }}
                    >
                        {selected_entry.outcome_id.statement}
                    </div>
                )}

                {selected_text && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Selected: "{selected_text}"</span>
                        <button className="btn btn-primary btn-sm" onClick={handleAddRoot}>
                            <Plus size={13} /> Add Root
                        </button>
                    </div>
                )}
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
    );
}

export default OutcomeTreePage;