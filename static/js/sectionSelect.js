'use strict';

pandora.ui.sectionSelect = function(section) {
    // fixme: duplicated
    var that = Ox.Select({
            id: 'sectionSelect',
            items: pandora.site.sections,
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

