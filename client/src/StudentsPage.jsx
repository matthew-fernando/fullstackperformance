import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Users, Pencil } from 'lucide-react';
import Modal from './components/Modal.jsx';

const API_BASE = 'http://localhost:5001/api';

function StudentsPage()
{
    const { classId } = useOutletContext();

    const [students, setStudents] = useState([]);
    const [is_loading, setIsLoading] = useState(true);
    const [is_modal_open, setIsModalOpen] = useState(false);
    const [editing_student_id, setEditingStudentId] = useState(null);
    const [hovered_id, setHoveredId] = useState(null);
    const [is_saving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const [student_id, setStudentId] = useState('');
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [section, setSection] = useState('');

    useEffect(() => { fetchStudents(); }, [classId]);

    async function fetchStudents()
    {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/classes/${classId}/students`);
        setStudents(await response.json());
        setIsLoading(false);
    }

    function openAddModal()
    {
        setEditingStudentId(null);
        setStudentId('');
        setFirstName('');
        setLastName('');
        setSection('');
        setError(null);
        setIsModalOpen(true);
    }

    function openEditModal(student)
    {
        setEditingStudentId(student._id);
        setStudentId(String(student.student_id));
        setFirstName(student.first_name);
        setLastName(student.last_name);
        setSection(student.section !== undefined ? String(student.section) : '');
        setError(null);
        setIsModalOpen(true);
    }

    function closeModal()
    {
        setIsModalOpen(false);
    }

    async function handleSave()
    {
        if (!student_id.trim() || !first_name.trim() || !last_name.trim())
        {
            return;
        }

        setIsSaving(true);
        setError(null);

        const payload = {
            student_id: Number(student_id),
            first_name,
            last_name,
            section: section.trim() === '' ? undefined : Number(section)
        };

        try
        {
            const url = editing_student_id
                ? `${API_BASE}/classes/${classId}/students/${editing_student_id}`
                : `${API_BASE}/classes/${classId}/students`;

            const response = await fetch(url, {
                method: editing_student_id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok)
            {
                const data = await response.json();
                setError(data.error || 'Failed to save student');
                return;
            }

            closeModal();
            fetchStudents();
        }
        finally
        {
            setIsSaving(false);
        }
    }

    if (is_loading)
    {
        return <p style={{ color: 'var(--text-secondary)' }}>Loading students...</p>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Students</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={15} /> Add Student
                </button>
            </div>

            {students.length === 0 && (
                <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Users size={22} style={{ marginBottom: '10px', color: 'var(--text-muted)' }} />
                    <p>No students yet. Click "Add Student" to add your first one.</p>
                </div>
            )}

            {students.length > 0 && (
                <div className="card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Student ID</th>
                                <th>Section</th>
                                <th style={{ width: 70 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr
                                    key={student._id}
                                    onMouseEnter={() => setHoveredId(student._id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <td>{student.first_name} {student.last_name}</td>
                                    <td>{student.student_id}</td>
                                    <td>{student.section ?? '—'}</td>
                                    <td>
                                        {hovered_id === student._id && (
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(student)}>
                                                <Pencil size={13} /> Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {is_modal_open && (
                <Modal
                    title={editing_student_id === null ? 'Add Student' : 'Edit Student'}
                    onClose={closeModal}
                    footer={(
                        <>
                            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={is_saving}>
                                {is_saving ? 'Saving...' : editing_student_id === null ? 'Add Student' : 'Save Changes'}
                            </button>
                        </>
                    )}
                >
                    {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input className="form-input" value={first_name} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input className="form-input" value={last_name} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Student ID</label>
                        <input className="form-input" type="number" value={student_id} onChange={e => setStudentId(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Section</label>
                        <input className="form-input" type="number" value={section} onChange={e => setSection(e.target.value)} />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default StudentsPage;