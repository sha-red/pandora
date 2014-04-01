'use strict';

pandora.ui.appearanceDialog = function() {

    var that = pandora.ui.iconDialog({
        buttons: [
            Ox.Button({
                id: 'done',
                title: Ox._('Done')
            }).bindEvent({
                click: function() {
                    that.close();
                }
            })
        ],
        content: Ox.Form({
            items: [
                Ox.Select({
                        id: 'theme',
                        items: pandora.site.themes.map(function(theme) {
                            return {id: theme, title: Ox.Theme.getThemeData(theme).themeName}
                        }),
                        label: Ox._('Theme'),
                        labelWidth: 120,
                        value: pandora.user.ui.theme,
                        width: 320
                    })
                    .bindEvent({
                        change: function(data) {
                            pandora.UI.set({theme: data.value});
                            pandora.setTheme(data.value);
                        }
                    }),
                Ox.Select({
                        id: 'locale',
                        items: pandora.site.languages.map(function(locale) {
                            return {id: locale, title: Ox.LOCALE_NAMES[locale]}
                        }),
                        label: Ox._('Language'),
                        labelWidth: 120,
                        value: pandora.user.ui.locale,
                        width: 320
                    })
                    .bindEvent({
                        change: function(data) {
                            pandora.UI.set({locale: data.value});
                            pandora.setLocale(data.value, function() {
                                pandora.$ui.appPanel.reload();
                            });
                        }
                    })
            ]
        }),
        keys: {enter: 'done', escape: 'done'},
        title: Ox._('Appearance'),
        width: 432
    });

    return that;

};
