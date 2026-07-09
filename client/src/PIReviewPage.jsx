import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

function PIReviewPage()
{
    const location = useLocation();
    const navigate = useNavigate();

    const initial_pis = location.state?.pis ?? [];
    const outcome_code = location.state?.outcome_code ?? '';
    const outcome_id = location.state?.outcome_id ?? null;
    const [pis, setPis] = useState(initial_pis);
    const [saving, setSaving] = useState(false);
    const [save_error, setSaveError] = useState(null);
    const [saved, setSaved] = useState(false);

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
        if (!outcome_id)
        {
            setSaveError('Missing outcome_id — cannot save.');
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
                body: JSON.stringify({ outcome_id, pis })
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

    if (initial_pis.length === 0)
    {
        return (
            <div style={{ padding: 24 }}>
                <p>No generated PIs to show. Go back and select nodes to generate from.</p>
                <button onClick={() => navigate('/')} style={backButtonStyle}>
                    <ArrowLeft size={14} /> Back to tree editor
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate('/')} style={backButtonStyle}>
                    <ArrowLeft size={14} /> Back to tree editor
                </button>

                <button onClick={handleSaveAll} disabled={saving} style={saveButtonStyle}>
                    <Save size={14} /> {saving ? 'Saving...' : 'Save All'}
                </button>
            </div>

            <h2 style={{ marginTop: 16 }}>Generated Performance Indicators — {outcome_code}</h2>
            <p style={{ color: '#64748b', marginBottom: 8 }}>
                Review and edit each PI below before finalizing.
            </p>

            {save_error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{save_error}</p>}
            {saved && !save_error && <p style={{ color: '#16a34a', marginBottom: 16 }}>Saved successfully.</p>}

            {pis.map((pi, index) => (
                <div key={pi.node_id ?? index} style={cardStyle}>
                    <input
                        type="text"
                        value={pi.code}
                        onChange={(event) => handleCodeChange(index, event.target.value)}
                        style={codeInputStyle}
                    />
                    <textarea
                        value={pi.title}
                        onChange={(event) => handleTitleChange(index, event.target.value)}
                        style={titleInputStyle}
                        rows={2}
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
    border: '1px solid #e2e8f0',
    background: '#fff',
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

const cardStyle =
{
    border: '1px solid #e2e8f0',
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
    outline: 'none'
};

const titleInputStyle =
{
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 8,
    width: '100%',
    fontSize: 14,
    resize: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
};

export default PIReviewPage;