// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.findElement = function() {
    var findIndex = pandora.user.ui._findState.index,
        findKey = pandora.user.ui._findState.key,
        findValue = pandora.user.ui._findState.value;
    var that = Ox.FormElementGroup({
            elements: Ox.merge(pandora.user.ui._list ? [
                    pandora.$ui.findListSelect = Ox.Select({
                            items: [
                                {id: 'all', title: 'Find: All ' + pandora.site.itemName.plural},
                                {id: 'list', title: 'Find: This List', checked: true}
                            ],
                            overlap: 'right',
                            type: 'image'
                        })
                        .bindEvent({
                            change: function(data) {
                                var key = data.selected[0].id;
                                pandora.$ui.findInput.options({
                                    autocomplete: autocompleteFunction()
                                }).focus();
                            }
                        }),
                ] : [], [
                    pandora.$ui.findSelect = Ox.Select({
                            id: 'select',
                            items: Ox.merge(
                                pandora.site.findKeys.map(function(key, i) {
                                    return {
                                        id: key.id,
                                        title: 'Find: ' + key.title,
                                        checked: findKey == key.id
                                    };
                                }),
                                [{}, {
                                    id: 'advanced',
                                    title: 'Find: Advanced',
                                    checked: findKey == 'advanced'
                                }]
                            ),
                            overlap: 'right',
                            width: 112
                        })
                        .bindEvent({
                            change: function(data) {
                                var key = data.selected[0].id;
                                if (key == 'advanced') {
                                    pandora.$ui.findInput.options({
                                        placeholder: 'Edit Query...',
                                        value: ''
                                    });
                                    (pandora.$ui.filterDialog || (
                                        pandora.$ui.filterDialog = pandora.ui.filterDialog()
                                    )).open();
                                } else {
                                    pandora.$ui.findInput.options({
                                        autocomplete: autocompleteFunction(),
                                        placeholder: ''
                                    }).focus();
                                }
                            }
                        }),
                    pandora.$ui.findInput = Ox.Input({
                        autocomplete: autocompleteFunction(),
                        autocompleteSelect: true,
                        autocompleteSelectHighlight: true,
                        autocompleteSelectMaxWidth: 256,
                        autocompleteSelectSubmit: true,
                        clear: true,
                        id: 'input',
                        placeholder: findKey == 'advanced' ? 'Edit Query...' : '',
                        value: findValue,
                        width: 192
                    })
                    .bindEvent({
                        focus: function(data) {
                            if (pandora.$ui.findSelect.value() == 'advanced') {
                                pandora.$ui.findInput.blurInput();
                                (pandora.$ui.filterDialog || (
                                    pandora.$ui.filterDialog = pandora.ui.filterDialog()
                                )).open();
                            }
                        },
                        submit: function(data) {
                            var findInList = pandora.user.ui._list
                                    && pandora.$ui.findListSelect.value() == 'list',
                                key = pandora.$ui.findSelect.value(),
                                conditions = Ox.merge(
                                    findInList ? [{
                                        key: 'list',
                                        value: pandora.user.ui._list,
                                        operator: '=='
                                    }] : [],
                                    data.value ? [{
                                        key: key,
                                        value: data.value,
                                        operator: '='
                                    }] : []
                                );
                            pandora.UI.set('find', {conditions: conditions, operator: '&'});
                        }
                    })
            ]),
            id: 'findElement'
        })
        .css({
            float: 'right',
            margin: '4px'
        });
    function autocompleteFunction() {
        return pandora.user.ui.find.conditions.length ? function(value, callback) {
            var elementValue = that.value(),
                key = elementValue[pandora.user.ui._list ? 1 : 0],
                findKey = Ox.getObjectById(pandora.site.findKeys, key);
            value === '' && Ox.Log('', 'Warning: autocomplete function should never be called with empty value');
            if (findKey.autocomplete) {
                pandora.api.autocomplete({
                    key: key,
                    query: {
                        conditions: pandora.user.ui._list
                                 && pandora.$ui.findListSelect.value() == 'list'
                            ? [{key: 'list', value: pandora.user.ui._list, operator: '=='}] : [],
                        operator: '&'
                    },
                    range: [0, 20],
                    sort: [{
                        key: 'votes',
                        operator: '-'
                    }],
                    value: value
                }, function(result) {
                    callback(result.data.items);
                });
            } else {
                callback([]);
            }
        } : null;
    }
    return that;
};

