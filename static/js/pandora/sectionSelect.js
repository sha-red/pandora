// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.sectionSelect = function() {
    // fixme: duplicated
    var that = Ox.Select({
            id: 'sectionSelect',
            items: [
                {checked: pandora.user.ui.section == 'items', id: 'items', title: pandora.site.itemName.plural},
                {checked: pandora.user.ui.section == 'edits', id: 'edits', title: 'Edits', disabled: true},
                {checked: pandora.user.ui.section == 'texts', id: 'texts', title: 'Texts', disabled: true}
            ]
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            
        });
    return that;
};

