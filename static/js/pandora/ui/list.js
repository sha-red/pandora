// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.list = function(view) { // fixme: remove view argument
    var that, $map;
    //Ox.print('constructList', view);
    if (view == 'list') {
        /*
        keys = Ox.unique($.merge(
            $.map(pandora.user.ui.lists[pandora.user.ui.list].columns, function(id) {
                return Ox.getObjectById(pandora.site.sortKeys, id);
            }),
            pandora.site.sortKeys
        ));
        Ox.print('$$$$', keys)
        */
        that = Ox.TextList({
            columns: $.map(pandora.site.sortKeys, function(key, i) {
                var position = pandora.user.ui.lists[pandora.user.ui.list].columns.indexOf(key.id);
                return {
                    align: ['string', 'text'].indexOf(
                        Ox.isArray(key.type) ? key.type[0]: key.type
                    ) > -1 ? 'left' : 'right',
                    defaultWidth: key.columnWidth,
                    format: key.format,
                    id: key.id,
                    operator: pandora.getSortOperator(key.id),
                    position: position,
                    removable: !key.columnRequired,
                    title: key.title,
                    type: key.type,
                    unique: key.id == 'id',
                    visible: position > -1,
                    width: pandora.user.ui.lists[pandora.user.ui.list].columnWidth[key.id] || key.columnWidth
                };
            }),
            columnsMovable: true,
            columnsRemovable: true,
            columnsResizable: true,
            columnsVisible: true,
            id: 'list',
            items: function(data, callback) {
                //Ox.print('data, pandora.Query.toObject', data, pandora.Query.toObject())
                pandora.api.find($.extend(data, {
                    query: pandora.Query.toObject()
                }), callback);
            },
            scrollbarVisible: true,
            sort: pandora.user.ui.lists[pandora.user.ui.list].sort
        })
        .bindEvent({
            columnchange: function(event, data) {
                var columnWidth = {};
                pandora.UI.set(['lists', pandora.user.ui.list, 'columns'].join('|'), data.ids);
                /*
                data.ids.forEach(function(id) {
                    columnWidth[id] = 
                        pandora.user.ui.lists[pandora.user.ui.list].columnWidth[id] ||
                        Ox.getObjectById(pandora.site.sortKeys, id).width
                });
                pandora.UI.set(['lists', pandora.user.ui.list, 'columnWidth'].join('|'), columnWidth);
                */
            },
            columnresize: function(event, data) {
                pandora.UI.set(['lists', pandora.user.ui.list, 'columnWidth', data.id].join('|'), data.width);
            },
            resize: function(event, data) { // this is the resize event of the split panel
                that.size();
            },
            sort: function(event, data) {
                pandora.UI.set(['lists', pandora.user.ui.list, 'sort'].join('|'), [data]);
            }
        });
    } else if (view == 'icons') {
        that = Ox.IconList({
            id: 'list',
            item: function(data, sort, size) {
                var ratio = data.poster.width / data.poster.height;
                size = size || 128;
                return {
                    height: ratio <= 1 ? size : size / ratio,
                    id: data['id'],
                    info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
                    title: data.title + (data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
                    url: data.poster.url.replace(/jpg/, size + '.jpg'),
                    width: ratio >= 1 ? size : size * ratio
                };
            },
            items: function(data, callback) {
                //Ox.print('data, pandora.Query.toObject', data, pandora.Query.toObject())
                pandora.api.find($.extend(data, {
                    query: pandora.Query.toObject()
                }), callback);
            },
            keys: ['director', 'id', 'poster', 'title', 'year'],
            size: 128,
            sort: pandora.user.ui.lists[pandora.user.ui.list].sort,
            unique: 'id'
        });
    } else if (view == 'info') {
        that = Ox.Element().css({margin: '16px'}).html(view + ' results view still missing.');
    } else if (view == 'clips') {
        that = Ox.Element().css({margin: '16px'}).html(view + ' results view still missing.');
    } else if (view == 'timelines') {
        that = Ox.Element().css({margin: '16px'}).html(view + ' results view still missing.');
    } else if (view == 'maps') {
        that = Ox.Element().css({margin: '16px'}).html(view + ' results view still missing.');
    } else if (view == 'calendars') {
        that = Ox.Element().css({margin: '16px'}).html(view + ' results view still missing.');
    } else if (view == 'clip') {
        that = Ox.IconList({
            item: function(data, sort, size) {
                size = size || 128;
                var ratio = data.aspectRatio,
                    width = size,
                    height = size/ratio,
                    url = '/' + data.item + '/frame/' + size + '/'+data['in'] + '.jpg';
                return {
                    height: height,
                    id: data['id'],
                    info: Ox.formatDuration(data['in'], 'short') +' - '+ Ox.formatDuration(data['out'], 'short'),
                    title: data.value,
                    url: url,
                    width: width
                };
            },
            items: function(data, callback) {
                var itemQuery = pandora.Query.toObject(),
                    query = {conditions:[]};
                //fixme: can this be in pandora.Query? dont just check for subtitles
                itemQuery.conditions.forEach(function(q) {
                    if(q.key == 'subtitles') {
                        query.conditions.push({key: 'value', value: q.value, operator: q.operator});
                    }
                });
                pandora.api.findAnnotations($.extend(data, {
                    query: query,
                    itemQuery: itemQuery
                }), callback);
            },
            keys: ['id', 'value', 'in', 'out', 'aspectRatio', 'item'],
            size: 128,
            sort: pandora.user.ui.lists[pandora.user.ui.list].sort,
            unique: 'id'
        }).bindEvent({
            open: function(event, data) {
                var id = data.ids[0],
                    item = that.value(id, 'item'),
                    position = that.value(id, 'in');
                pandora.UI.set('videoPosition|' + item, position);
                pandora.URL.set(item + '/timeline');
            }
        });
    } else if (view == 'map') {
        that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.map = Ox.Map({
                        height: window.innerHeight - pandora.user.ui.showGroups * pandora.user.ui.groupsSize - 61,
                        places: function(data, callback) {
                            var itemQuery = pandora.Query.toObject(),
                                query = {conditions:[]};
                            return pandora.api.findPlaces($.extend(data, {
                                itemQuery: itemQuery,
                                query: query
                            }), callback);
                        },
                        showTypes: true,
                        toolbar: true,
                        width: window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 2 - 144 - Ox.UI.SCROLLBAR_SIZE,
                    }).bindEvent({
                        selectplace: function(event, place) {
                            if(place && place.id[0] != '_') {
                                pandora.$ui.clips.options({
                                    items: function(data, callback) {
                                        return pandora.api.findAnnotations($.extend(data, {
                                            query: {
                                                conditions:[{key: 'place', value: place.id, operator:'='}]
                                            },
                                            itemQuery: pandora.Query.toObject()
                                        }), callback);
                                    }
                                });
                            } else {
                                pandora.$ui.clips.options({
                                    items: []
                                });
                            }
                        }
                    })
                },
                {
                    element: pandora.$ui.clips = Ox.IconList({
                        item: function(data, sort, size) {
                            size = size || 128;
                            var ratio = data.aspectRatio,
                                width = size,
                                height = size/ratio,
                                url = '/' + data.item + '/frame/' + size + '/'+data['in'] + '.jpg';
                            return {
                                height: height,
                                id: data['id'],
                                info: Ox.formatDuration(data['in'], 'short') +' - '+ Ox.formatDuration(data['out'], 'short'),
                                title: data.value,
                                url: url,
                                width: width
                            };
                        },
                        items: [],
                        keys: ['id', 'value', 'in', 'out', 'aspectRatio', 'item'],
                        size: 128,
                        sort: pandora.user.ui.lists[pandora.user.ui.list].sort,
                        unique: 'id'
                    }).bindEvent({
                        open: function(event, data) {
                            var id = data.ids[0],
                                item = pandora.$ui.clips.value(id, 'item'),
                                position = pandora.$ui.clips.value(id, 'in');
                            pandora.UI.set('videoPosition|' + item, position);
                            pandora.URL.set(item + '/timeline');
                        }
                    }),
                    id: 'place',
                    size: 144 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent('resize', function() {
            pandora.$ui.map.resizeMap();
        });
    } else if (view == 'calendar') {
        that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.calendar = Ox.Calendar({
                        date: new Date(0),
                        events: [
                            {name: 'Thirty Years\' War', start: '1618', end: '1648', type: 'other'},
                            {name: 'American Civil War', start: '1861-04-12', end: '1865-04-09', type: 'other'},
                            {name: 'Franco-Prussian War', start: '1870-07-19', end: '1871-05-10', type: 'other'},
                            {name: 'World War One', start: '1914-07-28', end: '1918-11-11', type: 'other'},
                            {name: 'World War Two', start: '1939-09-01', end: '1945-09-02', type: 'other'},
                            {name: 'Cold War', start: '1947', end: '1991', type: 'other'},
                            {name: 'Korean War', start: '1950-06-25', end: '1953-07-27', type: 'other'},
                            {name: 'Algerian War', start: '1954-11-01', end: '1962-03-19', type: 'other'},
                            {name: 'Vietnam War', start: '1955-11-01', end: '1975-04-30', type: 'other'},
                            {name: 'Six-Day War', start: '1967-06-05', end: '1967-06-11', type: 'other'},
                            {name: 'Iran-Iraq War', start: '1980-09-22', end: '1988-08-20', type: 'other'},
                            {name: 'Gulf War', start: '1990-08-02', end: '1991-02-28', type: 'other'}
                        ],
                        height: window.innerHeight - pandora.user.ui.showGroups * pandora.user.ui.groupsSize - 61,
                        range: [-5000, 5000],
                        width: window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 2 - 144 - Ox.UI.SCROLLBAR_SIZE,
                        zoom: 4
                    })
                },
                {
                    element: Ox.Element(),
                    id: 'place',
                    size: 144 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent('resize', function() {

        });
    } else {
        $list = Ox.Element('<div>')
            .css({
                width: '100px',
                height: '100px',
                background: 'red'
            });
    }

    ['list', 'icons'].indexOf(view) > -1 && that.bind({
        dragstart: function(e) {
            pandora.$ui.folderList.forEach(function($list, i) {
                $list.addClass('OxDrop');
            });
        },
        dragend: function(e) {
            pandora.$ui.folderList.forEach(function($list, i) {
                $list.removeClass('OxDrop');
            });
        }
    }).bindEvent({
        closepreview: function(event, data) {
            pandora.$ui.previewDialog.close();
            delete pandora.$ui.previewDialog;
        },
        copy: function(event, data) {
            Ox.Clipboard.copy({
                items: data.ids,
                text: $.map(data.ids, function(id) {
                    return pandora.$ui.list.value(id, 'title');
                }).join('\n')
            });
        },
        'delete': function(event, data) {
            pandora.getListData().editable && pandora.api.removeListItems({
                list: pandora.user.ui.list,
                items: data.ids
            }, pandora.reloadList);
        },
        init: function(event, data) {
            pandora.$ui.total.html(pandora.ui.status('total', data));
            data = [];
            $.each(pandora.site.totals, function(i, v) {
                data[v.id] = 0;
            });
            pandora.$ui.selected.html(pandora.ui.status('selected', data));
        },
        open: function(event, data) {
            var id = data.ids[0],
                title = that.value(id, 'title');
            pandora.URL.set(title, id);
        },
        openpreview: function(event, data) {
            pandora.requests.preview && pandora.api.cancel(pandora.requests.preview);
            pandora.requests.preview = pandora.api.find({
                keys: ['director', 'id', 'poster', 'title'],
                query: {
                    conditions: $.map(data.ids, function(id, i) {
                        return {
                            key: 'id',
                            value: id,
                            operator: '='
                        }
                    }),
                    operator: '|'
                }
            }, function(result) {
                var documentHeight = pandora.$ui.document.height(),
                    item = result.data.items[0],
                    title = item.title + (item.director ? ' (' + item.director + ')' : ''),
                    dialogHeight = documentHeight - 100,
                    dialogWidth;
                pandora.site.previewRatio = item.poster.width / item.poster.height,
                dialogWidth = parseInt((dialogHeight - 48) * pandora.site.previewRatio);
                if ('previewDialog' in pandora.$ui) {
                    pandora.$ui.previewDialog.options({
                        title: title
                    });
                    pandora.$ui.previewImage.animate({
                        opacity: 0
                    }, 100, function() {
                        pandora.$ui.previewDialog.size(dialogWidth, dialogHeight, function() {
                            pandora.$ui.previewImage
                                .attr({
                                    src: item.poster.url
                                })
                                .one('load', function() {
                                    pandora.$ui.previewImage
                                        .css({
                                            width: dialogWidth + 'px',
                                            height: (dialogHeight - 48 - 2) + 'px', // fixme: why -2 ?
                                            opacity: 0
                                        })
                                        .animate({
                                            opacity: 1
                                        }, 100);
                                });
                        });
                    });
                    //Ox.print(pandora.$ui.document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
                } else {
                    pandora.$ui.previewImage = $('<img>')
                        .attr({
                            src: item.poster.url
                        })
                        .css({
                            position: 'absolute',
                            width: dialogWidth + 'px',
                            height: (dialogHeight - 48 - 2) + 'px', // fixme: why -2 ?
                            left: 0,
                            top: 0,
                            right: 0,
                            bottom: 0,
                            margin: 'auto',
                        });
                    pandora.$ui.previewDialog = Ox.Dialog({
                            buttons: [
                                Ox.Button({
                                    title: 'Close',
                                }).bindEvent({
                                    click: function() {
                                        pandora.$ui.previewDialog.close();
                                        delete pandora.$ui.previewDialog;
                                        pandora.$ui.list.closePreview();
                                    }
                                })
                            ],
                            content: pandora.$ui.previewImage,
                            height: dialogHeight,
                            id: 'previewDialog',
                            minHeight: pandora.site.previewRatio >= 1 ? 128 / pandora.site.previewRatio + 48 : 176,
                            minWidth: pandora.site.previewRatio >= 1 ? 128 : 176 * pandora.site.previewRatio,
                            padding: 0,
                            title: title,
                            width: dialogWidth
                        })
                        .bindEvent('resize', function(event, data) {
                            var dialogRatio = data.width / (data.height - 48),
                                height, width;
                            if (dialogRatio < pandora.site.previewRatio) {
                                width = data.width;
                                height = width / pandora.site.previewRatio;
                            } else {
                                height = (data.height - 48 - 2);
                                width = height * pandora.site.previewRatio;
                            }
                            pandora.$ui.previewImage.css({
                                width: width + 'px',
                                height: height + 'px', // fixme: why -2 ?
                            })
                        })
                        .open();
                    //pandora.$ui.previewImage = $image;
                    //Ox.print(pandora.$document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
                }
            });
        },
        paste: function(event, data) {
            data.items && pandora.getListData().editable && pandora.api.addListItems({
                list: pandora.user.ui.list,
                items: data.items
            }, pandora.reloadList);
        },
        select: function(event, data) {
            var $still, $timeline;
            pandora.user.selectedMovies = data.ids;
            if (data.ids.length) {
                pandora.$ui.mainMenu.enableItem('copy');
                pandora.$ui.mainMenu.enableItem('openmovie');
            } else {
                pandora.$ui.mainMenu.disableItem('copy');
                pandora.$ui.mainMenu.disableItem('openmovie');            
            }
            if (data.ids.length == 1) {
                pandora.api.getItem(data.ids[0], function(result) {
                    pandora.user.infoRatio = result.data.stream.aspectRatio;
                    var height = pandora.$ui.info.width() / pandora.user.infoRatio + 16;
                    if(pandora.$ui.infoStill) pandora.$ui.infoStill.removeElement();
                    pandora.$ui.infoStill = pandora.ui.flipbook(data.ids[0])
                                                  .appendTo(pandora.$ui.info.$element);
                    pandora.$ui.infoStill.css({
                       'height': (height - 16) + 'px'
                    });
                    !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -height});
                    pandora.$ui.leftPanel.size(2, height);
                    pandora.$ui.info.animate({
                        height: height + 'px'
                    }, 250, function() {
                        pandora.resizeFolders();
                    });
                });
                pandora.$ui.infoTimeline.attr('src', '/'+data.ids[0]+'/timeline.16.png')
            }
            pandora.api.find({
                query: {
                    conditions: $.map(data.ids, function(id, i) {
                        return {
                            key: 'id',
                            value: id,
                            operator: '='
                        }
                    }),
                    operator: '|'
                }
            }, function(result) {
                pandora.$ui.selected.html(pandora.ui.status('selected', result.data));
            });
        },
        sort: function(event, data) {
            /* some magic has already set user.ui.sort
            Ox.print(':', user.ui.sort[0])
            if (data.key != user.ui.sort[0].key) {
                pandora.$ui.mainMenu.checkItem('sort_sortmovies_' + data.key);
            }
            if (data.operator != user.ui.sort[0].operator) {
                pandora.$ui.mainMenu.checkItem('sort_ordermovies_' + data.operator === '' ? 'ascending' : 'descending');
            }
            user.ui.sort[0] = data;
            */
            pandora.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + data.key);
            pandora.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (data.operator === '' ? 'ascending' : 'descending'));
        }
    });
    that.display = function() { // fixme: used?
        pandora.$ui.rightPanel.replaceElement(1, pandora.$ui.contentPanel = pandora.ui.contentPanel());
    };
    return that;
};

