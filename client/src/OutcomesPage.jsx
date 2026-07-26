import { useState, useEffect } from 'react';
import { Plus, Target } from 'lucide-react';
import Modal from './components/Modal.jsx';

const API_BASE = 'http://localhost:5001/api';

function OutcomesPage()
{
    const [outcomes, setOutcomes] = useState([]);
    const [is_loading, setIsLoading] = useState(true);
    const [is_modal_open, setIsModalOpen] = useState(false);
    const [code, setCode] = useState('');
    const [statement, setStatement] = useState('');
    const [is_saving, setIsSaving] = useState(false);

    useEffect(() => { fetchOutcomes(); }, []);

    async function fetchOutcomes()
    {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/outcomes`);
        setOutcomes(await response.json());
        setIsLoading(false);
    }

    function closeModal()
    {
        setIsModalOpen(false);
        setCode('');
        setStatement('');
    }

    async function handleCreateOutcome()
    {
        if (!code.trim() || !statement.trim()) return;

        setIsSaving(true);

        try
        {
            const response = await fetch(`${API_BASE}/outcomes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, statement })
            });

            if (response.ok)
            {
                closeModal();
                fetchOutcomes();
            }
        }
        finally
        {
            setIsSaving(false);
        }
    }

    if (is_loading)
    {
        return <p style={{ color: 'var(--text-secondary)' }}>Loading outcomes...</p>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Outcomes</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={15} /> Add Outcome
                </button>
            </div>

            <div className="card">
                {outcomes.map((outcome, index) => (
                    <div
                        key={outcome._id}
                        style={{
                            display: 'flex', gap: '14px', padding: '16px 20px',
                            borderBottom: index < outcomes.length - 1 ? '1px solid var(--border)' : 'none'
                        }}
                    >
                        <div style={{
                            width: 34, height: 34, minWidth: 34, borderRadius: 8,
                            background: 'var(--blue-bg)', color: 'var(--blue)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Target size={16} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '4px' }}>{outcome.code}</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{outcome.statement}</p>
                        </div>
                    </div>
                ))}

                {outcomes.length === 0 && (
                    <p style={{ padding: '20px', color: 'var(--text-secondary)' }}>No outcomes yet.</p>
                )}
            </div>

            {is_modal_open && (
                <Modal
                    title="Add Outcome"
                    onClose={closeModal}
                    footer={(
                        <>
                            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateOutcome} disabled={is_saving}>
                                {is_saving ? 'Creating...' : 'Create Outcome'}
                            </button>
                        </>
                    )}
                >
                    <div className="form-group">
                        <label className="form-label">Outcome Code</label>
                        <input className="form-input" placeholder="e.g. SO6" value={code} onChange={e => setCode(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Outcome Statement</label>
                        <textarea className="form-textarea" placeholder="Full outcome text..." value={statement} onChange={e => setStatement(e.target.value)} />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default OutcomesPage;