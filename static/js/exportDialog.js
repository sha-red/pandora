'use strict';

pandora.ui.exportDialog = function(options) {

    var $content = Ox.Input({
                height: 256,
                style: 'square',
                type: 'textarea',
                value: options.data,
                width: 512 - Ox.UI.SCROLLBAR_SIZE
            }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                        title: Ox._('Select All')
                    })
                    .bindEvent({
                        click: function() {
                            $content.focusInput(true);
                        }
                    }),
                {},
                Ox.Button({
                        title: Ox._('Close')
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                        }
                    })
            ],
            content: $content,
            fixedSize: true,
            height: 256,
            removeOnClose: true,
            title: options.title,
            width: 512
        });

    that.superOpen = that.open;
    that.open = function() {
        that.superOpen();
        that.find('.OxContent').css({overflow: 'hidden'});
        $content.find('textarea').addClass('OxMonospace');
        $content.focusInput(true);
    };

    return that;

};