const LEVEL_LABELS_BY_COUNT =
{
    3: ['Developing', 'Satisfactory', 'Exemplary'],
    4: ['Beginning', 'Developing', 'Proficient', 'Exemplary'],
    5: ['Beginning', 'Developing', 'Satisfactory', 'Proficient', 'Exemplary']
};

function getHardcodedLabels(level_count)
{
    return LEVEL_LABELS_BY_COUNT[level_count] || null;
}

export { getHardcodedLabels };