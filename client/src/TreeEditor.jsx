import { useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { treesToFlow } from './treeFlowUtils';
import { layoutWithDagre } from './dagreLayout';

function TreeEditor()
{
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() =>
    {
        fetch('http://localhost:5001/api/outcomes/6a41c5874227df5130f786b4')
            .then(response => response.json())
            .then(outcome =>
            {
                const { nodes: flow_nodes, edges: flow_edges } = treesToFlow(outcome.trees);

                const has_no_positions = flow_nodes.every(node => node.position.x === 0 && node.position.y === 0);

                const final_nodes = has_no_positions
                    ? layoutWithDagre(flow_nodes, flow_edges)
                    : flow_nodes;

                setNodes(final_nodes);
                setEdges(flow_edges);
            })
            .catch(error => console.error('Error fetching outcome:', error));
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

export default TreeEditor;