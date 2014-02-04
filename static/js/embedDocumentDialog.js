// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.embedDocumentDialog = function(id) {

    var $content = Ox.Element()
            .css({margin: '16px'})
            .html(Ox._('To embed this document, use the following HTML:')),

        $embed = $('<textarea>')
            .css({
                width: '322px',
                height: '64px',
                marginTop: '8px'
            })
            .val(
                '<a href="/documents/'
                + id + '"><img src="/documents/'
                + id + '/256p.jpg"></a>'
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
            title: Ox._('Embed Document'),
            width: 368 
        });

    return that;

};
