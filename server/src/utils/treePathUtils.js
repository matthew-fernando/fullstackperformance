// function findNodeWithPath(trees, target_id)
// {
//     function walk(node_array, path_so_far)
//     {
//         for (const node of node_array)
//         {
//             const current_path = [...path_so_far, node.label];

//             if (node._id.toString() === target_id)
//             {
//                 return { node, path: current_path.join(' > ') };
//             }

//             const found = walk(node.children, current_path);
//             if (found) return found;
//         }
//         return null;
//     }

//     return walk(trees, []);
// }

// function getSelectedNodesWithPaths(trees, selected_node_ids)
// {
//     return selected_node_ids
//         .map(id => findNodeWithPath(trees, id))
//         .filter(Boolean)
//         .map(result => ({
//             ...result.node.toObject ? result.node.toObject() : result.node,
//             path: result.path
//         }));
// }

// export { getSelectedNodesWithPaths };

function toPlainNode(node)
{
    return node.toObject ? node.toObject() : node;
}

function findNodeWithPath(trees, target_id)
{
    function walk(node_array, path_so_far)
    {
        for (const node of node_array)
        {
            const current_path = [...path_so_far, node.label];

            if (node._id.toString() === target_id)
            {
                return { node, path: current_path.join(' > ') };
            }

            const found = walk(node.children, current_path);
            if (found) return found;
        }
        return null;
    }

    return walk(trees, []);
}

function buildSubtreeSummary(node)
{
    const plain = toPlainNode(node);

    return {
        label: plain.label,
        type: plain.type,
        normalized_weight: plain.normalized_weight,
        children: (plain.children || []).map(buildSubtreeSummary)
    };
}

function getSelectedNodesWithSubtrees(trees, selected_node_ids)
{
    return selected_node_ids
        .map(id => findNodeWithPath(trees, id))
        .filter(Boolean)
        .map(result => ({
            node_id: toPlainNode(result.node)._id,
            path: result.path,
            subtree: buildSubtreeSummary(result.node)
        }));
}

export { getSelectedNodesWithSubtrees };
