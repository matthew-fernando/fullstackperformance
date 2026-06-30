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

module.exports = { normalizeSiblings };