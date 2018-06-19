'use strict';

pandora.ui.licenseDialog = function() {

    var that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    disabled: true,
                    id: 'close',
                    title: Ox._('Close')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            content: Ox._(
                'This installation of <b>pan.do/ra</b> is unlicensed. '
                + 'Please contact your vendor for more information on '
                + 'how to acquire a license or renew an expired one.'
            ),
            title: Ox._('License')
        })
        .bindEvent({
            open: function() {
                setTimeout(function() {
                    that.enableButton('close');
                }, 5000);
            }
        });

    return that;

};
