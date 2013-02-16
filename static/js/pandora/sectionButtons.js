// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.sectionButtons = function() {
    var that = Ox.ButtonGroup({
            buttons: [
                {id: 'items', title: pandora.site.itemName.plural},
                {id: 'edits', title: 'Edits', disabled: true},
                {id: 'texts', title: 'Texts', disabled: pandora.user.level != 'admin'}
            ],
            id: 'sectionButtons',
            selectable: true,
            value: pandora.user.ui.section
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

