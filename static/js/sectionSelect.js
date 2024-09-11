'use strict';

pandora.ui.sectionSelect = function(section) {
    // fixme: duplicated
    var that = Ox.Select({
            id: 'sectionSelect',
            items: Ox.clone(pandora.site.sections, true).map(function(section) {
                section.title = Ox._(section.title);
                return section;
            }),
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

