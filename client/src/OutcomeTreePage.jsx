import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Sparkles } from 'lucide-react';
import TreeNodeComponent from './TreeNodeComponent';
import { treesToFlow } from './treeFlowUtils';
import { layoutWithDagre } from './dagreLayout';
import { createRootNode, addChildToNode, deleteNode, updateNodeField } from './treeStateUtils';

const nodeTypes = { treeNode: TreeNodeComponent };

function OutcomeTreePage()
{
    const navigate = useNavigate();

    const [outcomes, setOutcomes] = useState([]);
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
        fetch('http://localhost:5001/api/outcomes')
            .then(response => response.json())
            .then(data => setOutcomes(data))
            .catch(error => console.error('Error fetching outcomes:', error));
    }, []);

    const selected_outcome = useMemo(
        () => outcomes.find(outcome => outcome._id === selected_outcome_id),
        [outcomes, selected_outcome_id]
    );

    useEffect(() =>
    {
        if (selected_outcome)
        {
            setTrees(selected_outcome.trees || []);
        }
        else
        {
            setTrees([]);
        }
        setSelectedNodeIds([]);
    }, [selected_outcome]);

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

        const final_nodes = layoutWithDagre(enriched_nodes, flow_edges, root_ids);

        setNodes(final_nodes);
        setEdges(flow_edges);
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
            const response = await fetch(`http://localhost:5001/api/outcomes/${selected_outcome_id}/trees`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trees })
            });

            if (!response.ok)
            {
                throw new Error('Save failed');
            }

            const updated_outcome = await response.json();

            setOutcomes(prev_outcomes =>
                prev_outcomes.map(outcome =>
                    outcome._id === updated_outcome._id ? updated_outcome : outcome
                )
            );

            setTrees(updated_outcome.trees);
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
            const response = await fetch(`http://localhost:5001/api/outcomes/${selected_outcome_id}/generate-pis`, {
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

            navigate('/pis', {
                state:
                {
                    pis,
                    outcome_code: selected_outcome.code,
                    outcome_id: selected_outcome_id
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
                <select
                    value={selected_outcome_id}
                    onChange={(event) => setSelectedOutcomeId(event.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 12, width: '100%' }}
                >
                    <option value="">Select an outcome...</option>
                    {outcomes.map(outcome => (
                        <option key={outcome._id} value={outcome._id}>
                            {outcome.code}
                        </option>
                    ))}
                </select>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                        onClick={handleSave}
                        disabled={!selected_outcome_id || is_saving}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: '1px solid #1e3a5f',
                            background: is_saving ? '#94a3b8' : '#1e3a5f',
                            color: '#fff',
                            cursor: is_saving ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {is_saving ? 'Saving...' : 'Save Tree'}
                    </button>

                    <button
                        onClick={handleGeneratePIs}
                        disabled={selected_node_ids.length === 0 || is_generating}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: '1px solid #7c3aed',
                            background: selected_node_ids.length === 0 || is_generating ? '#94a3b8' : '#7c3aed',
                            color: '#fff',
                            cursor: selected_node_ids.length === 0 || is_generating ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Sparkles size={14} />
                        {is_generating ? 'Generating...' : `Generate PIs (${selected_node_ids.length} selected)`}
                    </button>
                </div>

                {selected_outcome && (
                    <div
                        onMouseUp={handleTextSelection}
                        style={{ padding: 12, background: '#f8fafc', borderRadius: 8, lineHeight: 1.6 }}
                    >
                        {selected_outcome.statement}
                    </div>
                )}

                {selected_text && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 13 }}>Selected: "{selected_text}"</span>
                        <button
                            onClick={handleAddRoot}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
                        >
                            <Plus size={14} /> Add Root
                        </button>
                    </div>
                )}
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
    );
}

export default OutcomeTreePage;