import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

function formatPercent(value)
{
	if (value === null || value === undefined)
	{
		return '—';
	}

	return `${(value * 100).toFixed(1)}%`;
}

function formatScore(value)
{
	if (value === null || value === undefined)
	{
		return 'No data';
	}

	return `${value.toFixed(1)}%`;
}

function OutcomeEvaluationPage()
{
	const navigate = useNavigate();

	const [outcomes, setOutcomes] = useState([]);
	const [selected_outcome_id, setSelectedOutcomeId] = useState('');
	const [evaluation, setEvaluation] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() =>
	{
		fetch(`${API_BASE}/outcomes`)
			.then((response) => response.json())
			.then(setOutcomes)
			.catch((err) => console.error('Error fetching outcomes:', err));
	}, []);

	useEffect(() =>
	{
		if (!selected_outcome_id)
		{
			setEvaluation(null);
			return;
		}

		setLoading(true);
		setError(null);

		fetch(`${API_BASE}/outcomes/${selected_outcome_id}/evaluation`)
			.then((response) =>
			{
				if (!response.ok)
				{
					throw new Error(`Failed to load evaluation (${response.status})`);
				}

				return response.json();
			})
			.then(setEvaluation)
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [selected_outcome_id]);

	return (
		<div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
			<button onClick={() => navigate('/')} style={backButtonStyle}>
				<ArrowLeft size={14} /> Back
			</button>

			<h2 style={{ marginTop: 16 }}>Outcome Score & Coverage</h2>

			<select
				value={selected_outcome_id}
				onChange={(event) => setSelectedOutcomeId(event.target.value)}
				style={selectStyle}
			>
				<option value="">Select an outcome...</option>
				{outcomes.map((outcome) => (
					<option key={outcome._id} value={outcome._id}>
						{outcome.code}
					</option>
				))}
			</select>

			{loading && <p style={{ color: '#1e3a5f' }}>Calculating...</p>}
			{error && <p style={{ color: '#dc2626' }}>{error}</p>}

			{evaluation && !loading && (
				<>
					<div style={summaryCardStyle}>
						<div>
							<div style={summaryLabelStyle}>Outcome Score</div>
							<div style={summaryValueStyle}>{formatScore(evaluation.score)}</div>
						</div>
						<div>
							<div style={summaryLabelStyle}>Outcome Coverage</div>
							<div style={summaryValueStyle}>{formatPercent(evaluation.coverage)}</div>
						</div>
						<div>
							<div style={summaryLabelStyle}>Active PIs</div>
							<div style={summaryValueStyle}>
								{evaluation.active_pi_count} / {evaluation.total_pi_count}
							</div>
						</div>
					</div>

					<h3 style={{ marginTop: 24 }}>Performance Indicators</h3>

					{evaluation.pi_results.length === 0 && (
						<p style={{ color: '#1e3a5f' }}>No PIs exist for this outcome yet.</p>
					)}

					{evaluation.pi_results.map((pi) => (
						<div key={pi.pi_id} style={piCardStyle}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
								<div>
									<div style={{ fontWeight: 600, color: '#1e3a5f' }}>
										{pi.pi_code} — {pi.node_label}
									</div>
									<div style={{ fontSize: 13, color: '#1e3a5f' }}>{pi.pi_title}</div>
								</div>
								<div style={{ textAlign: 'right' }}>
									<div style={{ fontWeight: 600, color: '#1e3a5f' }}>{formatScore(pi.score)}</div>
									<div style={{ fontSize: 12, color: '#1e3a5f' }}>
										{formatPercent(pi.coverage)} of PI covered · {pi.active_leaf_count}/{pi.total_leaf_count} leaves
									</div>
								</div>
							</div>

							<table style={leafTableStyle}>
								<thead>
									<tr>
										<th style={leafHeaderStyle}>Leaf</th>
										<th style={leafHeaderStyle}>Weight</th>
										<th style={leafHeaderStyle}>Score</th>
										<th style={leafHeaderStyle}>Graded</th>
									</tr>
								</thead>
								<tbody>
									{pi.leaf_scores.map((leaf) => (
										<tr key={leaf.node_id}>
											<td style={leafCellStyle}>{leaf.label}</td>
											<td style={leafCellStyle}>{leaf.normalized_weight?.toFixed(3)}</td>
											<td style={leafCellStyle}>
												{leaf.is_active ? `${leaf.score.toFixed(1)}%` : 'Ungraded'}
											</td>
											<td style={leafCellStyle}>
												{leaf.graded_question_count}/{leaf.total_question_count}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					))}
				</>
			)}
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

const selectStyle =
{
	padding: 8,
	borderRadius: 6,
	border: '1px solid #1e3a5f',
	color: '#1e3a5f',
	marginBottom: 16,
	width: '100%',
	fontSize: 14,
	background: '#fff'
};

const summaryCardStyle =
{
	display: 'flex',
	gap: 32,
	padding: 16,
	border: '1px solid #1e3a5f',
	borderRadius: 8,
	background: '#fff'
};

const summaryLabelStyle =
{
	fontSize: 12,
	color: '#1e3a5f',
	marginBottom: 4
};

const summaryValueStyle =
{
	fontSize: 22,
	fontWeight: 700,
	color: '#1e3a5f'
};

const piCardStyle =
{
	border: '1px solid #1e3a5f',
	borderRadius: 8,
	padding: 16,
	marginBottom: 16,
	background: '#fff'
};

const leafTableStyle =
{
	width: '100%',
	borderCollapse: 'collapse',
	marginTop: 12
};

const leafHeaderStyle =
{
	textAlign: 'left',
	fontSize: 12,
	color: '#1e3a5f',
	borderBottom: '1px solid #1e3a5f',
	padding: '4px 6px'
};

const leafCellStyle =
{
	fontSize: 13,
	color: '#1e3a5f',
	padding: '4px 6px',
	borderBottom: '1px solid #e2e8f0'
};

export default OutcomeEvaluationPage;