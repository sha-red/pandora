// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.sectionSelect = function() {
    // fixme: duplicated
    var that = new Ox.Select({
            id: 'sectionSelect',
            items: [
                {checked: pandora.user.ui.section == 'site', id: 'site', title: pandora.site.site.name},
                {checked: pandora.user.ui.section == 'items', id: 'items', title: pandora.site.itemName.plural},
                {checked: pandora.user.ui.section == 'texts', id: 'texts', title: 'Texts'},
                {checked: pandora.user.ui.section == 'admin', id: 'admin', title: 'Admin'}
            ]
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            
        });
    return that;
};

