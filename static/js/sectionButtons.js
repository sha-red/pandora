'use strict';

pandora.ui.sectionButtons = function(section) {
    var that = Ox.ButtonGroup({
            buttons: pandora.site.sections,
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

