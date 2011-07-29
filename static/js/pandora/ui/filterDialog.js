// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.filterDialog = function() {
    var that = Ox.Dialog({
        buttons: [
            Ox.Button({
                    id: 'debug',
                    title: 'Debug',
                })
                .bindEvent({
                    click: function() {
                        alert(JSON.stringify(pandora.$ui.filter.options('query')));
                    }
                }),
            Ox.Button({
                    id: 'cancel',
                    title: 'Cancel'
                })
                .bindEvent({
                    click: function() {
                        pandora.$ui.filterDialog.close();
                    }
                }),
            Ox.Button({
                    id: 'save',
                    title: 'Save'
                })
                .bindEvent({
                    click: function() {
                        pandora.$ui.filterDialog.close();
                    }
                })
        ],
        content: pandora.$ui.filter = new pandora.ui.filter(),
        height: 264,
        keys: {enter: 'save', escape: 'cancel'},
        title: 'Advanced Find',
        width: 648 + Ox.UI.SCROLLBAR_SIZE
    });
    return that;
};

