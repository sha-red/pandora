// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.sectionSelect = function() {
    // fixme: duplicated
    var that = new Ox.Select({
            id: 'sectionSelect',
            items: [
                {checked: app.user.ui.section == 'site', id: 'site', title: app.config.site.name},
                {checked: app.user.ui.section == 'items', id: 'items', title: app.config.itemName.plural},
                {checked: app.user.ui.section == 'texts', id: 'texts', title: 'Texts'},
                {checked: app.user.ui.section == 'admin', id: 'admin', title: 'Admin'}
            ]
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            
        });
    return that;
};

