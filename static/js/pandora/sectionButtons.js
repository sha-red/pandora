// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.sectionButtons = function() {
    var that = Ox.ButtonGroup({
            buttons: [
                {id: 'items', selected: pandora.user.ui.section == 'items', title: pandora.site.itemName.plural},
                {id: 'edits', selected: pandora.user.ui.section == 'edits', title: 'Edits'},
                {id: 'texts', selected: pandora.user.ui.section == 'texts', title: 'Texts'}
            ],
            id: 'sectionButtons',
            selectable: true
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            change: function(data) {
                var section = data.selected[0];
                if (section == 'items') {
                    pandora.URL.set(pandora.Query.toString());
                } else if (section == 'clips') {
                    pandora.URL.set('clips');
                } else if (section == 'texts') {
                    pandora.URL.set('texts');
                }
            }
        });
    return that;
};

