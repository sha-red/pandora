'use strict';

pandora.ui.downloadVideoDialog = function(options) {

    var ui = pandora.user.ui,

        formats = {
            'webm': 'WebM',
            'mp4': 'MP4',
        },

        $content = Ox.Element()
            .css({margin: '16px'}),

        $text = $('<div>')
            .html((
                options.out
                ? Ox._(
                    'Download Selection ({0} - {1})<br>of {2}', [
                    Ox.formatDuration(options['in']),
                    Ox.formatDuration(options.out),
                    options.title
                    ]
                )
                : Ox._('Download {0}', [options.title])
            ))
            .css({marginBottom: '16px'})
            .appendTo($content),

        $form = window.$form = Ox.Form({
            items: [
                Ox.Select({
                        id: 'format',
                        items: pandora.site.video.formats.map(function(format) {
                            return {
                                id: format,
                                title: formats[format]
                            };
                        }),
                        label: Ox._('Format'),
                        labelWidth: 120,
                        value: pandora.site.video.downloadFormat,
                        width: 240
                    })
                    .bindEvent({
                        change: function(data) {
                        }
                    }),
                Ox.Select({
                        id: 'resolution',
                        items: pandora.site.video.resolutions.map(function(resolution) {
                            return {
                                id: resolution,
                                title: resolution + 'p'
                            };
                        }),
                        label: Ox._('Resolution'),
                        labelWidth: 120,
                        value: ui.videoResolution,
                        width: 240
                    })
                    .bindEvent({
                        change: function(data) {
                        }
                    })
            ]
        }).appendTo($content),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'download',
                    title: Ox._('Download')
                }).bindEvent({
                    click: function() {
                        that.close();
                        var values = $form.values(),
                            url
                        if (options.out) {
                            url = '/' + options.item
                                + '/' + values.resolution
                                + 'p.' + values.format
                                + '?t=' + options['in'] + ',' + options.out;
                        } else {
                            url = '/' + options.item
                                + '/download/' + values.resolution
                                + 'p.' + values.format
                        }
                        document.location.href = url
                    }
                })
            ],
            closeButton: true,
            content: $content,
            removeOnClose: true,
            keys: {enter: 'download', escape: 'close'},
            title: (
                options.out
                ? Ox._('Download Video Selection')
                : Ox._('Download Video')
            ),
            width: 432
        });

    return that;

};
