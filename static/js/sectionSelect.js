'use strict';

pandora.ui.sectionSelect = function(section) {
    // fixme: duplicated
    var that = Ox.Select({
            id: 'sectionSelect',
            items: [
                {id: 'items', title: Ox._(pandora.site.itemName.plural)},
                {id: 'edits', title: Ox._('Edits')},
                {id: 'documents', title: Ox._('Documents')}
            ],
            value: section || pandora.user.ui.section
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            // ...
        });
    return that;
};

