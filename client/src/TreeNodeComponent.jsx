import { Handle, Position } from '@xyflow/react';
import { Plus, GitFork, Trash2 } from 'lucide-react';

function TreeNodeComponent({ id, data })
{
    const child_count = data.child_count ?? 0;

    const threshold_options = [];
    for (let i = 1; i <= child_count; i++)
    {
        threshold_options.push(i);
    }

    function handleLabelChange(event)
    {
        data.onLabelChange(id, event.target.value);
    }

    function handleWeightChange(event)
    {
        data.onWeightChange(id, Number(event.target.value));
    }

    function handleThresholdChange(event)
    {
        data.onThresholdChange(id, Number(event.target.value));
    }

    function handleCheckboxChange(event)
    {
        data.onToggleSelect(id, event.target.checked);
    }

    const is_root = data.type === 'root';
    const is_logical = data.type === 'logical';
    const is_selected = data.is_selected ?? false;

    return (
        <div style={nodeStyle(data.type, is_selected)}>
            <Handle type="target" position={Position.Top} isConnectable={false} style={handleStyle} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 8 }}>
                <input
                    type="checkbox"
                    checked={is_selected}
                    onChange={handleCheckboxChange}
                    className="nodrag"
                    style={{ marginTop: 3, cursor: 'pointer', accentColor: '#2563EB' }}
                    title="Select for PI generation"
                />

                <div style={{ flex: 1 }}>
                    {is_root ? (
                        <div style={{ fontWeight: 700, fontFamily: "'Sora', sans-serif", fontSize: 13, color: '#fff', wordBreak: 'break-word' }}>
                            {data.label}
                        </div>
                    ) : is_logical ? (
                        <div style={{ fontWeight: 600, fontStyle: 'italic', fontSize: 12.5, color: '#475569' }}>Logical</div>
                    ) : (
                        <textarea
                            value={data.label}
                            onChange={handleLabelChange}
                            className="nodrag"
                            style={{ ...inputStyle(data.type), resize: 'none', minHeight: 36 }}
                            placeholder="Keyword"
                            rows={2}
                        />
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <label style={labelStyle(is_root)}>Weight</label>
                <input
                    type="number"
                    value={data.weight}
                    onChange={handleWeightChange}
                    className="nodrag"
                    style={{ ...inputStyle(data.type), width: 60 }}
                />
            </div>

            {child_count > 0 && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle(is_root)}>Min to pass</label>
                    <select value={data.threshold} onChange={handleThresholdChange} className="nodrag" style={inputStyle(data.type)}>
                        {threshold_options.map(option => (
                            <option key={option} value={option}>
                                {option === child_count ? 'All' : option}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button onClick={() => data.onAddChild(id)} style={iconBtnStyle(is_root)} title="Add child">
                    <Plus size={13} />
                </button>
                <button onClick={() => data.onAddLogical(id)} style={iconBtnStyle(is_root)} title="Add logical child">
                    <GitFork size={13} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button onClick={() => data.onDelete(id)} style={{ ...iconBtnStyle(is_root), color: '#DC2626', borderColor: '#FCA5A5' }} title="Delete">
                    <Trash2 size={13} />
                </button>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={false} style={handleStyle} />
        </div>
    );
}

export function treeNodeStyle(type, is_selected)
{
    if (type === 'root')
    {
        return {
            padding: 14,
            borderRadius: 10,
            border: is_selected ? '2px solid #93C5FD' : '1px solid #1D4ED8',
            background: '#2563EB',
            width: 220,
            minHeight: 100,
            fontSize: 12,
            boxSizing: 'border-box',
            boxShadow: is_selected ? '0 0 0 3px rgba(37, 99, 235, 0.25)' : '0 1px 3px rgba(15, 23, 42, 0.15)'
        };
    }

    if (type === 'logical')
    {
        return {
            padding: 14,
            borderRadius: 10,
            border: is_selected ? '2px solid #2563EB' : '1.5px dashed #94A3B8',
            background: '#F1F5F9',
            width: 220,
            minHeight: 90,
            fontSize: 12,
            boxSizing: 'border-box',
            boxShadow: is_selected ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(15, 23, 42, 0.04)'
        };
    }

    return {
        padding: 14,
        borderRadius: 10,
        border: is_selected ? '2px solid #2563EB' : '1px solid #E2E8F0',
        background: '#F8FAFC',
        width: 220,
        minHeight: 110,
        fontSize: 12,
        boxSizing: 'border-box',
        boxShadow: is_selected ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(15, 23, 42, 0.06)'
    };
}

function nodeStyle(type, is_selected)
{
    return treeNodeStyle(type, is_selected);
}

function inputStyle(type)
{
    const is_root = type === 'root';

    return {
        border: `1px solid ${is_root ? 'rgba(255,255,255,0.4)' : '#E2E8F0'}`,
        borderRadius: 6,
        padding: '6px 8px',
        fontSize: 12,
        fontFamily: "'IBM Plex Sans', sans-serif",
        width: '100%',
        background: is_root ? 'rgba(255,255,255,0.12)' : '#FFFFFF',
        color: is_root ? '#fff' : '#0F172A',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
    };
}

function labelStyle(is_root)
{
    return {
        fontSize: 11,
        color: is_root ? 'rgba(255,255,255,0.75)' : '#94A3B8',
        whiteSpace: 'nowrap'
    };
}

function iconBtnStyle(is_root)
{
    return {
        border: `1px solid ${is_root ? 'rgba(255,255,255,0.4)' : '#E2E8F0'}`,
        borderRadius: 6,
        background: is_root ? 'rgba(255,255,255,0.12)' : '#F8FAFC',
        color: is_root ? '#fff' : '#475569',
        padding: 5,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };
}

const handleStyle = { background: '#2563EB', border: '1.5px solid #fff', width: 8, height: 8 };

export default TreeNodeComponent;