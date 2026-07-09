import { Handle, Position } from '@xyflow/react';
import { Plus, GitBranch, Trash2 } from 'lucide-react';

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

    return (
        <div style={nodeStyle(data.type)}>
            <Handle type="target" position={Position.Top} isConnectable={false} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                <input
                    type="checkbox"
                    checked={data.is_selected ?? false}
                    onChange={handleCheckboxChange}
                    className="nodrag"
                    style={{ marginTop: 3, cursor: 'pointer' }}
                    title="Select for PI generation"
                />

                <div style={{ flex: 1 }}>
                    {data.type === 'root' ? (
                        <div style={{ fontWeight: 600, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{data.label}</div>
                    ) : data.type === 'logical' ? (
                        <div style={{ fontWeight: 600, fontStyle: 'italic', color: '#94a3b8' }}>Logical</div>
                    ) : (
                        <textarea
                            value={data.label}
                            onChange={handleLabelChange}
                            className="nodrag"
                            style={{ ...inputStyle, resize: 'none', minHeight: 36 }}
                            placeholder="Keyword"
                            rows={2}
                        />
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <label style={labelStyle}>Weight</label>
                <input
                    type="number"
                    value={data.weight}
                    onChange={handleWeightChange}
                    className="nodrag"
                    style={{ ...inputStyle, width: 60 }}
                />
            </div>

            {child_count > 0 && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle}>Min to pass</label>
                    <select value={data.threshold} onChange={handleThresholdChange} className="nodrag" style={inputStyle}>
                        {threshold_options.map(option => (
                            <option key={option} value={option}>
                                {option === child_count ? 'All' : option}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button onClick={() => data.onAddChild(id)} style={iconBtnStyle} title="Add child">
                    <Plus size={14} />
                </button>
                <button onClick={() => data.onAddLogical(id)} style={iconBtnStyle} title="Add logical child">
                    <GitBranch size={14} />
                </button>
                <button onClick={() => data.onDelete(id)} style={{ ...iconBtnStyle, color: '#dc2626' }} title="Delete">
                    <Trash2 size={14} />
                </button>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={false} />
        </div>
    );
}

export function treeNodeStyle(type)
{
    return {
        padding: 14,
        borderRadius: 10,
        border: type === 'logical' ? '1px dashed #475569' : '1px solid #1e293b',
        background: type === 'root' ? '#1e3a5f' : type === 'logical' ? '#334155' : '#1e293b',
        width: 220,
        minHeight: 110,
        fontSize: 12,
        color: '#f1f5f9',
        boxSizing: 'border-box'
    };
}

function nodeStyle(type)
{
    return treeNodeStyle(type);
}

const inputStyle =
{
    border: '1px solid #475569',
    borderRadius: 6,
    padding: '6px 8px',
    fontSize: 12,
    width: '100%',
    background: '#0f172a',
    color: '#f1f5f9',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
};

const labelStyle =
{
    fontSize: 11,
    color: '#94a3b8',
    whiteSpace: 'nowrap'
};

const iconBtnStyle =
{
    border: '1px solid #475569',
    borderRadius: 6,
    background: '#0f172a',
    color: '#f1f5f9',
    padding: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

export default TreeNodeComponent;