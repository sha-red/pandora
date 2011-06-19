// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.sectionButtons = function() {
    var that = Ox.ButtonGroup({
            buttons: [
                {id: 'site', selected: pandora.user.ui.section == 'site', title: pandora.site.site.name},
                {id: 'items', selected: pandora.user.ui.section == 'items', title: pandora.site.itemName.plural},
                {id: 'texts', selected: pandora.user.ui.section == 'texts', title: 'Texts'},
                {id: 'admin', selected: pandora.user.ui.section == 'admin', title: 'Admin'}
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
                    pandora.URL.set(pandora.user.ui.sitePage);
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

