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

	const base_style = treeNodeStyle(data.type);

	return (
		<div
			onClick={handleClick}
			style={{
				...base_style,
				border: data.is_selected ? '2px solid #22c55e' : base_style.border,
				boxShadow: data.is_selected ? '0 0 0 2px rgba(34, 197, 94, 0.4)' : undefined,
				cursor: data.is_leaf ? 'pointer' : 'default'
			}}
		>
			<Handle type="target" position={Position.Top} isConnectable={false} />

			{data.type === 'root' ? (
				<div style={{ fontWeight: 600, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{data.label}</div>
			) : data.type === 'logical' ? (
				<div style={{ fontWeight: 600, fontStyle: 'italic', color: '#94a3b8' }}>Logical</div>
			) : (
				<div style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{data.label}</div>
			)}

			<Handle type="source" position={Position.Bottom} isConnectable={false} />
		</div>
	);
}

export default AssignmentLeafNode;
