function makeTempId()
{
    return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

export function createRootNode(label, x, y)
{
    return {
        _id: makeTempId(),
        label,
        type: 'root',
        level: 0,
        weight: 1,
        normalized_weight: 1,
        threshold: 0,
        children: []
    };
}

export function createChildNode(parent_level, label, type)
{
    return {
        _id: makeTempId(),
        label,
        type,
        level: parent_level + 1,
        weight: 1,
        normalized_weight: 1,
        threshold: 0,
        children: []
    };
}

function mapTree(node_array, target_id, transform)
{
    return node_array.map(node =>
    {
        if (node._id === target_id)
        {
            return transform(node);
        }

        return {
            ...node,
            children: mapTree(node.children, target_id, transform)
        };
    });
}

export function addChildToNode(trees, parent_id, is_logical)
{
    return mapTree(trees, parent_id, parent_node =>
    {
        const new_child = createChildNode(
            parent_node.level,
            is_logical ? '' : 'New keyword',
            is_logical ? 'logical' : 'keyword'
        );

        const new_children = [...parent_node.children, new_child];

        const was_all = parent_node.threshold === parent_node.children.length;

        return {
            ...parent_node,
            children: new_children,
            threshold: was_all ? new_children.length : parent_node.threshold
        };
    });
}

function removeNodeById(node_array, target_id)
{
    const filtered = node_array.filter(node => node._id !== target_id);

    if (filtered.length !== node_array.length)
    {
        return filtered;
    }

    return node_array.map(node =>
    {
        const new_children = removeNodeById(node.children, target_id);

        if (new_children === node.children)
        {
            return node;
        }

        const clamped_threshold = Math.min(node.threshold, new_children.length);

        return { ...node, children: new_children, threshold: clamped_threshold };
    });
}

export function deleteNode(trees, target_id)
{
    return removeNodeById(trees, target_id);
}

export function updateNodeField(trees, target_id, field, value)
{
    return mapTree(trees, target_id, node => ({ ...node, [field]: value }));
}