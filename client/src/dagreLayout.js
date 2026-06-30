import dagre from 'dagre';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;
const TREE_GAP = 150;

function layoutSingleTree(nodes, edges)
{
    const graph = new dagre.graphlib.Graph();

    graph.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });
    graph.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(node =>
    {
        graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach(edge =>
    {
        graph.setEdge(edge.source, edge.target);
    });

    dagre.layout(graph);

    let min_x = Infinity;
    let max_x = -Infinity;

    nodes.forEach(node =>
    {
        const dagre_node = graph.node(node.id);
        min_x = Math.min(min_x, dagre_node.x);
        max_x = Math.max(max_x, dagre_node.x);
    });

    const positioned_nodes = nodes.map(node =>
    {
        const dagre_node = graph.node(node.id);

        return {
            ...node,
            position:
            {
                x: dagre_node.x - NODE_WIDTH / 2,
                y: dagre_node.y - NODE_HEIGHT / 2
            }
        };
    });

    const tree_width = (max_x - min_x) + NODE_WIDTH;

    return { positioned_nodes, tree_width };
}

export function layoutWithDagre(nodes, edges, root_ids)
{
    let x_offset = 0;
    const all_positioned_nodes = [];

    root_ids.forEach(root_id =>
    {
        const descendant_ids = new Set();

        function collectDescendants(node_id)
        {
            descendant_ids.add(node_id);
            edges
                .filter(edge => edge.source === node_id)
                .forEach(edge => collectDescendants(edge.target));
        }

        collectDescendants(root_id);

        const tree_nodes = nodes.filter(node => descendant_ids.has(node.id));
        const tree_edges = edges.filter(edge => descendant_ids.has(edge.source) && descendant_ids.has(edge.target));

        const { positioned_nodes, tree_width } = layoutSingleTree(tree_nodes, tree_edges);

        const shifted_nodes = positioned_nodes.map(node => ({
            ...node,
            position:
            {
                x: node.position.x + x_offset,
                y: node.position.y
            }
        }));

        all_positioned_nodes.push(...shifted_nodes);
        x_offset += tree_width + TREE_GAP;
    });

    return all_positioned_nodes;
}