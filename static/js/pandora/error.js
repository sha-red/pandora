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
        that = Ox.Dialog({
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
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon64.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    Ox.Element()
                        .css({position: 'absolute', left: '96px', top: '16px', width: '256px'})
                        .html('Sorry, you have made an unauthorized request.')
                ),
            fixedSize: true,
            height: 192,
            keys: {enter: 'close', escape: 'close'},
            removeOnClose: true,
            title: Ox.toTitleCase(data.status.text),
            width: 368
        })
        .addClass('OxErrorDialog')
        .open();
    } else  {
        // 0 (timeout) or 500 (error)
        var error = data.status.code == 0 ? 'timeout' : 'error';

        // on window unload, pending request will time out, so
        // in order to keep the dialog from appearing, delay it
        setTimeout(function() {
            if ($('.OxErrorDialog').length == 0 && !pandora.isUnloading) {
                that = Ox.Dialog({
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
                    content: Ox.Element()
                        .append(
                            $('<img>')
                                .attr({src: Ox.UI.PATH + 'png/icon128.png'})
                                .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                        )
                        .append(
                            Ox.Element()
                                .css({position: 'absolute', left: '96px', top: '16px', width: '256px'})
                                .html(
                                    'Sorry, a server ' + error
                                    + ' occured while handling your request. To help us find out what went wrong, you may want to report this error to an administrator. Otherwise, please try again later.'
                                )
                        ),
                    fixedSize: true,
                    height: 192,
                    keys: {enter: 'close', escape: 'close'},
                    removeOnClose: true,
                    title: 'Server ' + Ox.toTitleCase(error),
                    width: 368
                })
                .addClass('OxErrorDialog')
                .open();
            }
        }, 250);
    }
};
