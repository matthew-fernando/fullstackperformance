function normalizeSiblings(nodes, total_weight)
{
    const sum_of_raw_weights = nodes.reduce((sum, node) => sum + node.weight, 0);

    return nodes.map(node =>
    {
        const sibling_share = node.weight / sum_of_raw_weights;
        const normalized_weight = sibling_share * total_weight;

        const normalized_children = normalizeSiblings(node.children, normalized_weight);

        return {
            ...node,
            normalized_weight,
            children: normalized_children
        };
    });
}


function stripTempIds(node_array)
{
    return node_array.map(node =>
    {
        const { _id, children, ...rest } = node;

        const cleaned_children = stripTempIds(children);

        const is_temp_id = typeof _id === 'string' && _id.startsWith('tmp-');

        return is_temp_id
            ? { ...rest, children: cleaned_children }
            : { _id, ...rest, children: cleaned_children };
    });
}

export { normalizeSiblings, stripTempIds };
