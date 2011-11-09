// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.helpDialog = function() {
    var content = Ox.Element().css({margin: '16px'}),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: content,
            height: Math.round((window.innerHeight - 24) * 0.75),
            keys: {
                'escape': 'close'
            },
            maximizeButton: true,
            minHeight: 256,
            minWidth: 640,
            title: 'Help',
            width: Math.round(window.innerWidth * 0.75)
        })
        .bindEvent({
            close: function(data) {
                pandora.UI.set({page: ''});
            }
        });
    pandora.api.getPage({name: 'help'}, function(result) {
        //content.html(response.data.body);
        content.html('Help is coming soon...')
    });
    return that;
};
