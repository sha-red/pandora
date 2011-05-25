// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.findElement = function() {
    var findKey = '',
        findValue = '';
    if (app.user.ui.findQuery.conditions.length == 1) {
        findKey = app.user.ui.findQuery.conditions[0].key;
        findValue = app.user.ui.findQuery.conditions[0].value;
    }
    var that = new Ox.FormElementGroup({
            elements: $.merge(app.user.ui.list ? [
                    app.$ui.findListSelect = new Ox.Select({
                            items: [
                                {id: 'all', title: 'Find: All ' + app.config.itemName.plural},
                                {id: 'list', title: 'Find: This List'}
                            ],
                            overlap: 'right',
                            type: 'image'
                        })
                        .bindEvent({
                            change: function(event, data) {
                                var key = data.selected[0].id;
                                app.$ui.findInput.options({
                                    autocomplete: autocompleteFunction()
                                }).focus();
                            }
                        }),
                ] : [], [
                    app.$ui.findSelect = new Ox.Select({
                            id: 'select',
                            items: $.merge($.merge([{
                                id: 'all',
                                title: 'Find: All'
                            }], $.map(app.ui.findKeys, function(key, i) {
                                return {
                                    id: key.id,
                                    checked: key.id == findKey,
                                    title: 'Find: ' + key.title
                                };
                            })), [{}, {
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
                                    app.$ui.filterDialog = pandora.ui.filterDialog().open();
                                } else {
                                    if (!app.user.ui.findQuery.conditions.length) { // fixme: can this case happen at all?
                                        app.user.ui.findQuery.conditions = [{key: key, value: '', operator: ''}];
                                    } else {
                                        app.user.ui.findQuery.conditions[0].key = key;
                                    }
                                    app.$ui.mainMenu.checkItem('findMenu_find_' + key);
                                    app.$ui.findInput.options({
                                        autocomplete: autocompleteFunction()
                                    }).focus();
                                }
                            }
                        }),
                    app.$ui.findInput = new Ox.Input({
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
                            var key = app.user.ui.findQuery.conditions.length ?
                                    app.user.ui.findQuery.conditions[0].key : '';
                            if (app.user.ui.list && that.value()[0].id == 'all') {
                                $.each(app.$ui.folderList, function(k, $list) {
                                    $list.options({selected: []});
                                });
                                pandora.UI.set({list: ''});
                                app.user.ui.listQuery = {conditions: [], operator: ''};
                            }
                            app.user.ui.findQuery.conditions = [{
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
        return app.user.ui.findQuery.conditions.length ? function(value, callback) {
            var elementValue = that.value(),
                key = elementValue[app.user.ui.list ? 1 : 0].id,
                findKey = Ox.getObjectById(app.ui.findKeys, key);
            Ox.print('!!!!', key, findKey, 'autocomplete' in findKey && findKey.autocomplete)
            value === '' && Ox.print('Warning: autocomplete function should never be called with empty value');
            if ('autocomplete' in findKey && findKey.autocomplete) {
                pandora.api.autocomplete({
                    key: key,
                    query: elementValue[0].id == 'list' ? app.user.ui.listQuery : {conditions: [], operator: ''},
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

