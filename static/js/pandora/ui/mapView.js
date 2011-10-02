// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.mapView = function(videoRatio) {

    var ui = pandora.user.ui,

        listSizes = [
            144 + Ox.UI.SCROLLBAR_SIZE,
            280 + Ox.UI.SCROLLBAR_SIZE,
            416 + Ox.UI.SCROLLBAR_SIZE
        ],
        listSize = listSizes[ui.clipsColumns - 1],

        $map = Ox.Map({
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
                $map.resizeMap();
            },
            selectplace: function(data) {
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
                            return pandora.api.findAnnotations(Ox.extend({
                                itemQuery: itemQuery,
                                query: {
                                    conditions: [{key: 'place', value: id, operator:'=='}],
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
        }),

        $placeFlag = $('<img>')
            .addClass('OxFlag')
            .attr({
                src: Ox.getImageByGeoname('icon', 16, '')
            })
            .css({float: 'left', margin: '4px'}),

        $placeName = Ox.Label({
                textAlign: 'center',
                title: '',
                width: 96 + Ox.UI.SCROLLBAR_SIZE
            })
            .css({float: 'left', margin: '4px 0 4px 0'}),

        $placeButton = Ox.Button({
                title: 'close',
                type: 'image'
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                click: function() {
                    $map.options({selected: null});
                    updateStatusbar(0);
                }
            }),

        $place = $('<div>')
            .append($placeFlag)
            .append($placeName)
            .append($placeButton),

        $toolbar = Ox.Bar({size: 24})
            .append($place),

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
                        $map.resizeMap();
                        resizeToolbar(size);
                        // strangely, the animation may still not be fully
                        // finished, causing the list size to be off by one
                        setTimeout($list.size, 0);
                    });
                }
                pandora.UI.set({clipsColumns: listSizes.indexOf(size) + 1});
            }
        }),

        that = Ox.SplitPanel({
            elements: [
                {
                    element: $map,
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

    resizeToolbar(listSize);
    updateToolbar();
    updateStatusbar();

    function resizeToolbar(width) {
        $placeName.options({width: width - 48});
    }

    function updateStatusbar(items) {
        $status.html(
            (items ? Ox.formatNumber(items) : 'No')
            + ' clip' + (items == 1 ? '' : 's')
        );
    }

    function updateToolbar(place) {
        $placeFlag.attr({
            src: Ox.getImageByGeoname('icon', 16, place ? place.geoname : '')
        });
        $placeName.options({title: place ? place.name : 'No place'});
        $placeButton.options({disabled: !place});
    }

    that.bindEvent({
        pandora_itemsort: function(data) {
            ui.item && $list.options({sort: data.value});
        },
        pandora_listsort: function(data) {
            !ui.item && $list.options({sort: data.value});
        }
    });

    pandora.user.ui.mapFind = '';
    pandora.user.ui.mapSelection = '';

    // fixme: this is needed for some resize handlers further up
    pandora.$ui.map = $map;

    return that;

};