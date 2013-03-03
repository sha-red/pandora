// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.resetUIDialog = function(data) {

    var that = pandora.ui.iconDialog({
        buttons: [
            Ox.Button({
                    id: 'cancel',
                    title: 'Don\'t Reset'
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
            Ox.Button({
                    id: 'reset',
                    title: 'Reset'
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.$ui.preferencesDialog.close();
                        pandora.UI.set({page: ''});
                        pandora.UI.reset();
                    }
                })
        ],
        keys: {enter: 'reset', escape: 'cancel'},
        text: 'Are you sure you want to reset all UI settings?',
        title: 'Reset UI Settings'
    });

    return that;

};