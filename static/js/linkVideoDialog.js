// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.linkVideoDialog = function() {

    var ui = pandora.user.ui,

        href = (pandora.site.site.https ? 'https' : 'http') + '://'
            + pandora.site.site.url + '/' + ui.item + '/'
            + ui.videoPoints[ui.item]['in'] + ','
            + ui.videoPoints[ui.item]['out'],

        src = '/' + ui.item + '/480p' + ui.videoPoints[ui.item]['in'] + '.jpg',

        $content = Ox.Element()
            .css({margin: '16px'})
            .html(Ox._('To link to this clip, use the following HTML:')),

        $embed = $('<textarea>')
            .css({
                width: '322px',
                height: '64px',
                marginTop: '8px'
            })
            .val(
                '<a href="' + href + '"><img src="' + src + '"></a>'
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
            title: Ox._('Link to Video'),
            width: 368 
        });

    return that;

};
