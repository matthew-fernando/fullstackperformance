//this is a test file, you can delete it later


const { normalizeSiblings } = require('./utils/treeUtils');

const trees =
[
    {
        label: 'experimentation',
        weight: 3,
        children:
        [
            { label: 'design', weight: 2, children: [] },
            { label: 'conduct', weight: 3, children: [] }
        ]
    },
    {
        label: 'analyze',
        weight: 2,
        children:
        [
            { label: 'data', weight: 1, children: [] },
            { label: 'methods', weight: 1, children: [] }
        ]
    }
];

const result = normalizeSiblings(trees, 1);

console.log(JSON.stringify(result, null, 2));

function sumAllLeafWeights(nodes)
{
    let total = 0;
    for (const node of nodes)
    {
        if (node.children.length === 0)
        {
            total += node.normalized_weight;
        }
        else
        {
            total += sumAllLeafWeights(node.children);
        }
    }
    return total;
}

console.log('Sum of all leaf normalized weights:', sumAllLeafWeights(result));