export function treesToFlow(trees)
{
    const nodes = [];
    const edges = [];

    function walk(tree_node, parent_id)
    {
        const node_id = tree_node._id;

        nodes.push(
        {
            id: node_id,
            position: { x: 0, y: 0 },
            data:
            {
                label: tree_node.label,
                type: tree_node.type,
                weight: tree_node.weight,
                normalized_weight: tree_node.normalized_weight,
                threshold: tree_node.threshold
            }
        });

        if (parent_id)
        {
            edges.push(
            {
                id: `e-${parent_id}-${node_id}`,
                source: parent_id,
                target: node_id
            });
        }

        tree_node.children.forEach(child => walk(child, node_id));
    }

    trees.forEach(root => walk(root, null));

    return { nodes, edges };
}