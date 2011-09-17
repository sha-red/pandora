// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.findElement = function() {
    var findIndex = pandora.user.ui.find.index,
        findKey = pandora.user.ui.find.key,
        findValue = pandora.user.ui.find.value;
    var that = Ox.FormElementGroup({
            elements: Ox.merge(pandora.user.ui.list ? [
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
                                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                                    pandora.$ui.findInput.options({placeholder: 'Edit...'})
                                } else {
                                    pandora.$ui.mainMenu.checkItem('findMenu_find_' + key);
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
                        autocompleteSelectSubmit: true,
                        clear: true,
                        id: 'input',
                        placeholder: findKey == 'advanced' ? 'Edit...' : '',
                        value: findValue,
                        width: 192
                    })
                    .bindEvent({
                        focus: function(data) {
                            if (pandora.$ui.findSelect.value() == 'advanced') {
                                pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                            }
                        },
                        submit: function(data) {
                            var findInList = pandora.user.ui.list
                                    && pandora.$ui.findListSelect.value() == 'list',
                                key = pandora.$ui.findSelect.value(),
                                conditions = data.value ? [{
                                    key: key == 'all' ? '' : key,
                                    value: data.value,
                                    operator: ''
                                }] : [];
                            if (findInList) {
                                pandora.user.ui.query = {
                                    conditions: Ox.merge([{
                                        key: 'list',
                                        value: pandora.user.ui.list,
                                        operator: ''
                                    }], conditions),
                                    operator: '&'
                                }
                                data.value && findIndex == 0 && pandora.user.ui.query.conditions.reverse();
                            } else {
                                if (pandora.user.ui.list) {
                                    Ox.forEach(pandora.$ui.folderList, function($list) {
                                        $list.options({selected: []});
                                    });
                                    pandora.UI.set({list: ''});
                                }
                                pandora.user.ui.query = {
                                    conditions: conditions,
                                    operator: ''
                                }
                            }
                            pandora.URL.set(pandora.Query.toString());
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
        return pandora.user.ui.query.conditions.length ? function(value, callback) {
            var elementValue = that.value(),
                key = elementValue[pandora.user.ui.list ? 1 : 0],
                findKey = Ox.getObjectById(pandora.site.findKeys, key);
            Ox.print('!!!!', key, findKey, 'autocomplete' in findKey && findKey.autocomplete)
            value === '' && Ox.print('Warning: autocomplete function should never be called with empty value');
            if ('autocomplete' in findKey && findKey.autocomplete) {
                pandora.api.autocomplete({
                    key: key,
                    query: elementValue[0].id == 'list' ? pandora.user.ui.listQuery : {conditions: [], operator: ''},
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

