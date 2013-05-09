// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.sectionSelect = function() {
    // fixme: duplicated
    var that = Ox.Select({
            id: 'sectionSelect',
            items: [
                {id: 'items', title: pandora.site.itemName.plural},
                {id: 'edits', title: Ox._('Edits'), disabled: true},
                {id: 'texts', title: Ox._('Texts'), disabled: true}
            ],
            value: pandora.user.ui.section
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            
        });
    return that;
};

