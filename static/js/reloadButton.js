'use strict';

pandora.ui.reloadButton = function() {

    var that = Ox.Button({
            style: 'symbol',
            title: 'reload',
            tooltip: Ox._('Reload Application'),
            type: 'image'
        })
        .bindEvent({
            click: function() {
                pandora.ui.appPanel.reload();
            }
        });

    return that;

};
