// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.findElement = function() {
    var findKey = '',
        findValue = '';
    if (pandora.user.ui.findQuery.conditions.length == 1) {
        findKey = pandora.user.ui.findQuery.conditions[0].key;
        findValue = pandora.user.ui.findQuery.conditions[0].value;
    }
    var that = new Ox.FormElementGroup({
            elements: $.merge(pandora.user.ui.list ? [
                    pandora.$ui.findListSelect = new Ox.Select({
                            items: [
                                {id: 'all', title: 'Find: All ' + pandora.site.itemName.plural},
                                {id: 'list', title: 'Find: This List'}
                            ],
                            overlap: 'right',
                            type: 'image'
                        })
                        .bindEvent({
                            change: function(event, data) {
                                var key = data.selected[0].id;
                                pandora.$ui.findInput.options({
                                    autocomplete: autocompleteFunction()
                                }).focus();
                            }
                        }),
                ] : [], [
                    pandora.$ui.findSelect = new Ox.Select({
                            id: 'select',
                            items: $.merge($.map(pandora.site.findKeys,
                            function(key, i) {
                                return {
                                    id: key.id,
                                    checked: key.id == findKey,
                                    title: 'Find: ' + key.title
                                };
                            }), [{}, {
                                id: 'advanced',
                                title: 'Find: Advanced'
                            }]),
                            overlap: 'right',
                            width: 112
                        })
                        .bindEvent({
                            change: function(event, data) {
                                var key = data.selected[0].id;
                                if (key == 'advanced') {
                                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                                } else {
                                    if (!pandora.user.ui.findQuery.conditions.length) { // fixme: can this case happen at all?
                                        pandora.user.ui.findQuery.conditions = [{key: key, value: '', operator: ''}];
                                    } else {
                                        pandora.user.ui.findQuery.conditions[0].key = key;
                                    }
                                    pandora.$ui.mainMenu.checkItem('findMenu_find_' + key);
                                    pandora.$ui.findInput.options({
                                        autocomplete: autocompleteFunction()
                                    }).focus();
                                }
                            }
                        }),
                    pandora.$ui.findInput = new Ox.Input({
                        autocomplete: autocompleteFunction(),
                        autocompleteSelect: true,
                        autocompleteSelectHighlight: true,
                        autocompleteSelectSubmit: true,
                        clear: true,
                        id: 'input',
                        value: findValue,
                        width: 192
                    })
                    .bindEvent({
                        submit: function(event, data) {
                            var key = pandora.user.ui.findQuery.conditions.length ?
                                    pandora.user.ui.findQuery.conditions[0].key : '';
                            if (pandora.user.ui.list && that.value()[0].id == 'all') {
                                $.each(pandora.$ui.folderList, function(k, $list) {
                                    $list.options({selected: []});
                                });
                                pandora.UI.set({list: ''});
                                pandora.user.ui.listQuery = {conditions: [], operator: ''};
                            }
                            pandora.user.ui.findQuery.conditions = [{
                                key: key == 'all' ? '' : key,
                                value: data.value,
                                operator: ''
                            }];
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
        return pandora.user.ui.findQuery.conditions.length ? function(value, callback) {
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

