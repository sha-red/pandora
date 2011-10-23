// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.sectionSelect = function() {
    // fixme: duplicated
    var that = Ox.Select({
            id: 'sectionSelect',
            items: [
                {checked: pandora.user.ui.section == 'items', id: 'items', title: pandora.site.itemName.plural},
                {checked: pandora.user.ui.section == 'edits', id: 'edits', title: 'Edits'},
                {checked: pandora.user.ui.section == 'texts', id: 'texts', title: 'Texts'}
            ]
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            
        });
    return that;
};

