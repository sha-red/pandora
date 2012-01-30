// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.embedDialog = function(data) {
    var content = Ox.Element().css({margin: '16px'}),
        height = 240,
        width = 320,
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
            title: 'Embed Video',
            width: Math.round(window.innerWidth * 0.75)
        })
        .bindEvent({
            close: function(data) {
            }
        }),
        url = document.location.origin + '/' + pandora.user.ui.item + '/embed';
    content.html('To embed this video you need unicorns... or try this code:<br>');
    content.append($('<textarea>').css({width:"100%", height:"100%"}).val('<iframe width="'+width+'" height="'+height+'" src="'+url+'" frameborder="0" allowfullscreen></iframe>'));
    return that;
};
