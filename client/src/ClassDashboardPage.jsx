import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Pencil, X } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

function ClassDashboardPage()
{
    const [classes, setClasses] = useState([]);
    const [all_outcomes, setAllOutcomes] = useState([]);
    const [is_loading, setIsLoading] = useState(true);
    const [is_form_open, setIsFormOpen] = useState(false);
    const [course_code, setCourseCode] = useState('');
    const [course_name, setCourseName] = useState('');
    const [term, setTerm] = useState('');

    const [editing_class_id, setEditingClassId] = useState(null);
    const [edit_course_code, setEditCourseCode] = useState('');
    const [edit_course_name, setEditCourseName] = useState('');
    const [edit_term, setEditTerm] = useState('');
    const [edit_outcome_ids, setEditOutcomeIds] = useState(new Set());
    const [is_saving_edit, setIsSavingEdit] = useState(false);

    const navigate = useNavigate();

    useEffect(() =>
    {
        fetchClasses();
        fetch(`${API_BASE}/outcomes`).then(res => res.json()).then(setAllOutcomes);
    }, []);

    async function fetchClasses()
    {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/classes`);
        const data = await response.json();
        setClasses(data);
        setIsLoading(false);
    }

    async function handleCreateClass()
    {
        if (!course_code.trim() || !course_name.trim())
        {
            return;
        }

        const response = await fetch(`${API_BASE}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code, course_name, term, outcome_ids: [] })
        });

        if (response.ok)
        {
            setCourseCode('');
            setCourseName('');
            setTerm('');
            setIsFormOpen(false);
            fetchClasses();
        }
    }

    async function openEdit(class_id)
    {
        const response = await fetch(`${API_BASE}/classes/${class_id}`);
        const class_doc = await response.json();

        setEditingClassId(class_id);
        setEditCourseCode(class_doc.course_code);
        setEditCourseName(class_doc.course_name);
        setEditTerm(class_doc.term ?? '');
        setEditOutcomeIds(new Set(class_doc.outcomes.map(entry => entry.outcome_id._id)));
    }

    function closeEdit()
    {
        setEditingClassId(null);
    }

    function toggleEditOutcome(outcome_id)
    {
        setEditOutcomeIds(prev_ids =>
        {
            const next = new Set(prev_ids);

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

    async function handleSaveEdit()
    {
        if (!edit_course_code.trim() || !edit_course_name.trim())
        {
            return;
        }

        setIsSavingEdit(true);

        try
        {
            const original_class = await (await fetch(`${API_BASE}/classes/${editing_class_id}`)).json();
            const original_ids = new Set(original_class.outcomes.map(entry => entry.outcome_id._id));

            await fetch(`${API_BASE}/classes/${editing_class_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_code: edit_course_code,
                    course_name: edit_course_name,
                    term: edit_term
                })
            });

            const to_add = [...edit_outcome_ids].filter(id => !original_ids.has(id));
            const to_remove = [...original_ids].filter(id => !edit_outcome_ids.has(id));

            await Promise.all([
                ...to_add.map(outcome_id =>
                    fetch(`${API_BASE}/classes/${editing_class_id}/outcomes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ outcome_id })
                    })
                ),
                ...to_remove.map(outcome_id =>
                    fetch(`${API_BASE}/classes/${editing_class_id}/outcomes/${outcome_id}`, {
                        method: 'DELETE'
                    })
                )
            ]);

            setEditingClassId(null);
            fetchClasses();
        }
        catch (error)
        {
            console.error('Error saving class edits:', error);
            alert('Failed to save changes. Check the console for details.');
        }
        finally
        {
            setIsSavingEdit(false);
        }
    }

    if (is_loading)
    {
        return <div style={{ padding: '2rem' }}>Loading classes...</div>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Your Classes</h1>
                <button onClick={() => setIsFormOpen(!is_form_open)}>
                    <Plus size={16} /> Add Class
                </button>
            </div>

            {is_form_open && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <input
                        placeholder="Course code (e.g. CSE416)"
                        value={course_code}
                        onChange={e => setCourseCode(e.target.value)}
                        style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
                    />
                    <input
                        placeholder="Course name"
                        value={course_name}
                        onChange={e => setCourseName(e.target.value)}
                        style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
                    />
                    <input
                        placeholder="Term (e.g. Fall 2026)"
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
                    />
                    <button onClick={handleCreateClass}>Create</button>
                </div>
            )}

            {classes.length === 0 && !is_form_open && (
                <p>No classes yet. Click "Add Class" to create your first one.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {classes.map(class_doc => (
                    <div key={class_doc._id}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px'
                            }}
                        >
                            <div
                                onClick={() => navigate(`/classes/${class_doc._id}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}
                            >
                                <BookOpen size={20} />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{class_doc.course_code} — {class_doc.course_name}</div>
                                    {class_doc.term && <div style={{ fontSize: '0.85rem', color: '#666' }}>{class_doc.term}</div>}
                                </div>
                            </div>

                            <button onClick={() => openEdit(class_doc._id)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Pencil size={14} /> Edit
                            </button>
                        </div>

                        {editing_class_id === class_doc._id && (
                            <div style={{ marginTop: '0.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <strong>Edit Class</strong>
                                    <button onClick={closeEdit} style={{ display: 'flex', alignItems: 'center' }}>
                                        <X size={16} />
                                    </button>
                                </div>

                                <input
                                    placeholder="Course code"
                                    value={edit_course_code}
                                    onChange={e => setEditCourseCode(e.target.value)}
                                    style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
                                />
                                <input
                                    placeholder="Course name"
                                    value={edit_course_name}
                                    onChange={e => setEditCourseName(e.target.value)}
                                    style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
                                />
                                <input
                                    placeholder="Term"
                                    value={edit_term}
                                    onChange={e => setEditTerm(e.target.value)}
                                    style={{ display: 'block', marginBottom: '0.75rem', width: '100%' }}
                                />

                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Outcomes assessed:</div>
                                    {all_outcomes.map(outcome => (
                                        <label key={outcome._id} style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={edit_outcome_ids.has(outcome._id)}
                                                onChange={() => toggleEditOutcome(outcome._id)}
                                            />
                                            {' '}{outcome.code}
                                        </label>
                                    ))}
                                </div>

                                <button onClick={handleSaveEdit} disabled={is_saving_edit}>
                                    {is_saving_edit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ClassDashboardPage;