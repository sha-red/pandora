// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.annotationDialog = function(layer) {
    var isEditor = pandora.user.ui.itemView == 'editor',
        $dialog = Ox.Dialog({
            buttons: Ox.merge(
                isEditor ? [
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
                    })
                ] : [
                    Ox.Button({title: 'Switch to Editor'}).bindEvent({
                        click: function() {
                            $dialog.close();
                            pandora.UI.set({itemView: 'editor'});
                        }
                    })
                ],
                [
                    {},
                    Ox.Button({title: 'Not Now'}).bindEvent({
                        click: function() {
                            $dialog.close();
                        }
                    })
                ]
            ),
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    $('<div>')
                        .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                        .html(
                            'To add or edit ' + layer + ', ' + (
                                isEditor ? 'please sign up or sign in.'
                                    : 'just switch to the editor.'
                            )
                        )
                ),
            fixedSize: true,
            height: 128,
            removeOnClose: true,
            width: 304,
            title: Ox.toTitleCase(layer)
        });
    return $dialog;
};
