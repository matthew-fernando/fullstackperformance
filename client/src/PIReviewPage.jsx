import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardList } from 'lucide-react';

function PIReviewPage()
{
    const location = useLocation();
    const navigate = useNavigate();

    const [outcomes, setOutcomes] = useState([]);
    const [selected_outcome_id, setSelectedOutcomeId] = useState(location.state?.outcome_id ?? '');
    const [pis, setPis] = useState(location.state?.pis ?? []);
    const [loading_pis, setLoadingPis] = useState(false);
    const [saving, setSaving] = useState(false);
    const [save_error, setSaveError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() =>
    {
        fetch('http://localhost:5001/api/outcomes')
            .then(response => response.json())
            .then(data => setOutcomes(data))
            .catch(error => console.error('Error fetching outcomes:', error));
    }, []);

    useEffect(() =>
    {
        if (location.state?.pis)
        {
            return;
        }

        if (!selected_outcome_id)
        {
            setPis([]);
            return;
        }

        setLoadingPis(true);
        setSaved(false);

        fetch(`http://localhost:5001/api/performance-indicators/outcome/${selected_outcome_id}`)
            .then(response => response.json())
            .then(data => setPis(data))
            .catch(error => console.error('Error fetching PIs:', error))
            .finally(() => setLoadingPis(false));
    }, [selected_outcome_id]);

    const selected_outcome = outcomes.find(outcome => outcome._id === selected_outcome_id);

    function autoResizeTextarea(element)
    {
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    }
    
    function handleOutcomeChange(new_outcome_id)
    {
        setSelectedOutcomeId(new_outcome_id);
        setSaveError(null);
    }

    function handleTitleChange(index, new_title)
    {
        setPis(prev_pis =>
            prev_pis.map((pi, i) => (i === index ? { ...pi, title: new_title } : pi))
        );
        setSaved(false);
    }

    function handleCodeChange(index, new_code)
    {
        setPis(prev_pis =>
            prev_pis.map((pi, i) => (i === index ? { ...pi, code: new_code } : pi))
        );
        setSaved(false);
    }

    async function handleSaveAll()
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
            const response = await fetch('http://localhost:5001/api/performance-indicators',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outcome_id: selected_outcome_id, pis })
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

    function handleGoToRubric()
    {
        navigate('/rubric',
        {
            state:
            {
                outcome_id: selected_outcome_id,
                outcome_code: selected_outcome?.code ?? ''
            }
        });
    }

    return (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate('/')} style={backButtonStyle}>
                    <ArrowLeft size={14} /> Back to tree editor
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                    {pis.length > 0 && (
                        <button onClick={handleGoToRubric} disabled={!selected_outcome_id} style={rubricButtonStyle}>
                            <ClipboardList size={14} /> Outcome Rubric
                        </button>
                    )}

                    <button onClick={handleSaveAll} disabled={saving || pis.length === 0} style={saveButtonStyle}>
                        <Save size={14} /> {saving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </div>

            <h2 style={{ marginTop: 16 }}>Performance Indicators</h2>

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

            <p style={{ color: '#64748b', marginBottom: 8 }}>
                Review and edit each PI below before finalizing.
            </p>

            {save_error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{save_error}</p>}
            {saved && !save_error && <p style={{ color: '#16a34a', marginBottom: 16 }}>Saved successfully.</p>}
            {loading_pis && <p style={{ color: '#64748b' }}>Loading PIs...</p>}

            {!loading_pis && selected_outcome_id && pis.length === 0 && (
                <p style={{ color: '#64748b' }}>No PIs exist for this outcome yet. Generate some from the tree editor first.</p>
            )}

            {pis.map((pi, index) => (
                <div key={pi._id ?? pi.node_id ?? index} style={cardStyle}>
                    <input
                        type="text"
                        value={pi.code}
                        onChange={(event) => handleCodeChange(index, event.target.value)}
                        style={codeInputStyle}
                    />
                    <textarea
                        ref={autoResizeTextarea}
                        value={pi.title}
                        onChange={(event) =>
                        {
                            handleTitleChange(index, event.target.value);
                            autoResizeTextarea(event.target);
                        }}
                        style={titleInputStyle}
                    />
                </div>
            ))}
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

const rubricButtonStyle =
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

const cardStyle =
{
    border: '1px solid #1e3a5f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    background: '#fff'
};

const codeInputStyle =
{
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    color: '#1e3a5f',
    marginBottom: 8,
    width: '100%',
    outline: 'none',
    background: '#fff'
};

const titleInputStyle =
{
    border: '1px solid #1e3a5f',
    borderRadius: 6,
    padding: 8,
    width: '100%',
    fontSize: 14,
    resize: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#1e3a5f',
    background: '#fff'
};

export default PIReviewPage;