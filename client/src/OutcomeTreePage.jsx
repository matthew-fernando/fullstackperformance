import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ReactFlow, Background, BackgroundVariant, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Sparkles, Save } from 'lucide-react';
import TreeNodeComponent from './TreeNodeComponent';
import { treesToFlow } from './treeFlowUtils';
import { layoutWithDagre } from './dagreLayout';
import { createRootNode, addChildToNode, addChildrenToNode, deleteNode, updateNodeField } from './treeStateUtils';

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
    const [existing_pi_node_ids, setExistingPiNodeIds] = useState(new Set());
    const [wiggle_node_id, setWiggleNodeId] = useState(null);
    const [pi_by_node_id, setPiByNodeId] = useState(new Map());
    const [leaf_linked_node_ids, setLeafLinkedNodeIds] = useState(new Set());

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
    }, [selected_entry]);

    useEffect(() =>
    {
        if (!selected_outcome_id)
        {
            setExistingPiNodeIds(new Set());
            setSelectedNodeIds([]);
            return;
        }

        fetch(`http://localhost:5001/api/performance-indicators/class/${classId}/outcome/${selected_outcome_id}`)
            .then(response => response.json())
            .then(pis =>
            {
                const node_ids = new Set(pis.map(pi => pi.node_id));
                setExistingPiNodeIds(node_ids);
                setSelectedNodeIds([...node_ids]);
                setPiByNodeId(new Map(pis.map(pi => [pi.node_id, pi])));
            })
            .catch(error => console.error('Error fetching existing PIs:', error));
    }, [classId, selected_outcome_id]);

    useEffect(() =>
    {
        if (!selected_outcome_id)
        {
            setLeafLinkedNodeIds(new Set());
            return;
        }

        fetch(`http://localhost:5001/api/classes/${classId}/outcomes/${selected_outcome_id}/leaf-mappings`)
            .then(response => response.json())
            .then(mappings => setLeafLinkedNodeIds(new Set(mappings.map(m => m.node_id))))
            .catch(error => console.error('Error fetching leaf mappings:', error));
    }, [classId, selected_outcome_id]);

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
                is_locked: existing_pi_node_ids.has(node.id),
                is_wiggling: node.id === wiggle_node_id,
                onLabelChange: handleLabelChange,
                onWeightChange: handleWeightChange,
                onThresholdChange: handleThresholdChange,
                onAddChild: handleAddChild,
                onAddChildren: handleAddChildren,
                onAddLogical: handleAddLogical,
                onDelete: handleDelete,
                onToggleSelect: handleToggleSelect,
                onAttemptUnlink: handleAttemptUnlink
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
    }, [trees, selected_node_ids, existing_pi_node_ids, wiggle_node_id, pi_by_node_id]);

    function handleTextSelection()
    {
        const selection = window.getSelection().toString().trim();
        setSelectedText(selection);
    }

    function handleAddRoot()
    {
        if (!selected_text) return;

        const normalized_text = selected_text.trim().toLowerCase();
        const duplicate_root = trees.find(root => root.label.trim().toLowerCase() === normalized_text);

        if (duplicate_root)
        {
            setWiggleNodeId(duplicate_root._id);
            setTimeout(() => setWiggleNodeId(null), 600);
            setSelectedText('');
            return;
        }

        const new_root = createRootNode(selected_text);

        setTrees([...trees, new_root]);
        setSelectedText('');
    }

    function handleAddChild(parent_id)
    {
        setTrees(prev_trees => addChildToNode(prev_trees, parent_id, false));
    }

    function handleAddChildren(parent_id, count)
    {
        setTrees(prev_trees => addChildrenToNode(prev_trees, parent_id, count));
    }

    function handleAddLogical(parent_id)
    {
        setTrees(prev_trees => addChildToNode(prev_trees, parent_id, true));
    }

    function findNodeInTrees(node_array, target_id)
    {
        for (const node of node_array)
        {
            if (node._id === target_id) return node;
            const found = findNodeInTrees(node.children, target_id);
            if (found) return found;
        }
        return null;
    }

    function flattenSubtreeIds(node)
    {
        return [node._id, ...node.children.flatMap(flattenSubtreeIds)];
    }

    function handleDelete(node_id)
    {
        const target_node = findNodeInTrees(trees, node_id);
        const subtree_ids = target_node ? flattenSubtreeIds(target_node) : [node_id];

        const affected_pi_codes = subtree_ids
            .filter(id => existing_pi_node_ids.has(id))
            .map(id => pi_by_node_id.get(id)?.code)
            .filter(Boolean);

        const affected_leaf_count = subtree_ids.filter(id => leaf_linked_node_ids.has(id)).length;

        if (affected_pi_codes.length > 0 || affected_leaf_count > 0)
        {
            const parts = [];

            if (affected_pi_codes.length > 0)
            {
                parts.push(`performance indicator${affected_pi_codes.length > 1 ? 's' : ''} ${affected_pi_codes.join(', ')}`);
            }

            if (affected_leaf_count > 0)
            {
                parts.push(`${affected_leaf_count} assignment leaf link${affected_leaf_count > 1 ? 's' : ''}`);
            }

            const confirmed = window.confirm(
                `Deleting this node (and everything under it) will also delete the ${parts.join(' and ')}. This takes effect once you Save Tree. Continue?`
            );

            if (!confirmed) return;
        }

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

    function buildTreeIdMap(old_nodes, new_nodes, id_map)
    {
        old_nodes.forEach((old_node, index) =>
        {
            const new_node = new_nodes[index];
            if (!new_node) return;

            id_map[old_node._id] = new_node._id;
            buildTreeIdMap(old_node.children, new_node.children, id_map);
        });

        return id_map;
    }

    async function performSave()
    {
        if (!selected_outcome_id) return null;

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
            const id_map = buildTreeIdMap(trees, updated_entry.trees, {});

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
            setSelectedNodeIds(prev_ids => prev_ids.map(id => id_map[id] ?? id));

            return { updated_trees: updated_entry.trees, id_map };
        }
        catch (error)
        {
            console.error('Error saving trees:', error);
            alert('Failed to save. Check the console for details.');
            return null;
        }
        finally
        {
            setIsSaving(false);
        }
    }

    async function handleSave()
    {
        await performSave();
    }

    async function handleAttemptUnlink(node_id)
    {
        const pi = pi_by_node_id.get(node_id);

        if (!pi) return;

        const confirmed = window.confirm(
            `This node is linked to ${pi.code} (${pi.title}). Unchecking it will delete that performance indicator. Continue?`
        );

        if (!confirmed) return;

        try
        {
            const response = await fetch(`http://localhost:5001/api/performance-indicators/${pi._id}`, { method: 'DELETE' });

            if (!response.ok)
            {
                throw new Error('Failed to delete performance indicator');
            }

            setExistingPiNodeIds(prev =>
            {
                const next = new Set(prev);
                next.delete(node_id);
                return next;
            });

            setSelectedNodeIds(prev_ids => prev_ids.filter(id => id !== node_id));

            setPiByNodeId(prev =>
            {
                const next = new Map(prev);
                next.delete(node_id);
                return next;
            });
        }
        catch (error)
        {
            console.error('Error deleting PI:', error);
            alert('Failed to delete the performance indicator. Check the console for details.');
        }
    }

    const new_selected_node_ids = selected_node_ids.filter(id => !existing_pi_node_ids.has(id));

    async function handleGeneratePIs()
    {
        if (!selected_outcome_id || new_selected_node_ids.length === 0) return;

        setIsGenerating(true);

        try
        {
            const save_result = await performSave();

            if (!save_result) return;

            const translated_ids = new_selected_node_ids.map(id => save_result.id_map[id] ?? id);

            const response = await fetch(`http://localhost:5001/api/classes/${classId}/outcomes/${selected_outcome_id}/generate-pis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selected_node_ids: translated_ids })
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

                    <button className="btn" style={{ background: '#0891B2', color: '#fff' }} onClick={handleGeneratePIs} disabled={new_selected_node_ids.length === 0 || is_generating}>
                        <Sparkles size={14} /> {is_generating ? (is_saving ? 'Saving...' : 'Generating...') : `Generate PIs (${new_selected_node_ids.length} selected)`}
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