// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.licenseDialog = function() {

    var that = pandora.ui.iconDialog({
        buttons: [
            Ox.Button({
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
        keys: {enter: 'close', escape: 'close'},
        title: Ox._('License')
    });
    return that;
};
