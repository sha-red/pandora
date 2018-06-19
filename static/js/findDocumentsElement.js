'use strict';

pandora.ui.findDocumentsElement = function() {
    var findIndex = pandora.user.ui._findDocumentsState.index,
        findKey = pandora.user.ui._findDocumentsState.key,
        findValue = pandora.user.ui._findDocumentsState.value,
        hasPressedClear = false,
        previousFindKey = findKey,
        $findCollectionSelect,
        $findSelect,
        $findInput,
        that = Ox.FormElementGroup({
            elements: [].concat(pandora.user.ui._collection ? [
                    $findCollectionSelect = Ox.Select({
                            items: [
                                {id: 'all', title: Ox._('Find: All {0}', [Ox._('Documents')])},
                                {id: 'collection', title: Ox._('Find: This Collection')}
                            ],
                            overlap: 'right',
                            type: 'image',
                            tooltip: Ox._('Find: This Collection'),
                            value: 'collection'
                        })
                        .bindEvent({
                            change: function(data) {
                                $findCollectionSelect.options({
                                    tooltip: Ox.getObjectById(
                                        $findCollectionSelect.options('items'),
                                        data.value
                                    ).title
                                });
                                $findInput.focusInput(true);
                            }
                        }),
                ] : [], [
                    $findSelect = Ox.Select({
                            id: 'select',
                            items: pandora.site.documentKeys.filter(function(key) {
                                return key.find;
                            }).map(function(key) {
                                    return {
                                        id: key.id,
                                        title: Ox._('Find: {0}', [Ox._(key.title)])
                                    };
                                }),
                            overlap: 'right',
                            value: findKey,
                            width: 128
                        })
                        .bindEvent({
                            change: function(data) {
                                //pandora.$ui.mainMenu.checkItem('findMenu_find_' + data.value);
                                $findInput.options({
                                    autocomplete: autocompleteFunction(),
                                    placeholder: ''
                                }).focusInput(true);
                                previousFindKey = data.value;
                            }
                        }),
                    $findInput = Ox.Input({
                        autocomplete: autocompleteFunction(),
                        autocompleteSelect: true,
                        autocompleteSelectHighlight: true,
                        autocompleteSelectMaxWidth: 256,
                        autocompleteSelectSubmit: true,
                        clear: true,
                        clearTooltip: Ox._('Click to clear or doubleclick to reset query'),
                        id: 'input',
                        placeholder: findKey == 'advanced' ? Ox._('Edit Query...') : '',
                        value: findValue,
                        width: 192
                    })
                    .bindEvent({
                        clear: function() {
                            hasPressedClear = true;
                        },
                        focus: function(data) {
                            if ($findSelect.value() == 'advanced') {
                                if (hasPressedClear) {
                                    pandora.UI.set({find: pandora.site.user.ui.find});
                                    that.updateElement();
                                    hasPressedClear = false;
                                }
                                $findInput.blurInput();
                                //fixme advanced find dialog for documents
                                //pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                            }
                        },
                        submit: function(data) {
                            var findInList = pandora.user.ui._collection
                                    && $findCollectionSelect.value() == 'collection',
                                key = $findSelect.value(),
                                conditions = [].concat(
                                    findInList ? [{
                                        key: 'collection',
                                        value: pandora.user.ui._collection,
                                        operator: '=='
                                    }] : [],
                                    data.value ? [{
                                        key: key,
                                        value: data.value,
                                        operator: '='
                                    }] : []
                                );
                            pandora.UI.set({
                                findDocuments: {conditions: conditions, operator: '&'}
                            });
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
        var key = !that
                ? pandora.user.ui._findDocumentsState.key
                : that.value()[pandora.user.ui._collection ? 1 : 0],
            findKey = Ox.getObjectById(pandora.site.documentFindKeys, key);
        return findKey && findKey.autocomplete ? function(value, callback) {
            value === '' && Ox.Log('', 'Warning: autocomplete function should never be called with empty value');
            pandora.api.autocompleteDocuments({
                key: key,
                query: {
                    conditions: pandora.user.ui._collection
                             && $findCollectionSelect.value() == 'collection'
                        ? [{key: 'collection', value: pandora.user.ui._collection, operator: '=='}] : [],
                    operator: '&'
                },
                range: [0, 20],
                sort: findKey.autocompleteSort,
                value: value
            }, function(result) {
                callback(result.data.items.map(function(item) {
                    return Ox.decodeHTMLEntities(item);
                }));
            });
        } : null;
    }
    that.updateElement = function() {
        var findState = pandora.user.ui._findDocumentsState;
        $findSelect.value(findState.key);
        $findInput.options(
            findState.key == 'advanced' ? {
                placeholder: Ox._('Edit Query...'),
                value: ''
            } : {
                autocomplete: autocompleteFunction(),
                placeholder: '',
                value: findState.value
            }
        );
    };
    return that;
};

