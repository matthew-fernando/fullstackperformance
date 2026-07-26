import { useState, useEffect } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Save, Sparkles, Pencil, ClipboardList } from 'lucide-react';

function computeRanges(boundaries, level_count)
{
    const ranges = [];

    for (let i = 0; i < level_count; i++)
    {
        const min = i === 0 ? 0 : boundaries[i - 1];
        const max = i === level_count - 1 ? 100 : boundaries[i];
        ranges.push({ min, max });
    }

    return ranges;
}

function evenBoundaries(level_count)
{
    const boundaries = [];

    for (let i = 1; i < level_count; i++)
    {
        boundaries.push(Math.round((100 * i) / level_count));
    }

    return boundaries;
}

function OutcomeRubricPage()
{
    const location = useLocation();
    const { classId } = useOutletContext();

    const [class_doc, setClassDoc] = useState(null);
    const [selected_outcome_id, setSelectedOutcomeId] = useState(location.state?.outcome_id ?? '');
    const [level_count, setLevelCount] = useState(4);
    const [levels, setLevels] = useState([]);
    const [boundaries, setBoundaries] = useState([]);
    const [rows, setRows] = useState([]);
    const [is_editing, setIsEditing] = useState(false);
    const [loading_existing, setLoadingExisting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generate_error, setGenerateError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [save_error, setSaveError] = useState(null);
    const [boundary_drafts, setBoundaryDrafts] = useState([]);
    const [level_count_draft, setLevelCountDraft] = useState('4');

    useEffect(() =>
    {
        fetch(`http://localhost:5001/api/classes/${classId}`)
            .then(response => response.json())
            .then(data => setClassDoc(data))
            .catch(error => console.error('Error fetching class:', error));
    }, [classId]);

    useEffect(() =>
    {
        if (!selected_outcome_id)
        {
            setLevels([]);
            setBoundaries([]);
            setRows([]);
            setIsEditing(false);
            return;
        }

        setLoadingExisting(true);
        setGenerateError(null);
        setIsEditing(false);

        fetch(`http://localhost:5001/api/classes/${classId}/outcomes/${selected_outcome_id}/rubric`)
            .then(response => response.json())
            .then(data =>
            {
                if (data.levels.length > 0)
                {
                    const sorted_levels = data.levels.slice().sort((a, b) => a.order - b.order);
                    const loaded_boundaries = sorted_levels.slice(0, -1).map(level => level.percentage_max);

                    setLevels(sorted_levels.map(level => ({ order: level.order, label: level.label })));
                    setBoundaries(loaded_boundaries);
                    setRows(data.rows);
                    setLevelCount(sorted_levels.length);
                    setLevelCountDraft(String(sorted_levels.length));
                }
                else
                {
                    setLevels([]);
                    setBoundaries([]);
                    setRows([]);
                }
            })
            .catch(error => console.error('Error fetching existing rubric:', error))
            .finally(() => setLoadingExisting(false));
    }, [classId, selected_outcome_id]);

    useEffect(() =>
    {
        setBoundaryDrafts(boundaries.map(String));
    }, [boundaries]);

    const outcome_entries = class_doc?.outcomes ?? [];
    const selected_entry = outcome_entries.find(entry => entry.outcome_id._id === selected_outcome_id);
    const outcome_code = selected_entry?.outcome_id.code ?? location.state?.outcome_code ?? '';
    const ranges = computeRanges(boundaries, levels.length);
    const has_rubric = rows.length > 0;

    function autoResizeTextarea(element)
    {
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    }

    function handleBoundaryInput(index, raw_value)
    {
        setBoundaryDrafts(prev_drafts =>
            prev_drafts.map((draft, i) => (i === index ? raw_value : draft))
        );
    }

    function handleBoundaryCommit(index)
    {
        const parsed = parseInt(boundary_drafts[index], 10);

        if (Number.isNaN(parsed))
        {
            setBoundaryDrafts(prev_drafts =>
                prev_drafts.map((draft, i) => (i === index ? String(boundaries[i]) : draft))
            );
            return;
        }

        const clamped_value = Math.min(Math.max(parsed, 1), 99);

        const new_boundaries = boundaries.slice();
        new_boundaries[index] = clamped_value;

        for (let i = index + 1; i < new_boundaries.length; i++)
        {
            if (new_boundaries[i] <= new_boundaries[i - 1])
            {
                new_boundaries[i] = Math.min(new_boundaries[i - 1] + 1, 99);
            }
        }

        for (let i = index - 1; i >= 0; i--)
        {
            if (new_boundaries[i] >= new_boundaries[i + 1])
            {
                new_boundaries[i] = Math.max(new_boundaries[i + 1] - 1, 1);
            }
        }

        setBoundaries(new_boundaries);
        setBoundaryDrafts(new_boundaries.map(String));
    }

    function handleOutcomeChange(new_outcome_id)
    {
        setSelectedOutcomeId(new_outcome_id);
        setGenerateError(null);
        setSaveError(null);
    }

    async function handleGenerate()
    {
        if (!selected_outcome_id)
        {
            setGenerateError('Select an outcome first.');
            return;
        }

        setGenerating(true);
        setGenerateError(null);

        try
        {
            const response = await fetch(`http://localhost:5001/api/classes/${classId}/outcomes/${selected_outcome_id}/generate-rubric`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level_count })
            });

            if (!response.ok)
            {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error ?? `Generate failed (${response.status})`);
            }

            const data = await response.json();

            setLevels(data.levels);
            setBoundaries(evenBoundaries(data.levels.length));
            setRows(data.rows);
            setIsEditing(true);
        }
        catch (error)
        {
            setGenerateError(error.message);
        }
        finally
        {
            setGenerating(false);
        }
    }

    function handleLevelLabelChange(order, new_label)
    {
        setLevels(prev_levels =>
            prev_levels.map(level => (level.order === order ? { ...level, label: new_label } : level))
        );
    }

    function handleDescriptorChange(pi_id, order, new_text)
    {
        setRows(prev_rows =>
            prev_rows.map(row =>
            {
                if (row.pi_id !== pi_id) return row;

                return {
                    ...row,
                    descriptors: row.descriptors.map(descriptor =>
                        descriptor.order === order ? { ...descriptor, text: new_text } : descriptor
                    )
                };
            })
        );
    }

    async function handleSave()
    {
        if (!selected_outcome_id)
        {
            setSaveError('Select an outcome first.');
            return;
        }

        setSaving(true);
        setSaveError(null);

        try
        {
            const payload =
            {
                levels: levels.map((level, index) => ({
                    order: level.order,
                    label: level.label,
                    percentage_min: ranges[index].min,
                    percentage_max: ranges[index].max
                })),
                rows
            };

            const response = await fetch(`http://localhost:5001/api/classes/${classId}/outcomes/${selected_outcome_id}/rubric`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok)
            {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error ?? `Save failed (${response.status})`);
            }

            setIsEditing(false);
        }
        catch (error)
        {
            setSaveError(error.message);
        }
        finally
        {
            setSaving(false);
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Rubrics</h1>
            </div>

            <div className="form-group" style={{ maxWidth: '280px' }}>
                <label className="form-label">Outcome</label>
                <select
                    className="form-select"
                    value={selected_outcome_id}
                    onChange={event => handleOutcomeChange(event.target.value)}
                >
                    <option value="">Select an outcome...</option>
                    {outcome_entries.map(entry => (
                        <option key={entry.outcome_id._id} value={entry.outcome_id._id}>
                            {entry.outcome_id.code}
                        </option>
                    ))}
                </select>
            </div>

            {loading_existing && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Checking for an existing rubric...</p>}

            {!loading_existing && !selected_outcome_id && (
                <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <ClipboardList size={22} style={{ marginBottom: '10px', color: 'var(--text-muted)' }} />
                    <p>Select an outcome above to view or generate its rubric.</p>
                </div>
            )}

            {!loading_existing && selected_outcome_id && !has_rubric && (
                <div className="card card-body">
                    <h3 style={{ marginBottom: '4px' }}>No rubric yet for {outcome_code}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Generate one from this outcome's performance indicators.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0, width: '160px' }}>
                            <label className="form-label">Assessment Levels</label>
                            <input
                                type="number"
                                min={2}
                                max={10}
                                className="form-input"
                                value={level_count_draft}
                                onChange={event => setLevelCountDraft(event.target.value)}
                                onBlur={() =>
                                {
                                    const parsed = parseInt(level_count_draft, 10);
                                    const clamped = Number.isNaN(parsed) ? level_count : Math.min(Math.max(parsed, 2), 10);
                                    setLevelCount(clamped);
                                    setLevelCountDraft(String(clamped));
                                }}
                                onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); }}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                            <Sparkles size={14} /> {generating ? 'Generating...' : 'Generate Rubric'}
                        </button>
                    </div>

                    {generate_error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{generate_error}</p>}
                </div>
            )}

            {!loading_existing && has_rubric && (
                <div className="card">
                    <div className="card-header">
                        <h2>{outcome_code}</h2>

                        {!is_editing && (
                            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                                <Pencil size={14} /> Edit
                            </button>
                        )}

                        {is_editing && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" onClick={handleGenerate} disabled={generating}>
                                    <Sparkles size={14} /> {generating ? 'Regenerating...' : 'Regenerate'}
                                </button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card-body">
                        {generate_error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{generate_error}</p>}
                        {save_error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{save_error}</p>}

                        {is_editing && (
                            <>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '8px',
                                    background: '#F8FAFC', marginBottom: '6px'
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>0%</span>
                                    {boundary_drafts.map((draft, index) => (
                                        <input
                                            key={index}
                                            type="number"
                                            className="form-input"
                                            value={draft}
                                            onChange={event => handleBoundaryInput(index, event.target.value)}
                                            onBlur={() => handleBoundaryCommit(index)}
                                            onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); }}
                                            style={{ width: '60px', textAlign: 'center' }}
                                        />
                                    ))}
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>100%</span>
                                </div>
                                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    Each number is the cutoff between two levels — it can never cross its neighbors.
                                </p>
                            </>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ tableLayout: 'fixed', minWidth: '720px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '220px' }}>Performance Indicator</th>
                                        {levels.map((level, index) => (
                                            <th key={level.order}>
                                                {is_editing ? (
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={level.label}
                                                        onChange={event => handleLevelLabelChange(level.order, event.target.value)}
                                                        style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0, marginBottom: '4px' }}
                                                    />
                                                ) : (
                                                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', textTransform: 'none', letterSpacing: 0 }}>
                                                        {level.label}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none', marginTop: '4px' }}>
                                                    {ranges[index].min}% – {ranges[index].max}%
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(row => (
                                        <tr key={row.pi_id}>
                                            <td style={{ verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--blue)', marginBottom: '3px' }}>
                                                    {row.pi_code}
                                                </div>
                                                <div style={{ fontSize: '13px' }}>{row.pi_text}</div>
                                            </td>
                                            {row.descriptors
                                                .slice()
                                                .sort((a, b) => a.order - b.order)
                                                .map(descriptor => (
                                                    <td key={descriptor.order} style={{ verticalAlign: 'top' }}>
                                                        {is_editing ? (
                                                            <textarea
                                                                ref={autoResizeTextarea}
                                                                className="form-textarea"
                                                                value={descriptor.text}
                                                                onChange={event =>
                                                                {
                                                                    handleDescriptorChange(row.pi_id, descriptor.order, event.target.value);
                                                                    autoResizeTextarea(event.target);
                                                                }}
                                                                style={{ minHeight: '48px' }}
                                                            />
                                                        ) : (
                                                            <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{descriptor.text}</p>
                                                        )}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OutcomeRubricPage;