// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.scriptDialog = function() {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.75),
        dialogWidth = Math.round(window.innerWidth * 0.75),
        $text = Ox.$('<div>')
            .css({height: '16px', margin: '16px'})
            .html(Ox._(
                'Any JavaScript you paste here will run on load. '
                + 'If you ever need to bypass it, '
                + 'press escape while the page is loading.'
            )),
        $input = Ox.Input({
                height: dialogHeight - 64,
                type: 'textarea',
                value: pandora.user.script || '',
                width: dialogWidth - 32
            })
            .css({margin: '16px'}),
        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            title: Ox._('Clear')
                        })
                        .css({margin: '4px 4px 4px 0'})
                        .bindEvent({
                            click: function() {
                                clear();
                            }
                        }),
                    Ox.Button({
                            id: 'done',
                            title: Ox._('Done'),
                            width: 48
                        }).bindEvent({
                            click: function() {
                                that.close();
                            }
                        })
                ],
                closeButton: true,
                content: Ox.Element().append($text).append($input),
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                removeOnClose: true,
                title: Ox._('Run Script on Load'),
                width: dialogWidth
            })
            .bindEvent({
                resize: resize
            });

    function resize(data) {
        dialogHeight = data.height;
        dialogWidth = data.width;
        $input.options({
            height: dialogHeight - 64,
            width: dialogWidth - 32
        });
    }

    function clear() {
        pandora.api.editPreferences({script: ''});
        $input.options({value: ''});
    }

    that.superClose = that.close;
    that.close = function() {
        var value = $input.value();
        pandora.api.editPreferences({script: value || ''});
        that.superClose();
    };

    return that;

};

