// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.onloadDialog = function() {

    var 
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        $text = Ox.Input({
            height: dialogHeight - 8,
            id: 'onload',
            placeholder: 'Paste onload code here',
            type: 'textarea',
            value: localStorage['pandora.onload'] || '',
            width: dialogWidth - 8
        }),

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            title: 'Clear'
                        })
                        .css({margin: '4px 4px 4px 0'})
                        .bindEvent({
                            click: function() {
                                clear();
                            }
                        }),
                    Ox.Button({
                            id: 'done',
                            title: 'Done',
                            width: 48
                        }).bindEvent({
                            click: function() {
                                that.close();
                            }
                        })
                ],
                closeButton: true,
                content: $text,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: 'Manage Users',
                width: dialogWidth
            })
            .bindEvent({
                resize: resize
            });

    function resize(data) {
        dialogHeight = data.height;
        dialogWidth = data.width;
        $text.options({
            height: dialogHeight - 8,
            width: dialogWidth - 8 
        });
    }

    function clear() {
        delete localStorage['pandora.onload'];
        $text.options({value: ''});
        
    }

    that.superClose = that.close;
    that.close = function() {
        var value = $text.value();
        if(value) {
            localStorage['pandora.onload'] = value;
        } else {
            delete localStorage['pandora.onload'];
        }
        that.superClose();
    };

    return that;

};

