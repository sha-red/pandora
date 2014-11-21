'use strict';

pandora.getItemTitle = function(itemData, includeYear) {
    return (itemData.title || Ox._('Untitled')) + (
        Ox.len(itemData.director) || (includeYear && itemData.year)
        ? ' (' + (
            Ox.len(itemData.director)
            ? itemData.director
            : [Ox._('Unknown Director')]
        ).join(', ') + ')'
        : ''
    ) + (includeYear && itemData.year ? ' ' + itemData.year : '')
};
