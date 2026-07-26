import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';

function emptyQuestion()
{
    return { question_label: '', criteria: [] };
}

function emptyCriterion()
{
    return { desc: '', points: 0, deduction: [] };
}

function AssignmentFormModal({ initial_assignment, onClose, onSave })
{
    const is_editing = !!initial_assignment;

    const [name, setName] = useState(initial_assignment?.name ?? '');
    const [questions, setQuestions] = useState(
        initial_assignment?.questions?.length ? initial_assignment.questions : [emptyQuestion()]
    );
    const [is_saving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() =>
    {
        setName(initial_assignment?.name ?? '');
        setQuestions(initial_assignment?.questions?.length ? initial_assignment.questions : [emptyQuestion()]);
    }, [initial_assignment]);

    function updateQuestionLabel(index, value)
    {
        setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, question_label: value } : q)));
    }

    function addQuestion()
    {
        setQuestions(prev => [...prev, emptyQuestion()]);
    }

    function removeQuestion(index)
    {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    }

    function addCriterion(question_index)
    {
        setQuestions(prev => prev.map((q, i) =>
            i === question_index ? { ...q, criteria: [...q.criteria, emptyCriterion()] } : q
        ));
    }

    function updateCriterion(question_index, criterion_index, field, value)
    {
        setQuestions(prev => prev.map((q, i) =>
        {
            if (i !== question_index) return q;

            return {
                ...q,
                criteria: q.criteria.map((c, ci) => (ci === criterion_index ? { ...c, [field]: value } : c))
            };
        }));
    }

    function removeCriterion(question_index, criterion_index)
    {
        setQuestions(prev => prev.map((q, i) =>
        {
            if (i !== question_index) return q;
            return { ...q, criteria: q.criteria.filter((_, ci) => ci !== criterion_index) };
        }));
    }

    async function handleSubmit()
    {
        if (!name.trim())
        {
            setError('Assignment name is required.');
            return;
        }

        const cleaned_questions = questions
            .filter(q => q.question_label.trim())
            .map(q => ({
                question_label: q.question_label,
                criteria: q.criteria
                    .filter(c => c.desc.trim())
                    .map(c => ({ desc: c.desc, points: Number(c.points) || 0, deduction: c.deduction ?? [] }))
            }));

        if (cleaned_questions.length === 0)
        {
            setError('Add at least one question.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try
        {
            await onSave({ name, questions: cleaned_questions });
        }
        catch (err)
        {
            setError(err.message || 'Failed to save assignment.');
        }
        finally
        {
            setIsSaving(false);
        }
    }

    return (
        <Modal
            title={is_editing ? 'Edit Assignment' : 'Add Assignment'}
            onClose={onClose}
            footer={(
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={is_saving}>
                        {is_saving ? 'Saving...' : is_editing ? 'Save Changes' : 'Create Assignment'}
                    </button>
                </>
            )}
        >
            {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div className="form-group">
                <label className="form-label">Assignment Name</label>
                <input className="form-input" placeholder="e.g. Lab 1" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <label className="form-label">Questions</label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px', marginBottom: '10px' }}>
                {questions.map((question, question_index) => (
                    <div key={question_index} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input
                                className="form-input"
                                placeholder="Question label (e.g. P1E3)"
                                value={question.question_label}
                                onChange={e => updateQuestionLabel(question_index, e.target.value)}
                            />
                            <button className="btn btn-ghost btn-sm" onClick={() => removeQuestion(question_index)} title="Remove question">
                                <Trash2 size={13} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {question.criteria.map((criterion, criterion_index) => (
                                <div key={criterion_index} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input
                                        className="form-input"
                                        placeholder="Criterion description"
                                        value={criterion.desc}
                                        onChange={e => updateCriterion(question_index, criterion_index, 'desc', e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="Pts"
                                        value={criterion.points}
                                        onChange={e => updateCriterion(question_index, criterion_index, 'points', e.target.value)}
                                        style={{ width: '64px' }}
                                    />
                                    <button className="btn btn-ghost btn-sm" onClick={() => removeCriterion(question_index, criterion_index)} title="Remove criterion">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-ghost btn-sm" onClick={() => addCriterion(question_index)} style={{ marginTop: '8px' }}>
                            <Plus size={12} /> Add Criterion
                        </button>
                    </div>
                ))}
            </div>

            <button className="btn btn-secondary btn-sm" onClick={addQuestion}>
                <Plus size={13} /> Add Question
            </button>
        </Modal>
    );
}

export default AssignmentFormModal;