// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
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
                                pandora.$ui.findInput.options({
                                    autocomplete: autocompleteFunction()
                                }).focusInput(true);
                            }
                        }),
                ] : [], [
                    pandora.$ui.findSelect = Ox.Select({
                            id: 'select',
                            items: Ox.merge(
                                Ox.map(pandora.site.findKeys, function(key, i) {
                                    return !key.capability
                                        || pandora.site.capabilities[key.capability][pandora.user.level]
                                    ? {
                                        id: key.id,
                                        title: 'Find: ' + key.title,
                                    } : null;
                                }),
                                [{}, {
                                    id: 'advanced',
                                    title: 'Find: Advanced',
                                    checked: findKey == 'advanced'
                                }]
                            ),
                            overlap: 'right',
                            value: findKey,
                            width: 112
                        })
                        .bindEvent({
                            change: function(data) {
                                if (data.value == 'advanced') {
                                    that.update();
                                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                                } else {
                                    Ox.Log('FIND', 'select change', pandora.$ui.findInput.value())
                                    pandora.$ui.findInput.options({
                                        autocomplete: autocompleteFunction(),
                                        placeholder: ''
                                    }).focusInput(true);
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
                                pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
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
                Ox.Log('AUTO', '_list/select', pandora.user.ui._list, pandora.$ui.findListSelect.value())
                pandora.api.autocomplete({
                    key: key,
                    query: {
                        conditions: pandora.user.ui._list
                                 && pandora.$ui.findListSelect.value() == 'list'
                            ? [{key: 'list', value: pandora.user.ui._list, operator: '=='}] : [],
                        operator: '&'
                    },
                    range: [0, 20],
                    sort: [{key: 'votes', operator: '-'}],
                    value: value
                }, function(result) {
                    callback(result.data.items);
                });
            } else {
                callback([]);
            }
        } : null;
    }
    that.update = function() {
        var findState = pandora.user.ui._findState;
        pandora.$ui.findSelect.value(findState.key);
        pandora.$ui.findInput.options(
            findState.key == 'advanced'
            ? {placeholder: 'Edit Query...', value: ''}
            : {
                autocomplete: autocompleteFunction(),
                placeholder: '',
                value: findState.value
            }
        );
    };
    return that;
};

