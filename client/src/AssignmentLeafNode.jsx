import { Handle, Position } from '@xyflow/react';

function leafNodeStyle(data)
{
	const is_selected = data.is_selected ?? false;
	const selected_border = '2px solid #2563EB';
	const selected_shadow = '0 0 0 3px rgba(37, 99, 235, 0.18)';

	if (data.type === 'root')
	{
		// Faded blue, visually says "this exists in the hierarchy but isn't selectable"
		return {
			padding: 14,
			borderRadius: 10,
			border: is_selected ? selected_border : '1px solid #BFDBFE',
			background: '#DBEAFE',
			width: 220,
			minHeight: 100,
			fontSize: 12,
			boxSizing: 'border-box',
			boxShadow: is_selected ? selected_shadow : '0 1px 2px rgba(15, 23, 42, 0.05)'
		};
	}

	if (data.is_leaf)
	{
		// Normal, slightly more solid look = "this is clickable"
		return {
			padding: 14,
			borderRadius: 10,
			border: is_selected ? selected_border : '1px solid #E2E8F0',
			background: '#E3E8EF',
			width: 220,
			minHeight: 90,
			fontSize: 12,
			boxSizing: 'border-box',
			boxShadow: is_selected ? selected_shadow : '0 1px 3px rgba(15, 23, 42, 0.06)'
		};
	}

	// Non-leaf, non-root (logical nodes or keyword nodes with children): lighter than leaves = not selectable
	return {
		padding: 14,
		borderRadius: 10,
		border: is_selected ? selected_border : '1px solid #F1F5F9',
		background: '#F8FAFC',
		width: 220,
		minHeight: 90,
		fontSize: 12,
		boxSizing: 'border-box',
		boxShadow: is_selected ? selected_shadow : '0 1px 2px rgba(15, 23, 42, 0.03)'
	};
}

function AssignmentLeafNode({ id, data })
{
	function handleClick()
	{
		if (data.is_leaf)
		{
			data.onToggle(id);
		}
		else if (data.onInvalidSelect)
		{
			data.onInvalidSelect();
		}
	}

	const style = leafNodeStyle(data);
	const text_color = data.type === 'root' ? '#1E3A8A' : (data.type === 'logical' ? '#64748B' : '#334155');

	return (
		<div
			onClick={handleClick}
			style={{ ...style, cursor: data.is_leaf ? 'pointer' : 'not-allowed' }}
		>
			<Handle type="target" position={Position.Top} isConnectable={false} />

			{data.type === 'root' ? (
				<div style={{ fontWeight: 700, fontFamily: "'Sora', sans-serif", fontSize: 13, color: text_color, wordBreak: 'break-word' }}>{data.label}</div>
			) : data.type === 'logical' ? (
				<div style={{ fontWeight: 600, fontStyle: 'italic', fontSize: 12.5, color: text_color }}>Logical</div>
			) : (
				<div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: 13, color: text_color }}>{data.label}</div>
			)}

			<Handle type="source" position={Position.Bottom} isConnectable={false} />
		</div>
	);
}

export default AssignmentLeafNode;