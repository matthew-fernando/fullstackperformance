import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

function CourseInfoPage()
{
    const { class_doc: initial_class_doc, classId } = useOutletContext();
    const [class_doc, setClassDoc] = useState(initial_class_doc);
    const [all_outcomes, setAllOutcomes] = useState([]);
    const [is_editing, setIsEditing] = useState(false);
    const [is_saving, setIsSaving] = useState(false);

    const [course_code, setCourseCode] = useState('');
    const [course_name, setCourseName] = useState('');
    const [term, setTerm] = useState('');
    const [outcome_ids, setOutcomeIds] = useState(new Set());

    if (class_doc !== initial_class_doc && !is_editing && initial_class_doc)
    {
        setClassDoc(initial_class_doc);
    }

    async function startEditing()
    {
        if (all_outcomes.length === 0)
        {
            const response = await fetch(`${API_BASE}/outcomes`);
            setAllOutcomes(await response.json());
        }

        setCourseCode(class_doc.course_code);
        setCourseName(class_doc.course_name);
        setTerm(class_doc.term ?? '');
        setOutcomeIds(new Set(class_doc.outcomes.map(entry => entry.outcome_id._id)));
        setIsEditing(true);
    }

    function toggleOutcome(outcome_id)
    {
        setOutcomeIds(prev =>
        {
            const next = new Set(prev);

            if (next.has(outcome_id))
            {
                next.delete(outcome_id);
            }
            else
            {
                next.add(outcome_id);
            }

            return next;
        });
    }

    async function handleSave()
    {
        if (!course_code.trim() || !course_name.trim())
        {
            return;
        }

        setIsSaving(true);

        try
        {
            const original_ids = new Set(class_doc.outcomes.map(entry => entry.outcome_id._id));

            await fetch(`${API_BASE}/classes/${classId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_code, course_name, term })
            });

            const to_add = [...outcome_ids].filter(id => !original_ids.has(id));
            const to_remove = [...original_ids].filter(id => !outcome_ids.has(id));

            await Promise.all([
                ...to_add.map(outcome_id =>
                    fetch(`${API_BASE}/classes/${classId}/outcomes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ outcome_id })
                    })
                ),
                ...to_remove.map(outcome_id =>
                    fetch(`${API_BASE}/classes/${classId}/outcomes/${outcome_id}`, { method: 'DELETE' })
                )
            ]);

            const refreshed = await (await fetch(`${API_BASE}/classes/${classId}`)).json();
            setClassDoc(refreshed);
            setIsEditing(false);
        }
        catch (error)
        {
            console.error('Error saving course info:', error);
            alert('Failed to save changes. Check the console for details.');
        }
        finally
        {
            setIsSaving(false);
        }
    }

    if (!class_doc)
    {
        return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Course Info</h1>
                {!is_editing && (
                    <button className="btn btn-secondary" onClick={startEditing}>
                        <Pencil size={14} /> Edit
                    </button>
                )}
                {is_editing && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={is_saving}>
                            {is_saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            <div className="card card-body">
                {!is_editing && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div className="form-label">Course Code</div>
                            <p style={{ fontSize: '14px' }}>{class_doc.course_code}</p>
                        </div>
                        <div>
                            <div className="form-label">Course Name</div>
                            <p style={{ fontSize: '14px' }}>{class_doc.course_name}</p>
                        </div>
                        <div>
                            <div className="form-label">Term</div>
                            <p style={{ fontSize: '14px' }}>{class_doc.term || '—'}</p>
                        </div>
                        <div>
                            <div className="form-label">Outcomes Assessed</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {class_doc.outcomes.length === 0 && (
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None assigned</span>
                                )}
                                {class_doc.outcomes.map(entry => (
                                    <span key={entry.outcome_id._id} className="badge badge-blue">{entry.outcome_id.code}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {is_editing && (
                    <div>
                        <div className="form-group">
                            <label className="form-label">Course Code</label>
                            <input className="form-input" value={course_code} onChange={e => setCourseCode(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Course Name</label>
                            <input className="form-input" value={course_name} onChange={e => setCourseName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Term</label>
                            <input className="form-input" value={term} onChange={e => setTerm(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Outcomes Assessed</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                                {all_outcomes.map(outcome => (
                                    <label key={outcome._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                                        <input
                                            type="checkbox"
                                            checked={outcome_ids.has(outcome._id)}
                                            onChange={() => toggleOutcome(outcome._id)}
                                        />
                                        {outcome.code}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CourseInfoPage;