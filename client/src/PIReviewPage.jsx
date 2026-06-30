import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function PIReviewPage()
{
    const location = useLocation();
    const navigate = useNavigate();

    const initial_pis = location.state?.pis ?? [];
    const outcome_code = location.state?.outcome_code ?? '';

    const [pis, setPis] = useState(initial_pis);

    function handleTitleChange(index, new_title)
    {
        setPis(prev_pis =>
            prev_pis.map((pi, i) => (i === index ? { ...pi, title: new_title } : pi))
        );
    }

    function handleCodeChange(index, new_code)
    {
        setPis(prev_pis =>
            prev_pis.map((pi, i) => (i === index ? { ...pi, code: new_code } : pi))
        );
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
            <button onClick={() => navigate('/')} style={backButtonStyle}>
                <ArrowLeft size={14} /> Back to tree editor
            </button>

            <h2 style={{ marginTop: 16 }}>Generated Performance Indicators — {outcome_code}</h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
                Review and edit each PI below before finalizing.
            </p>

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