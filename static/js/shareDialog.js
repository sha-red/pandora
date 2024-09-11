'use strict';

pandora.ui.shareDialog = function(/*[url, ]callback*/) {

    if (arguments.length == 1) {
        var url, callback = arguments[0];
    } else {
        var url = arguments[0], callback = arguments[1];
    }
    var url = document.location.href.replace(document.location.hostname, document.location.hostname + '/m'),
        $content = Ox.Element().append(
                Ox.Input({
                    height: 100,
                    width: 256,
                    placeholder: 'Share Link',
                    type: 'textarea',
                    disabled: true,
                    value: url
                })
        ),
        that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
            ],
            keys: {enter: 'close', escape: 'close'},
            content: $content,
            title: "Share current view",
        });
    return that;
}
