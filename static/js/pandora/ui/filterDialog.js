// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.filterDialog = function() {
    var that = new Ox.Dialog({
        buttons: [
            new Ox.Button({
                    id: 'debug',
                    title: 'Debug',
                })
                .bindEvent({
                    click: function() {
                        alert(JSON.stringify(app.$ui.filter.options('query')));
                    }
                }),
            new Ox.Button({
                    id: 'cancel',
                    title: 'Cancel'
                })
                .bindEvent({
                    click: function() {
                        app.$ui.filterDialog.close();
                    }
                }),
            new Ox.Button({
                    id: 'save',
                    title: 'Save'
                })
                .bindEvent({
                    click: function() {
                        app.$ui.filterDialog.close();
                    }
                })
        ],
        content: app.$ui.filter = new pandora.ui.filter(),
        height: 264,
        keys: {enter: 'save', escape: 'cancel'},
        title: 'Advanced Find',
        width: 616 + Ox.UI.SCROLLBAR_SIZE
    });
    return that;
};

