'use strict';

pandora.ui.embedVideoDialog = function() {

    var width = 640,
        height = 360,
        url = document.location.href + (
            document.location.hash ? 'embed' : '#embed'
        ),

        $content = Ox.Element()
            .css({margin: '16px'})
            .html(Ox._('To embed this clip, use the following HTML:')),

        $embed = $('<textarea>')
            .css({
                width: '322px',
                height: '64px',
                marginTop: '8px'
            })
            .val(
                '<iframe width="' + width
                + '" height="' + height
                + '" src="' + url
                + '" frameborder="0" '
                + 'allowfullscreen></iframe>'
            )
            .on({
                click: function() {
                    this.focus();
                    this.select();
                }
            })
            .appendTo($content),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: $content,
            fixedSize: true,
            height: 128,
            keys: {escape: 'close'},
            removeOnClose: true,
            title: Ox._('Embed Video'),
            width: 368 
        });

    return that;

};
