import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import Modal from './components/Modal.jsx';

const API_BASE = 'http://localhost:5001/api';

function CoursesPage()
{
    const [classes, setClasses] = useState([]);
    const [is_loading, setIsLoading] = useState(true);
    const [is_modal_open, setIsModalOpen] = useState(false);
    const [course_code, setCourseCode] = useState('');
    const [course_name, setCourseName] = useState('');
    const [term, setTerm] = useState('');
    const [is_saving, setIsSaving] = useState(false);

    const navigate = useNavigate();

    useEffect(() => { fetchClasses(); }, []);

    async function fetchClasses()
    {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/classes`);
        setClasses(await response.json());
        setIsLoading(false);
    }

    function closeModal()
    {
        setIsModalOpen(false);
        setCourseCode('');
        setCourseName('');
        setTerm('');
    }

    async function handleCreateClass()
    {
        if (!course_code.trim() || !course_name.trim()) return;

        setIsSaving(true);

        try
        {
            const response = await fetch(`${API_BASE}/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_code, course_name, term, outcome_ids: [] })
            });

            if (response.ok)
            {
                closeModal();
                fetchClasses();
            }
        }
        finally
        {
            setIsSaving(false);
        }
    }

    if (is_loading)
    {
        return <p style={{ color: 'var(--text-secondary)' }}>Loading courses...</p>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Courses</h1>
            </div>

            <div className="card-grid">
                {classes.map(class_doc => (
                    <div
                        key={class_doc._id}
                        className="card"
                        style={{ cursor: 'pointer', padding: '18px 20px' }}
                        onClick={() => navigate(`/classes/${class_doc._id}`)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 8,
                                background: 'var(--blue-bg)', color: 'var(--blue)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <BookOpen size={17} />
                            </div>
                            <div>
                                <h3>{class_doc.course_code}</h3>
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {class_doc.course_name}
                        </p>
                        {class_doc.term && (
                            <span className="badge badge-gray">{class_doc.term}</span>
                        )}
                    </div>
                ))}

                <button className="add-card" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Add Course</span>
                </button>
            </div>

            {is_modal_open && (
                <Modal
                    title="Add Course"
                    onClose={closeModal}
                    footer={(
                        <>
                            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateClass} disabled={is_saving}>
                                {is_saving ? 'Creating...' : 'Create Course'}
                            </button>
                        </>
                    )}
                >
                    <div className="form-group">
                        <label className="form-label">Course Code</label>
                        <input className="form-input" placeholder="e.g. CSE416" value={course_code} onChange={e => setCourseCode(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Course Name</label>
                        <input className="form-input" placeholder="e.g. Software Engineering" value={course_name} onChange={e => setCourseName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Term</label>
                        <input className="form-input" placeholder="e.g. Fall 2026" value={term} onChange={e => setTerm(e.target.value)} />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default CoursesPage;