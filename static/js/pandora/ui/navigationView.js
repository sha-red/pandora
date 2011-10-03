// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.navigationView = function(type, videoRatio) {

    var ui = pandora.user.ui,

        itemName = type == 'map' ? 'place' : 'event',

        listSizes = [
            144 + Ox.UI.SCROLLBAR_SIZE,
            280 + Ox.UI.SCROLLBAR_SIZE,
            416 + Ox.UI.SCROLLBAR_SIZE
        ],
        listSize = listSizes[ui.clipsColumns - 1],

        $element = Ox.Element(),

        $itemIcon = $('<img>')
            .addClass('OxFlag')
            .attr({
                src: type == 'map'
                    ? Ox.getImageByGeoname('icon', 16, '')
                    : '/static/png/icon16.png'
            })
            .css({float: 'left', margin: '4px'}),

        $itemLabel = Ox.Label({
                textAlign: 'center',
                title: '',
                width: 96 + Ox.UI.SCROLLBAR_SIZE
            })
            .css({float: 'left', margin: '4px 0 4px 0'})
            .bindEvent({
                singleclick: function() {
                    $element[type == 'map' ? 'panToPlace' : 'panToEvent']();
                },
                doubleclick: function() {
                    $element[type == 'map' ? 'zoomToPlace' : 'zoomToEvent']();
                }
            }),

        $itemButton = Ox.Button({
                title: 'close',
                type: 'image'
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                click: function() {
                    $element.options({selected: null});
                    updateStatusbar(0);
                }
            }),

        $item = $('<div>')
            .append($itemIcon)
            .append($itemLabel)
            .append($itemButton),

        $toolbar = Ox.Bar({size: 24})
            .append($item),

        $list = pandora.ui.clipList(videoRatio)
            .bindEvent({
                init: function(data) {
                    updateStatusbar(data.items);
                }
            }),

        $status = $('<div>')
            .css({
                width: '100%',
                marginTop: '2px',
                fontSize: '9px',
                textAlign: 'center',
                textOverflow: 'ellipsis'
            }),

        $statusbar = Ox.Bar({size: 16}).append($status),

        $listPanel = Ox.SplitPanel({
            elements: [
                {
                    element: $toolbar,
                    size: 24
                },
                {
                    element: $list
                },
                {
                    element: $statusbar,
                    size: 16
                }
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                resizeToolbar(data.size);
                $list.size();
            },
            resizeend: function(data) {
                var size = data.size;
                if (listSizes.indexOf(size) == -1) {
                    if (size <= (listSizes[0] + listSizes[1]) / 2) {
                        size = listSizes[0];
                    } else if (size < (listSizes[1] + listSizes[2]) / 2) {
                        size = listSizes[1];
                    } else {
                        size = listSizes[2];
                    }
                    that.size(1, size, function() {
                        // strangely, the animation may still not be fully
                        // finished, causing the list size to be off by one
                        setTimeout(function() {
                            $element['resize' + Ox.toTitleCase(type)]();
                            resizeToolbar(size);
                            $list.size();
                        }, 0);
                    });
                }
                pandora.UI.set({clipsColumns: listSizes.indexOf(size) + 1});
            }
        }),

        that = Ox.SplitPanel({
            elements: [
                {
                    element: $element,
                },
                {
                    element: $listPanel,
                    resizable: true,
                    resize: listSizes,
                    size: listSize,
                    tooltip: 'clips'
                }
            ],
            orientation: 'horizontal'
        });

    if (type == 'map') {

        that.replaceElement(0,
            $element = Ox.Map({
                find: ui.mapFind,
                // 20 menu + 24 toolbar + 1 resizebar + 16 statusbar
                height: window.innerHeight - ui.showGroups * ui.groupsSize - 61,
                places: function(data, callback) {
                    var itemQuery;
                    if (!ui.item) {
                        itemQuery = ui.find;
                    } else {
                        itemQuery = {
                            conditions: [{key: 'id', value: ui.item, operator: '=='}],
                            operator: '&'
                        };
                    }
                    return pandora.api.findPlaces(Ox.extend({
                        itemQuery: itemQuery
                    }, data), callback);
                },
                selected: ui.mapSelection,
                showTypes: true,
                toolbar: true,
                width: window.innerWidth - ui.showSidebar * ui.sidebarSize - listSize - 2,
                zoombar: true
            })
            .bindEvent({
                resize: function() {
                    $element.resizeMap();
                },
                selectplace: selectItem
            })
        );
        
    } else {

        pandora.api.findEvents({
            itemQuery: ui.find,
            keys: ['id', 'name', 'start', 'end'],
            query: {}
        }, function(result) {
            that.replaceElement(0,
                $element = Ox.Calendar({
                    date: new Date(0),
                    events: result.data.items,
                    // 20 px menu, 24 px toolbar, 1px resizbar, 16px statusbar
                    height: window.innerHeight - ui.showGroups * ui.groupsSize - 61,
                    range: [-5000, 5000],
                    width: window.innerWidth - ui.showSidebar * ui.sidebarSize - listSize - 2,
                    zoom: 4
                })
                .bindEvent({
                    resize: function(data) {
                        $element.resizeCalendar();
                    },
                    select: selectItem
                })
            );
        }); 

    }

    resizeToolbar(listSize);
    updateToolbar();
    updateStatusbar();

    function resizeToolbar(width) {
        $itemLabel.options({width: width - 48});
    }

    function selectItem(data) {
        var id = data.id || '';
        updateToolbar(id ? data : null);
        if (id && id[0] != '_') {
            $status.html('loading...');
            $list.options({
                items: function(data, callback) {
                    var itemQuery;
                    if (!ui.item) {
                        itemQuery = ui.find;
                    } else {
                        itemQuery = {
                            conditions: [{key: 'id', value: ui.item, operator: '=='}],
                            operator: '&'
                        };
                    }
                    return pandora.api.findClips(Ox.extend({
                        itemQuery: itemQuery,
                        query: {
                            conditions: [{key: itemName, value: id, operator:'=='}],
                            operator: '&'
                        },
                    }, data), callback);
                }
            });
        } else {
            $list.options({
                items: function(data, callback) {
                    callback({data: {items: data.keys ? [] : 0}});
                }
            });
        }
    }

    function updateStatusbar(items) {
        $status.html(
            (items ? Ox.formatNumber(items) : 'No')
            + ' clip' + (items == 1 ? '' : 's')
        );
    }

    function updateToolbar(item) {
        type == 'map' && $itemIcon.attr({
            src: Ox.getImageByGeoname('icon', 16, item ? item.geoname : '')
        });
        $itemLabel.options({
            title: item ? item.name : 'No ' + itemName
        });
        $itemButton.options({disabled: !item});
    }

    that.bindEvent({
        pandora_itemsort: function(data) {
            ui.item && $list.options({sort: data.value});
        },
        pandora_listsort: function(data) {
            !ui.item && $list.options({sort: data.value});
        }
    });

    if (type == 'map') {
        pandora.user.ui.mapFind = '';
        pandora.user.ui.mapSelection = '';
    }

    // fixme: this is needed for some resize handlers further up
    pandora.$ui[type] = $element;

    return that;

};