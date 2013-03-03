// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.errorDialog = function(data) {
    var that, error;

    //dont open dialog on unload or if antoher error is open
    //fixme: error dialog should updated instead
    if ($('.OxErrorDialog').length || pandora.isUnloading) {
        return;
    }

    if (data.status.code == 401 || data.status.code == 403) {
        that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            keys: {enter: 'close', escape: 'close'},
            text: 'Sorry, you have made an unauthorized request.',
            title: Ox.toTitleCase(data.status.text)
        })
        .addClass('OxErrorDialog')
        .open();
    } else {
        // 0 (timeout) or 500 (error)
        error = data.status.code == 0 ? 'timeout' : 'error';
        // on window unload, pending request will time out, so
        // in order to keep the dialog from appearing, delay it
        setTimeout(function() {
            if ($('.OxErrorDialog').length == 0 && !pandora.isUnloading) {
                that = pandora.ui.iconDialog({
                    buttons: [
                        Ox.Button({
                                id: 'close',
                                title: 'Close'
                            })
                            .bindEvent({
                                click: function() {
                                    that.close();
                                }
                            })
                    ],
                    keys: {enter: 'close', escape: 'close'},
                    text: 'Sorry, a server ' + error
                        + ' occured while handling your request.'
                        + ' To help us find out what went wrong,'
                        + ' you may want to report this error to an administrator.'
                        + ' Otherwise, please try again later.',
                    title: 'Server ' + Ox.toTitleCase(error)
                })
                .addClass('OxErrorDialog')
                .open();
            }
        }, 250);
    }

};
