import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';

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
    const navigate = useNavigate();

    const [outcomes, setOutcomes] = useState([]);
    const [selected_outcome_id, setSelectedOutcomeId] = useState(location.state?.outcome_id ?? '');
    const [level_count, setLevelCount] = useState(4);
    const [levels, setLevels] = useState([]);
    const [boundaries, setBoundaries] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading_existing, setLoadingExisting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generate_error, setGenerateError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [save_error, setSaveError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [boundary_drafts, setBoundaryDrafts] = useState([]);
    const [level_count_draft, setLevelCountDraft] = useState('4');

    useEffect(() =>
    {
        setLevelCountDraft(String(level_count));
    }, [level_count]);

    useEffect(() =>
    {
        setBoundaryDrafts(boundaries.map(String));
    }, [boundaries]);
    
    useEffect(() =>
    {
        fetch('http://localhost:5001/api/outcomes')
            .then(response => response.json())
            .then(data => setOutcomes(data))
            .catch(error => console.error('Error fetching outcomes:', error));
    }, []);

    useEffect(() =>
    {
        if (!selected_outcome_id)
        {
            setLevels([]);
            setBoundaries([]);
            setRows([]);
            return;
        }

        setLoadingExisting(true);
        setSaved(false);
        setGenerateError(null);

        fetch(`http://localhost:5001/api/outcomes/${selected_outcome_id}/rubric`)
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
    }, [selected_outcome_id]);

    const selected_outcome = outcomes.find(outcome => outcome._id === selected_outcome_id);
    const outcome_code = selected_outcome?.code ?? location.state?.outcome_code ?? '';
    const ranges = computeRanges(boundaries, levels.length);

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
        setSaved(false);
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
        setSaved(false);

        try
        {
            const response = await fetch(`http://localhost:5001/api/outcomes/${selected_outcome_id}/generate-rubric`,
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
        setSaved(false);
    }

    function handleBoundaryChange(index, raw_value)
    {
        const parsed = parseInt(raw_value, 10);

        if (Number.isNaN(parsed))
        {
            return;
        }

        const lower_bound = index === 0 ? 0 : boundaries[index - 1];
        const upper_bound = index === boundaries.length - 1 ? 100 : boundaries[index + 1];

        const clamped = Math.min(Math.max(parsed, lower_bound + 1), upper_bound - 1);

        setBoundaries(prev_boundaries =>
            prev_boundaries.map((boundary, i) => (i === index ? clamped : boundary))
        );
        setSaved(false);
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
        setSaved(false);
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

            const response = await fetch(`http://localhost:5001/api/outcomes/${selected_outcome_id}/rubric`,
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

            setSaved(true);
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
        <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate('/')} style={backButtonStyle}>
                    <ArrowLeft size={14} /> Back
                </button>

                {rows.length > 0 && (
                    <button onClick={handleSave} disabled={saving} style={saveButtonStyle}>
                        <Save size={14} /> {saving ? 'Saving...' : 'Save Rubric'}
                    </button>
                )}
            </div>

            <h2 style={{ marginTop: 16 }}>Outcome Grading Rubric {outcome_code && `— ${outcome_code}`}</h2>

            <select
                value={selected_outcome_id}
                onChange={(event) => handleOutcomeChange(event.target.value)}
                style={selectStyle}
            >
                <option value="">Select an outcome...</option>
                {outcomes.map(outcome => (
                    <option key={outcome._id} value={outcome._id}>
                        {outcome.code}
                    </option>
                ))}
            </select>

            {loading_existing && <p style={{ color: '#1e3a5f' }}>Checking for an existing rubric...</p>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#FFFFFF' }}>
                    Number of assessment levels:
                </label>
                <input
                    type="number"
                    min={2}
                    max={10}
                    value={level_count_draft}
                    onChange={(event) => setLevelCountDraft(event.target.value)}
                    onBlur={() =>
                    {
                        const parsed = parseInt(level_count_draft, 10);
                        const clamped = Number.isNaN(parsed) ? level_count : Math.min(Math.max(parsed, 2), 10);
                        setLevelCount(clamped);
                        setLevelCountDraft(String(clamped));
                    }}
                    onKeyDown={(event) =>
                    {
                        if (event.key === 'Enter')
                        {
                            event.target.blur();
                        }
                    }}
                    style={levelCountInputStyle}
                />
                <button onClick={handleGenerate} disabled={generating || !selected_outcome_id} style={generateButtonStyle}>
                    <Sparkles size={14} /> {generating ? 'Generating...' : (rows.length > 0 ? 'Regenerate Rubric' : 'Generate Rubric')}
                </button>
            </div>

            {generate_error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{generate_error}</p>}
            {save_error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{save_error}</p>}
            {saved && !save_error && <p style={{ color: '#16a34a', marginBottom: 16 }}>Saved successfully.</p>}

            {rows.length > 0 && (
                <>
                    <div style={boundaryStripStyle}>
                        <span style={{ fontSize: 12, color: '#1e3a5f', fontWeight: 600 }}>0%</span>
                        {boundary_drafts.map((draft, index) => (
                            <input
                                key={index}
                                type="number"
                                value={draft}
                                onChange={(event) => handleBoundaryInput(index, event.target.value)}
                                onBlur={() => handleBoundaryCommit(index)}
                                onKeyDown={(event) =>
                                {
                                    if (event.key === 'Enter')
                                    {
                                        event.target.blur();
                                    }
                                }}
                                style={boundaryInputStyle}
                            />
                        ))}
                        <span style={{ fontSize: 12, color: '#1e3a5f', fontWeight: 600 }}>100%</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: -8, marginBottom: 16 }}>
                        Each number is the cutoff between two levels — it can never cross its neighbors.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={headerCellStyle}>Performance Indicator</th>
                                    {levels.map((level, index) => (
                                        <th key={level.order} style={headerCellStyle}>
                                            <input
                                                type="text"
                                                value={level.label}
                                                onChange={(event) => handleLevelLabelChange(level.order, event.target.value)}
                                                style={levelLabelInputStyle}
                                            />
                                            <div style={{ fontSize: 12, color: '#1e3a5f', marginTop: 4, textAlign: 'center' }}>
                                                {ranges[index].min}% – {ranges[index].max}%
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => (
                                    <tr key={row.pi_id}>
                                        <td style={piCellStyle}>
                                            <div style={{ fontWeight: 600, fontSize: 12, color: '#1e3a5f', marginBottom: 4 }}>
                                                {row.pi_code}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#1e3a5f' }}>
                                                {row.pi_text}
                                            </div>
                                        </td>
                                        {row.descriptors
                                            .slice()
                                            .sort((a, b) => a.order - b.order)
                                            .map(descriptor => (
                                                <td key={descriptor.order} style={descriptorCellStyle}>
                                                    <textarea
                                                        ref={autoResizeTextarea}
                                                        value={descriptor.text}
                                                        onChange={(event) =>
                                                        {
                                                            handleDescriptorChange(row.pi_id, descriptor.order, event.target.value);
                                                            autoResizeTextarea(event.target);
                                                        }}
                                                        style={descriptorInputStyle}
                                                    />
                                                </td>
                                            ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

const backButtonStyle =
{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #1e3a5f',
    background: '#fff',
    color: '#1e3a5f',
    cursor: 'pointer',
    fontSize: 13
};

const saveButtonStyle =
{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#1e3a5f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13
};

const generateButtonStyle =
{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #1e3a5f',
    background: '#1e3a5f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13
};

const selectStyle =
{
    padding: 8,
    borderRadius: 6,
    border: '1px solid #1e3a5f',
    color: '#1e3a5f',
    marginBottom: 12,
    width: '100%',
    fontSize: 14,
    background: '#fff'
};

const levelCountInputStyle =
{
    width: 60,
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #1e3a5f',
    fontSize: 13,
    color: '#1e3a5f',
    colorScheme: 'light'
};

const boundaryStripStyle =
{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '12px 16px',
    border: '1px solid #1e3a5f',
    borderRadius: 8,
    marginBottom: 4,
    background: '#fff'
};

const boundaryInputStyle =
{
    width: 55,
    padding: '4px 6px',
    borderRadius: 4,
    border: '1px solid #1e3a5f',
    background: '#fff',
    fontSize: 13,
    color: '#1e3a5f',
    textAlign: 'center',
    colorScheme: 'light'
};

const tableStyle =
{
    borderCollapse: 'collapse',
    width: '100%',
    background: '#fff'
};

const headerCellStyle =
{
    border: '1px solid #1e3a5f',
    padding: 10,
    background: '#fff',
    textAlign: 'left',
    verticalAlign: 'top',
    minWidth: 180
};

const levelLabelInputStyle =
{
    fontWeight: 600,
    fontSize: 13,
    color: '#1e3a5f',
    border: 'none',
    background: 'transparent',
    width: '100%',
    outline: 'none'
};

const piCellStyle =
{
    border: '1px solid #1e3a5f',
    padding: 10,
    verticalAlign: 'top',
    background: '#fff',
    minWidth: 180
};

const descriptorCellStyle =
{
    border: '1px solid #1e3a5f',
    padding: 6,
    verticalAlign: 'top'
};

const descriptorInputStyle =
{
    width: '100%',
    border: 'none',
    fontSize: 13,
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#FFFFFF'
};

export default OutcomeRubricPage;