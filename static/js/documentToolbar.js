// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentToolbar = function() {
    var ui = pandora.user.ui,
        isNavigationView = !ui.item,
        that = Ox.Bar({
            size: 24
        }).css({
            zIndex: 2 // fixme: remove later
        }),
        $viewSelect,
        $sortView;

    ui.document && that.append(
        pandora.$ui.backButton = pandora.ui.backButton()
    );

    $viewSelect = documentViewSelect().appendTo(that);
    if (!ui.document) {
        $sortView = documentSortSelect().appendTo(that);
    }

    that.append(
        !ui.document
        ? pandora.$ui.listTitle = Ox.Label({
                textAlign: 'center',
                title: getCollectionName(pandora.user.ui._collection)
            })
            .addClass('OxSelectable')
            .css({
                position: 'absolute',
                left: getListTitleLeft() + 'px',
                top: '4px',
                right: (ui._collection ? 340 : 326) + 'px',
                width: 'auto'
            })
        : pandora.$ui.itemTitle = Ox.Label({
                textAlign: 'center'
            })
            .addClass('OxSelectable')
            .css({
                position: 'absolute',
                left: '266px',
                top: '4px',
                right: (ui._collection ? 340 : 326) + 'px',
                width: 'auto'
            })
            .hide()
    );
    (!ui.document ? pandora.$ui.listTitle : pandora.$ui.itemTitle).bindEvent({
        doubleclick: function() {
            if (!ui.document) {
                pandora.$ui.list && (
                    ui.collectionView == 'list'
                    ? pandora.$ui.list.$body
                    : pandora.$ui.list
                ).animate({
                    scrollTop: 0
                }, 250);
            } else {
                //fixme:
                pandora.$ui.browser.scrollToSelection();
            }
        }
    })
    that.append(
        pandora.$ui.findDocumentsElement = pandora.ui.findDocumentsElement(function(data) {
            var key = data.key,
                value = data.value,
                conditions;
            if (key == 'all') {
                key = 'title'
            }
            conditions = [
                {key: key, operator: '=', value: value}
            ];
            if (pandora.user.ui._collection) {
                conditions.push({
                    key: 'collection',
                    value: pandora.user.ui._collection,
                    operator: '=='
                });
            }
            pandora.UI.set({findDocuments: {conditions: conditions, operator: '&'}});
        })
    );
    that.bindEvent({
        pandora_collectionsort: function(data) {
            $sortView.updateElement();
        },
        pandora_documentview: function(data) {
            $viewSelect.options({
                value: data.value
            });
        }
    });
    function getCollectionName(listId) {
        return '<b>' + (
            listId == ''
                ? Ox._('All {0}', [Ox._(Ox.toTitleCase(ui.section))])
                : Ox.encodeHTMLEntities(listId.slice(listId.indexOf(':') + 1))
        ) + '</b>';
    }
    function getListTitleLeft() {
        return 284;
    }

    function documentSortSelect() {
        var $orderButton = Ox.Button({
                overlap: 'left',
                title: getOrderButtonTitle(),
                tooltip: getOrderButtonTooltip(),
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({collectionSort: [{
                        key: ui.collectionSort[0].key,
                        operator: ui.collectionSort[0].operator == '+' ? '-' : '+'
                    }]});
                },
            }),
            $sortSelect = Ox.Select({
                items: pandora.site.documentKeys.filter(function(key) {
                    return key.sort;
                }).map(function(key) {
                    return {
                        id: key.id,
                        title: Ox._('Sort by {0}', [key.title])
                    };
                }),
                value: ui.collectionSort[0].key,
                width: 128
            })
            .bindEvent({
                change: function(data) {
                    var key = data.value;
                    pandora.UI.set({collectionSort: [{
                        key: key,
                        operator: pandora.getDocumentSortOperator(key)
                    }]});
                }
            }),
            that = Ox.FormElementGroup({
                elements: [$sortSelect, $orderButton],
                float: 'right'
            })
            .css({float: 'left', margin: '4px 2px'})

        function getOrderButtonTitle() {
            return ui.collectionSort[0].operator == '+' ? 'up' : 'down';
        }

        function getOrderButtonTooltip() {
            return Ox._(ui.collectionSort[0].operator == '+' ? 'Ascending' : 'Descending');
        }

        that.updateElement = function() {
            $sortSelect.value(ui.collectionSort[0].key);
            $orderButton.options({
                title: getOrderButtonTitle(),
                tooltip: getOrderButtonTooltip()
            });
        };
        return that;
    }

    function documentViewSelect() {
        var that;
        if (!ui.document) {
            that = Ox.Select({
                    items: pandora.site.collectionViews,
                    value: ui.collectionView,
                    width: 128
                })
                .css({float: 'left', margin: '4px 2px 4px 4px'})
                .bindEvent({
                    change: function(data) {
                        pandora.UI.set({collectionView: data.value});
                    }
                });
        } else {
            that = Ox.Select({
                    items: [
                        {id: 'info', title: Ox._('View Info')},
                        {id: 'view', title: Ox._('View Document')}
                    ],
                    value: ui.documentView,
                    width: 128
                })
                .css({float: 'left', margin: '4px 2px 4px 4px'})
                .bindEvent({
                    change: function(data) {
                        pandora.UI.set({documentView: data.value});
                    },
                });
        }
        return that;
    }

    that.updateListName = function(listId) {
        pandora.$ui.listTitle.options({title: getCollectionName(listId)});
    };
    return that;
};

