// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.publicListsDialog = function() { // fixme: unused
    var that = new Ox.Dialog({
        buttons: [
            new Ox.Button({
                id: 'done',
                title: 'Done'
            }).bindEvent({
                click: function() {
                    that.close();
                }
            })
        ],
        content: pandora.ui.publicListsList(),
        height: 320,
        keys: {enter: 'close', escape: 'close'},
        padding: 0,
        title: 'Public Lists',
        width: 420
    })
    .css({
        position: 'absolute'
    });
    return that;
};
