'use strict';

pandora.ui.editDialog = function() {

    var ui = pandora.user.ui,
        hasChanged = false,
        ids = ui.listSelection,
        keys = ['editable'].concat(pandora.site.itemKeys.filter(function(key) {
            return key.id != '*'
        }).map(function(key) {
            return key.id
        })),
        listKeys = pandora.site.itemKeys.filter(function(key) {
            return Ox.isArray(key.type);
        }).map(function(key){
            return key.id;
        }),
        mixed = ' ',
        separator = '; ',
        tooltip = Ox._('Doubleclick to edit'),

        $info = Ox.Element()
            .addClass('OxSelectable')
            .css({padding: '16px'});

    var that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    style: 'squared',
                    title: Ox._('Done')
                })
                .bindEvent({
                    click: function() {
                        if (!ui.updateResults && hasChanged) {
                            pandora.$ui.list.reloadList()
                        }
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.LoadingScreen().start(),
            height: 576,
            removeOnClose: true,
            title: Ox._('Edit Metadata for {0}', [
                Ox.formatNumber(ids.length) + ' ' + Ox._(
                    ids.length == 1 ? pandora.site.itemName.singular : pandora.site.itemName.plural
                )
            ]),
            width: 768
        }),

        $updateCheckbox = Ox.Checkbox({
                style: 'squared',
                title: Ox._('Update Results in the Background'),
                value: ui.updateResults
            })
            .css({
                float: 'left',
                margin: '4px'
            })
            .bindEvent({
                change: function(data) {
                    pandora.UI.set({updateResults: data.value});
                }
            });

    /*
    $($updateCheckbox.find('.OxButton')[0]).css({margin: 0});
    $(that.find('.OxBar')[1]).append($updateCheckbox);
    */

    getMetadata();

    function getMetadata(callback) {
        pandora.api.find({
            keys: keys,
            query: {
                conditions: [
                    {
                        key: 'id',
                        operator: '&',
                        value: ids
                    }
                ],
                operator: '&'
            },
            range: [0, ids.length]
        }, function(result) {
            var data = {},
                isMixed = {},
                updateTitle = false,
                items = result.data.items.filter(function(item) {
                    if (!item.editable) {
                        updateTitle = true
                    }
                    return item.editable;
                });

            if (updateTitle) {
                that.options({
                    title: Ox._('Edit Metadata for {0}', [
                        Ox.formatNumber(items.length) + ' ' + Ox._(
                            items.length == 1 ? pandora.site.itemName.singular : pandora.site.itemName.plural
                        )
                    ])
                })
                // no editable items
                if (!items.length) {
                    that.close()
                    return
                }
            }
            keys.filter(function(key) {
                return key != 'editable'
            }).forEach(function(key) {
                var isArray = Ox.contains(listKeys, key),
                    values = items.map(function(item) {
                        return item[key];
                    });
                if (isArray) {
                    values = values.map(function(value) {
                        value = value || []
                        return value.join ? value.join(separator) : value;
                    });
                }
                if (Ox.unique(values).length > 1) {
                    isMixed[key] = true;
                }
                data[key] = isMixed[key] ? null
                    : isArray && values.length ? values[0].split(separator)
                    : values[0];
            });
            that.options({
                content: pandora.ui.infoView(data, isMixed).bindEvent({
                    change: function() {
                        hasChanged = true;
                        Ox.Request.clearCache();
                    }
                })
            });
        });
    }

    return that;

};
