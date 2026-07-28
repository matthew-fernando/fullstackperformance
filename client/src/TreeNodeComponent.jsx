import { useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, GitFork, Trash2 } from 'lucide-react';

const HOLD_DELAY_MS = 450;

function AddChildControl({ id, data, is_root })
{
    const [is_prompt_open, setIsPromptOpen] = useState(false);
    const [count_value, setCountValue] = useState('');
    const hold_timer_ref = useRef(null);
    const long_press_fired_ref = useRef(false);

    function startHoldTimer()
    {
        long_press_fired_ref.current = false;

        hold_timer_ref.current = setTimeout(() =>
        {
            long_press_fired_ref.current = true;
            setIsPromptOpen(true);
        }, HOLD_DELAY_MS);
    }

    function cancelHoldTimer()
    {
        clearTimeout(hold_timer_ref.current);
    }

    function handleMouseDown(event)
    {
        event.stopPropagation();
        startHoldTimer();
    }

    function handleMouseUp(event)
    {
        event.stopPropagation();
        cancelHoldTimer();

        if (!long_press_fired_ref.current)
        {
            data.onAddChild(id);
        }
    }

    function handleMouseLeave()
    {
        cancelHoldTimer();
    }

    function handleCountSubmit(event)
    {
        event.preventDefault();
        event.stopPropagation();

        const count = parseInt(count_value, 10);

        if (count > 0)
        {
            data.onAddChildren(id, count);
        }

        setCountValue('');
        setIsPromptOpen(false);
    }

    return (
        <div style={{ position: 'relative' }}>
            <button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="nodrag"
                style={iconBtnStyle(is_root)}
                title="Add child (hold to add several at once)"
            >
                <Plus size={13} />
            </button>

            {is_prompt_open && (
                <form
                    onSubmit={handleCountSubmit}
                    className="nodrag"
                    style={{
                        position: 'absolute',
                        bottom: '32px',
                        left: 0,
                        background: '#fff',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        padding: '4px 5px',
                        display: 'flex',
                        gap: 4,
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)'
                    }}
                >
                    <input
                        type="number"
                        min="1"
                        autoFocus
                        value={count_value}
                        onChange={event => setCountValue(event.target.value)}
                        placeholder="#"
                        style={{ width: 36, fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 4, padding: '2px 4px' }}
                    />
                    <button
                        type="submit"
                        style={{ fontSize: 11, border: 'none', background: '#2563EB', color: '#fff', borderRadius: 4, padding: '2px 7px', cursor: 'pointer' }}
                    >
                        Add
                    </button>
                </form>
            )}
        </div>
    );
}

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
        <div style={{ ...nodeStyle(data.type, is_selected), animation: data.is_wiggling ? 'wiggle 0.5s ease-in-out' : 'none' }}>
            <Handle type="target" position={Position.Top} isConnectable={false} style={handleStyle} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 8 }}>
                <input
                    type="checkbox"
                    checked={is_selected}
                    disabled={data.is_locked ?? false}
                    onChange={handleCheckboxChange}
                    className="nodrag"
                    style={{
                        marginTop: 3,
                        cursor: data.is_locked ? 'not-allowed' : 'pointer',
                        accentColor: '#2563EB',
                        opacity: data.is_locked ? 0.65 : 1
                    }}
                    title={data.is_locked ? 'A performance indicator already exists for this node' : 'Select for PI generation'}
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
                <AddChildControl id={id} data={data} is_root={is_root} />
                <button onClick={() => data.onAddLogical(id)} className="nodrag" style={iconBtnStyle(is_root)} title="Add logical child">
                    <GitFork size={13} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button onClick={() => data.onDelete(id)} className="nodrag" style={{ ...iconBtnStyle(is_root), color: '#DC2626', borderColor: '#FCA5A5' }} title="Delete">
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
        background: '#E3E8EF',
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
        background: is_root ? 'rgba(255,255,255,0.12)' : '#F8FAFC',
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