// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.embedDialog = function(data) {
    var content = Ox.Element().css({margin: '16px'}),
        height = 360,
        width = 640,
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
            height: 120,
            keys: {
                'escape': 'close'
            },
            maximizeButton: true,
            removeOnClose: true,
            title: 'Embed Video',
            width: 600 
        })
        .bindEvent({
            close: function(data) {
            }
        });

    data.view = 'video';

    function constructUrl(data) {
        var url = document.location.origin + '/' + pandora.user.ui.item + '/embed?',
            query = [];
        Ox.forEach(data, function(value, key) {
            if(key[0] != '_') {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            }
        });
        return url + query.join('&');
    }
    content.html('To embed this video use this code on your page:<br>');
    content.append(
            $('<textarea>')
                .css({
                    width: '520px',
                    margin: '16px',
                    height: '100%'
                }).val(
                    '<iframe width="' + width
                    + '" height="' + height
                    + '" src="' + constructUrl(data)
                    + '" frameborder="0" allowfullscreen></iframe>'
                ).bind({
                    click: function() {
                        this.focus();
                        this.select();
                    }
                })
            );
    return that;
};
