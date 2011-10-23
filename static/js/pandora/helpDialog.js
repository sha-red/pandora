// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.helpDialog = function() {
    var content = Ox.Element(),
        that = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'close',
                title: 'Close'
            }).bindEvent({
                click: function() {
                    that.close();
                    //fixme: this should be using URL.push / UI.set
                    //but that currenlty causes a reload
                    history.pushState({}, '', '/');
                }
            })
        ],
        //closeButton: true,
        content: content,
        height: Math.round((window.innerHeight - 24) * 0.75),
        keys: {
            'escape': 'close'
        },
        //maximizeButton: true,
        minHeight: 256,
        minWidth: 640,
        title: 'Help',
        width: Math.round(window.innerWidth * 0.75)
    });
    pandora.api.getPage({name: 'help'}, function(response) {
        content.html(response.data.body);
    });
    return that;
  
};
