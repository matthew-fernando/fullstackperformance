import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Save, Pencil, Gauge } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

function PerformanceIndicatorsPage()
{
    const location = useLocation();
    const { classId } = useOutletContext();

    const [class_doc, setClassDoc] = useState(null);
    const [pi_groups, setPiGroups] = useState({});
    const [is_loading, setIsLoading] = useState(true);
    const [editing_outcome_ids, setEditingOutcomeIds] = useState(new Set());
    const [hovered_outcome_id, setHoveredOutcomeId] = useState(null);
    const [saving_outcome_id, setSavingOutcomeId] = useState(null);
    const [save_errors, setSaveErrors] = useState({});
    const [has_scrolled, setHasScrolled] = useState(false);
    const [armed_pi_id, setArmedPiId] = useState(null);
    
    const navigate = useNavigate();
    const initial_outcome_id_ref = useRef(location.state?.outcome_id);  
    const section_refs = useRef({});

    useEffect(() =>
    {
        fetch(`${API_BASE}/classes/${classId}`)
            .then(response => response.json())
            .then(setClassDoc)
            .catch(error => console.error('Error fetching class:', error));
    }, [classId]);

    useEffect(() =>
    {
        setIsLoading(true);

        fetch(`${API_BASE}/performance-indicators/class/${classId}`)
            .then(response => response.json())
            .then(all_pis =>
            {
                const groups = {};

                all_pis.forEach(pi =>
                {
                    const outcome_id = pi.outcome_id;
                    if (!groups[outcome_id]) groups[outcome_id] = [];
                    groups[outcome_id].push(pi);
                });

                const incoming_pis = location.state?.pis;
                const incoming_outcome_id = location.state?.outcome_id;

                if (Array.isArray(incoming_pis) && incoming_outcome_id)
                {
                    const existing = groups[incoming_outcome_id] ?? [];
                    const by_node_id = new Map(existing.map(pi => [pi.node_id, pi]));

                    incoming_pis.forEach(pi => by_node_id.set(pi.node_id, pi));

                    groups[incoming_outcome_id] = [...by_node_id.values()];

                    setEditingOutcomeIds(new Set([incoming_outcome_id]));

                    // Clear the navigation state now that we've used it once, so a page
                    // reload on this same history entry can't re-apply these stale,
                    // pre-save candidates over data that's since been saved for real.
                    navigate(location.pathname, { replace: true, state: null });
                }

                setPiGroups(groups);
            })
            .catch(error => console.error('Error fetching performance indicators:', error))
            .finally(() => setIsLoading(false));
    }, [classId]);

    useEffect(() =>
    {
        if (has_scrolled || is_loading) return;

        const target_outcome_id = initial_outcome_id_ref.current;

        if (target_outcome_id && section_refs.current[target_outcome_id])
        {
            section_refs.current[target_outcome_id].scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHasScrolled(true);
        }
    }, [is_loading, has_scrolled]);

    function autoResizeTextarea(element)
    {
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    }

    function handleCodeChange(outcome_id, index, new_code)
    {
        setPiGroups(prev => ({
            ...prev,
            [outcome_id]: prev[outcome_id].map((pi, i) => (i === index ? { ...pi, code: new_code } : pi))
        }));
    }

    function handleTitleChange(outcome_id, index, new_title)
    {
        setPiGroups(prev => ({
            ...prev,
            [outcome_id]: prev[outcome_id].map((pi, i) => (i === index ? { ...pi, title: new_title } : pi))
        }));
    }

    function startEditing(outcome_id)
    {
        setSaveErrors(prev => ({ ...prev, [outcome_id]: null }));
        setEditingOutcomeIds(prev => new Set(prev).add(outcome_id));
    }

    async function handleDeletePi(outcome_id, pi)
    {
        if (!pi._id) return;

        if (armed_pi_id !== pi._id)
        {
            setArmedPiId(pi._id);
            return;
        }

        try
        {
            const response = await fetch(`${API_BASE}/performance-indicators/${pi._id}`, { method: 'DELETE' });

            if (!response.ok)
            {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error ?? 'Delete failed');
            }

            setPiGroups(prev => ({
                ...prev,
                [outcome_id]: prev[outcome_id].filter(p => p._id !== pi._id)
            }));
            setArmedPiId(null);
        }
        catch (error)
        {
            setSaveErrors(prev => ({ ...prev, [outcome_id]: error.message }));
        }
    }

    async function handleSaveOutcome(outcome_id)
    {
        const pis = pi_groups[outcome_id] ?? [];

        if (pis.length === 0)
        {
            setEditingOutcomeIds(prev => { const next = new Set(prev); next.delete(outcome_id); return next; });
            return;
        }

        setSavingOutcomeId(outcome_id);
        setSaveErrors(prev => ({ ...prev, [outcome_id]: null }));

        try
        {
            const response = await fetch(`${API_BASE}/performance-indicators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_id: classId, outcome_id, pis })
            });

            if (!response.ok)
            {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error ?? `Save failed (${response.status})`);
            }

            setEditingOutcomeIds(prev => { const next = new Set(prev); next.delete(outcome_id); return next; });
        }
        catch (error)
        {
            setSaveErrors(prev => ({ ...prev, [outcome_id]: error.message }));
        }
        finally
        {
            setSavingOutcomeId(null);
        }
    }

    const outcome_entries = class_doc?.outcomes ?? [];

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>Performance Indicators</h1>

            {is_loading && <p style={{ color: 'var(--text-secondary)' }}>Loading performance indicators...</p>}

            {!is_loading && outcome_entries.length === 0 && (
                <div className="card" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No outcomes are assessed in this course yet.
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {outcome_entries.map(entry =>
                {
                    const outcome = entry.outcome_id;
                    const pis = pi_groups[outcome._id] ?? [];
                    const is_editing = editing_outcome_ids.has(outcome._id);
                    const is_saving = saving_outcome_id === outcome._id;
                    const save_error = save_errors[outcome._id];

                    return (
                        <div
                            key={outcome._id}
                            ref={el => { section_refs.current[outcome._id] = el; }}
                            className="card"
                            onMouseEnter={() => setHoveredOutcomeId(outcome._id)}
                            onMouseLeave={() => setHoveredOutcomeId(null)}
                        >
                            <div className="card-header">
                                <div>
                                    <h2>{outcome.code}</h2>
                                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '3px', maxWidth: '640px' }}>
                                        {outcome.statement}
                                    </p>
                                </div>

                                {pis.length > 0 && !is_editing && hovered_outcome_id === outcome._id && (
                                    <button className="btn btn-secondary" onClick={() => startEditing(outcome._id)}>
                                        <Pencil size={14} /> Edit
                                    </button>
                                )}

                                {is_editing && (
                                    <button className="btn btn-primary" onClick={() => handleSaveOutcome(outcome._id)} disabled={is_saving}>
                                        <Save size={14} /> {is_saving ? 'Saving...' : 'Save'}
                                    </button>
                                )}
                            </div>

                            <div className="card-body">
                                {save_error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{save_error}</p>}

                                {pis.length === 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        <Gauge size={16} color="var(--text-muted)" />
                                        No PIs exist for this outcome yet. Generate some from the Trees page.
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {pis.map((pi, index) => (
                                        <div key={pi._id ?? pi.node_id ?? index} style={is_editing ? { border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' } : { padding: '2px 0' }}>
                                            {is_editing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={pi.code}
                                                        onChange={event => handleCodeChange(outcome._id, index, event.target.value)}
                                                        className="form-input"
                                                        style={{ fontWeight: 600, border: 'none', padding: 0, marginBottom: '6px', fontFamily: "'Sora', sans-serif" }}
                                                    />
                                                    <textarea
                                                        ref={autoResizeTextarea}
                                                        value={pi.title}
                                                        onChange={event =>
                                                        {
                                                            handleTitleChange(outcome._id, index, event.target.value);
                                                            autoResizeTextarea(event.target);
                                                        }}
                                                        className="form-textarea"
                                                        style={{ minHeight: '40px' }}
                                                    />
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ marginTop: '6px', color: 'var(--red)', ...(armed_pi_id === pi._id ? { background: 'var(--red)', color: '#fff' } : {}) }}
                                                        onClick={() => handleDeletePi(outcome._id, pi)}
                                                    >
                                                        {armed_pi_id === pi._id ? 'Confirm Delete PI' : 'Delete PI'}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--blue)', marginBottom: '2px' }}>
                                                        {pi.code}
                                                    </div>
                                                    <div style={{ fontSize: '13.5px' }}>{pi.title}</div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PerformanceIndicatorsPage;