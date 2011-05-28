// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.sectionButtons = function() {
    var that = new Ox.ButtonGroup({
            buttons: [
                {id: 'site', selected: app.user.ui.section == 'site', title: app.site.site.name},
                {id: 'items', selected: app.user.ui.section == 'items', title: app.site.itemName.plural},
                {id: 'texts', selected: app.user.ui.section == 'texts', title: 'Texts'},
                {id: 'admin', selected: app.user.ui.section == 'admin', title: 'Admin'}
            ],
            id: 'sectionButtons',
            selectable: true
        }).css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            change: function(event, data) {
                var section = data.selected[0];
                if (section == 'site') {
                    pandora.URL.set(app.user.ui.sitePage);
                } else if (section == 'items') {
                    pandora.URL.set(pandora.Query.toString());
                } else if (section == 'texts') {
                    pandora.URL.set('texts');
                } else if (section == 'admin') {
                    pandora.URL.set('admin');
                }
            }
        });
    return that;
};

