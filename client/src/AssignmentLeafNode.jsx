import { Handle, Position } from '@xyflow/react';
import { treeNodeStyle } from './TreeNodeComponent';

function AssignmentLeafNode({ id, data })
{
	function handleClick()
	{
		if (data.is_leaf)
		{
			data.onToggle(id);
		}
	}

	const base_style = treeNodeStyle(data.type, false);

	return (
		<div
			onClick={handleClick}
			style={{
				...base_style,
				border: data.is_selected ? '2px solid #059669' : base_style.border,
				boxShadow: data.is_selected ? '0 0 0 3px rgba(5, 150, 105, 0.18)' : base_style.boxShadow,
				cursor: data.is_leaf ? 'pointer' : 'default'
			}}
		>
			<Handle type="target" position={Position.Top} isConnectable={false} />

			{data.type === 'root' ? (
				<div style={{ fontWeight: 700, fontFamily: "'Sora', sans-serif", fontSize: 13, color: '#fff', wordBreak: 'break-word' }}>{data.label}</div>
			) : data.type === 'logical' ? (
				<div style={{ fontWeight: 600, fontStyle: 'italic', fontSize: 12.5, color: '#475569' }}>Logical</div>
			) : (
				<div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: 13 }}>{data.label}</div>
			)}

			<Handle type="source" position={Position.Bottom} isConnectable={false} />
		</div>
	);
}

export default AssignmentLeafNode;