import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const API_BASE = 'http://localhost:5001/api';

function formatPercent(value)
{
    if (value === null || value === undefined) return '—';
    return `${(value * 100).toFixed(1)}%`;
}

function formatScore(value)
{
    if (value === null || value === undefined) return 'No data';
    return `${value.toFixed(1)}%`;
}

function statusForScore(score)
{
    if (score === null || score === undefined) return { label: 'No Data', badge: 'badge-gray' };
    if (score >= 80) return { label: 'On Track', badge: 'badge-green' };
    if (score >= 60) return { label: 'Needs Attention', badge: 'badge-amber' };
    return { label: 'Below Target', badge: 'badge-red' };
}

function progressClassForScore(score)
{
    if (score === null || score === undefined) return '';
    if (score >= 80) return 'green';
    if (score >= 60) return 'amber';
    return 'red';
}

function OutcomeEvaluationPage()
{
    const { classId } = useOutletContext();

    const [class_doc, setClassDoc] = useState(null);
    const [evaluations, setEvaluations] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        fetch(`${API_BASE}/classes/${classId}`)
            .then(response => response.json())
            .then(setClassDoc)
            .catch(error => console.error('Error fetching class:', error));
    }, [classId]);

    useEffect(() =>
    {
        if (!class_doc)
        {
            return;
        }

        setLoading(true);

        const outcome_entries = class_doc.outcomes ?? [];

        Promise.all(
            outcome_entries.map(entry =>
                fetch(`${API_BASE}/classes/${classId}/outcomes/${entry.outcome_id._id}/evaluation`)
                    .then(response => response.ok ? response.json() : null)
                    .then(data => [entry.outcome_id._id, data])
                    .catch(() => [entry.outcome_id._id, null])
            )
        ).then(results =>
        {
            const next_evaluations = {};
            results.forEach(([outcome_id, data]) => { next_evaluations[outcome_id] = data; });
            setEvaluations(next_evaluations);
            setLoading(false);
        });
    }, [class_doc, classId]);

    const outcome_entries = class_doc?.outcomes ?? [];

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>Evaluation</h1>

            {loading && <p style={{ color: 'var(--text-secondary)' }}>Calculating evaluations...</p>}

            {!loading && outcome_entries.length === 0 && (
                <div className="card" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No outcomes are assessed in this course yet.
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {outcome_entries.map(entry =>
                {
                    const outcome = entry.outcome_id;
                    const evaluation = evaluations[outcome._id];
                    const status = statusForScore(evaluation?.score);

                    return (
                        <div key={outcome._id} className="card">
                            <div className="card-header">
                                <div>
                                    <h2>{outcome.code}</h2>
                                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '3px', maxWidth: '640px' }}>
                                        {outcome.statement}
                                    </p>
                                </div>
                                <span className={`badge ${status.badge}`}>{status.label}</span>
                            </div>

                            <div className="card-body">
                                {!evaluation && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No evaluation data available.</p>
                                )}

                                {evaluation && (
                                    <>
                                        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                                            <div className="card stat-card" style={{ flex: 1 }}>
                                                <div className="stat-label">Outcome Score</div>
                                                <div className="stat-value">{formatScore(evaluation.score)}</div>
                                                <div style={{ marginTop: '8px' }}>
                                                    <div className="progress-track">
                                                        <div
                                                            className={`progress-fill ${progressClassForScore(evaluation.score)}`}
                                                            style={{ width: `${Math.min(evaluation.score ?? 0, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card stat-card" style={{ flex: 1 }}>
                                                <div className="stat-label">Outcome Coverage</div>
                                                <div className="stat-value">{formatPercent(evaluation.coverage)}</div>
                                            </div>
                                            <div className="card stat-card" style={{ flex: 1 }}>
                                                <div className="stat-label">Active PIs</div>
                                                <div className="stat-value">{evaluation.active_pi_count} / {evaluation.total_pi_count}</div>
                                            </div>
                                        </div>

                                        <h3 style={{ marginBottom: '10px' }}>Performance Indicators</h3>

                                        {evaluation.pi_results.length === 0 && (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No PIs exist for this outcome yet.</p>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {evaluation.pi_results.map(pi => (
                                                <div key={pi.pi_id} className="card" style={{ boxShadow: 'none' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px 10px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{pi.pi_code} — {pi.node_label}</div>
                                                            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{pi.pi_title}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{formatScore(pi.score)}</div>
                                                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                                                {formatPercent(pi.coverage)} covered · {pi.active_leaf_count}/{pi.total_leaf_count} leaves
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <table className="data-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Leaf</th>
                                                                <th>Weight</th>
                                                                <th>Score</th>
                                                                <th>Graded</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pi.leaf_scores.map(leaf => (
                                                                <tr key={leaf.node_id}>
                                                                    <td>{leaf.label}</td>
                                                                    <td>{leaf.normalized_weight?.toFixed(3)}</td>
                                                                    <td>{leaf.is_active ? `${leaf.score.toFixed(1)}%` : 'Ungraded'}</td>
                                                                    <td>{leaf.graded_question_count}/{leaf.total_question_count}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default OutcomeEvaluationPage;