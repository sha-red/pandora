'use strict';

pandora.ui.localeButton = function() {

    var isGuest = pandora.user.level == 'guest',

        that = Ox.Element({
                tooltip: 'Click to change language'
            })
            .addClass('OxLight')
            .css({
                padding: '0 2px',
                margin: '2px 3px 2px 1px',
                fontSize: '9px'
            })
            .html('[' + pandora.user.ui.locale.toUpperCase() + ']')
            .bindEvent({
                anyclick: function() {
                    if (isGuest) {
                        pandora.$ui.appearanceDialog = pandora.ui.appearanceDialog().open();
                    } else {
                        pandora.UI.set({'part.preferences': 'appearance'});
                        pandora.UI.set({page: 'preferences'});
                    }
                }
            });

    return that;

};