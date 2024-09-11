'use strict';

pandora.ui.sectionButtons = function(section) {
    var that = Ox.ButtonGroup({
            buttons: Ox.clone(pandora.site.sections, true).map(function(section) {
                section.title = Ox._(section.title);
                return section;
            }),
            id: 'sectionButtons',
            selectable: true,
            value: section || pandora.user.ui.section
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            change: function(data) {
                var section = data.value;
                pandora.UI.set({section: section});
            }
        });
    return that;
};

