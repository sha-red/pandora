'use strict';

pandora.ui.embedDocumentDialog = function(id, position) {

    var $content = Ox.Element()
            .css({margin: '16px'})
            .html(Ox._(
                'To embed this document'
                + (position ? ' at the current position' : '')
                + ', use the following HTML:'
            )),

        $embed = $('<textarea>')
            .css({
                width: '322px',
                height: '64px',
                marginTop: '8px'
            })
            .val(
                '<a href="/document/' + id
                + (position ? '/' + position : '')
                + '"><img src="/documents/' + id + '/256p'
                + (position || '') + '.jpg"></a>'
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
            height: 144,
            keys: {escape: 'close'},
            removeOnClose: true,
            title: Ox._('Embed Document'),
            width: 368 
        });

    return that;

};
