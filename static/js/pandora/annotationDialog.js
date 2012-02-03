// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.annotationDialog = function(layer) {
    var $dialog = Ox.Dialog({
        buttons: [
            Ox.Button({title: 'Sign Up...'}).bindEvent({
                click: function() {
                    $dialog.close();
                    pandora.$ui.accountDialog = pandora.ui.accountDialog('signup').open();
                }
            }),
            Ox.Button({title: 'Sign In...'}).bindEvent({
                click: function() {
                    $dialog.close();
                    pandora.$ui.accountDialog = pandora.ui.accountDialog('signin').open();
                }
            }),
            {},
            Ox.Button({title: 'Not Now'}).bindEvent({
                click: function() {
                    $dialog.close();
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
                $('<div>')
                    .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                    .html('To add or edit ' + layer + ', please sign up or sign in.')
            ),
        fixedSize: true,
        height: 128,
        removeOnClose: true,
        width: 304,
        title: Ox.toTitleCase(layer)
    });
    return $dialog;
};
