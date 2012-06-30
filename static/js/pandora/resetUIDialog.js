// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.resetUIDialog = function(data) {

    var that = Ox.Dialog({
        buttons: [
            Ox.Button({
                    id: 'cancel',
                    title: 'Cancel'
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
        content: Ox.Element()
            .append(
                $('<img>')
                    .attr({src: '/static/png/icon.png'})
                    .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
            )
            .append(
                $('<div>')
                    .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                    .html('Are you sure you want to reset all UI settings?')
            ),
        height: 128,
        keys: {enter: 'reset', escape: 'cancel'},
        title: 'Reset UI Settings',
        width: 304
    });

    return that;

};