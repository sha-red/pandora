// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.list = function(view) { // fixme: remove view argument
    var that, $map;
    //Ox.print('constructList', view);
    if (view == 'list') {
        /*
        keys = Ox.unique($.merge(
            $.map(app.user.ui.lists[app.user.ui.list].columns, function(id) {
                return Ox.getObjectById(app.site.sortKeys, id);
            }),
            app.site.sortKeys
        ));
        Ox.print('$$$$', keys)
        */
        that = new Ox.TextList({
            columns: $.map(app.ui.sortKeys, function(key, i) {
                var position = app.user.ui.lists[app.user.ui.list].columns.indexOf(key.id);
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
                    width: app.user.ui.lists[app.user.ui.list].columnWidth[key.id] || key.columnWidth
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
            sort: app.user.ui.lists[app.user.ui.list].sort
        })
        .bindEvent({
            columnchange: function(event, data) {
                var columnWidth = {}
                pandora.UI.set(['lists', app.user.ui.list, 'columns'].join('|'), data.ids);
                /*
                data.ids.forEach(function(id) {
                    columnWidth[id] = 
                        app.user.ui.lists[app.user.ui.list].columnWidth[id] ||
                        Ox.getObjectById(app.ui.sortKeys, id).width
                });
                pandora.UI.set(['lists', app.user.ui.list, 'columnWidth'].join('|'), columnWidth);
                */
            },
            columnresize: function(event, data) {
                pandora.UI.set(['lists', app.user.ui.list, 'columnWidth', data.id].join('|'), data.width);
            },
            resize: function(event, data) { // this is the resize event of the split panel
                that.size();
            },
            sort: function(event, data) {
                pandora.UI.set(['lists', app.user.ui.list, 'sort'].join('|'), [data]);
            }
        });
    } else if (view == 'icons') {
        that = new Ox.IconList({
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
            sort: app.user.ui.lists[app.user.ui.list].sort,
            unique: 'id'
        })
    } else if (view == 'map') {
        that = new Ox.SplitPanel({
            elements: [
                {
                    element: new Ox.SplitPanel({
                        elements: [
                            {
                                element: new Ox.Toolbar({
                                        orientation: 'horizontal',
                                        size: 24
                                    })
                                    .append(
                                        app.$ui.findMapInput = new Ox.Input({
                                            clear: true,
                                            id: 'findMapInput',
                                            placeholder: 'Find on Map',
                                            width: 192
                                        })
                                        .css({
                                            float: 'right',
                                            margin: '4px'
                                        })
                                        .bindEvent({
                                            submit: function(event, data) {
                                                app.$ui.map.find(data.value, function(data) {
                                                    app.$ui.mapStatusbar.html(data.geoname + ' ' + JSON.stringify(data.points))
                                                });
                                            }
                                        })
                                    ),
                                size: 24
                            },
                            {
                                element: app.$ui.map = new Ox.Map({
                                        places: [
                                            {
                                                geoname: 'Beirut, Lebanon',
                                                name: 'Beirut',
                                                points: {
                                                    'center': [33.8886284, 35.4954794],
                                                    'northeast': [33.8978909, 35.5114868],
                                                    'southwest': [33.8793659, 35.479472]
                                                }
                                            },
                                            {
                                                geoname: 'Berlin, Germany',
                                                name: 'Berlin',
                                                points: {
                                                    'center': [52.506701, 13.4246065],
                                                    'northeast': [52.675323, 13.760909],
                                                    'southwest': [52.338079, 13.088304]
                                                }
                                            },
                                            {
                                                geoname: 'Mumbai, Maharashtra, India',
                                                name: 'Bombay',
                                                points: {
                                                    'center': [19.07871865, 72.8778187],
                                                    'northeast': [19.2695223, 72.9806562],
                                                    'southwest': [18.887915, 72.7749812]
                                                }
                                            }
                                        ]
                                    })
                                    .bindEvent({                                
                                        select: function(event, data) {
                                            app.$ui.mapStatusbar.html(data.geoname + ' ' + JSON.stringify(data.points))
                                        }
                                    }),
                                id: 'map',
                                size: 'auto'
                            },
                            {
                                element: app.$ui.mapStatusbar = new Ox.Toolbar({
                                        orientation: 'horizontal',
                                        size: 16
                                    })
                                    .css({
                                        fontSize: '9px',
                                        padding: '2px 4px 0 0',
                                        textAlign: 'right'
                                    }),
                                size: 16
                            }
                        ],
                        orientation: 'vertical'
                    }),
                },
                {
                    element: new Ox.Element(),
                    id: 'place',
                    size: 128 + 16 + 12
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent('resize', function() {
            app.$ui.map.resize();
        });
    } else {
        $list = new Ox.Element('<div>')
            .css({
                width: '100px',
                height: '100px',
                background: 'red'
            });
    }

    ['list', 'icons'].indexOf(view) > -1 && that.bind({
        dragstart: function(e) {
            app.$ui.folderList.forEach(function($list, i) {
                $list.addClass('OxDrop');
            });
        },
        dragend: function(e) {
            app.$ui.folderList.forEach(function($list, i) {
                $list.removeClass('OxDrop');
            });
        },
    }).bindEvent({
        closepreview: function(event, data) {
            app.$ui.previewDialog.close();
            delete app.$ui.previewDialog;
        },
        copy: function(event, data) {
            Ox.Clipboard.copy({
                items: data.ids,
                text: $.map(data.ids, function(id) {
                    return app.$ui.list.value(id, 'title');
                }).join('\n')
            });
        },
        'delete': function(event, data) {
            getListData().editable && pandora.api.removeListItems({
                list: app.user.ui.list,
                items: data.ids
            }, reloadList);
        },
        init: function(event, data) {
            app.$ui.total.html(pandora.ui.status('total', data));
            data = [];
            $.each(app.site.totals, function(i, v) {
                data[v.id] = 0;
            });
            app.$ui.selected.html(pandora.ui.status('selected', data));
        },
        open: function(event, data) {
            var id = data.ids[0],
                title = that.value(id, 'title');
            pandora.URL.set(title, id);
        },
        openpreview: function(event, data) {
            app.requests.preview && pandora.api.cancel(app.requests.preview);
            app.requests.preview = pandora.api.find({
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
                var documentHeight = app.$ui.document.height(),
                    item = result.data.items[0],
                    title = item.title + (item.director ? ' (' + item.director + ')' : ''),
                    dialogHeight = documentHeight - 100,
                    dialogWidth;
                app.ui.previewRatio = item.poster.width / item.poster.height,
                dialogWidth = parseInt((dialogHeight - 48) * app.ui.previewRatio);
                if ('previewDialog' in app.$ui) {
                    app.$ui.previewDialog.options({
                        title: title
                    });
                    app.$ui.previewImage.animate({
                        opacity: 0
                    }, 100, function() {
                        app.$ui.previewDialog.size(dialogWidth, dialogHeight, function() {
                            app.$ui.previewImage
                                .attr({
                                    src: item.poster.url
                                })
                                .one('load', function() {
                                    app.$ui.previewImage
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
                    //Ox.print(app.$ui.document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
                } else {
                    app.$ui.previewImage = $('<img>')
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
                    app.$ui.previewDialog = new Ox.Dialog({
                            buttons: [
                                new Ox.Button({
                                    title: 'Close',
                                }).bindEvent({
                                    click: function() {
                                        app.$ui.previewDialog.close();
                                        delete app.$ui.previewDialog;
                                        app.$ui.list.closePreview();
                                    }
                                })
                            ],
                            content: app.$ui.previewImage,
                            height: dialogHeight,
                            id: 'previewDialog',
                            minHeight: app.ui.previewRatio >= 1 ? 128 / app.ui.previewRatio + 48 : 176,
                            minWidth: app.ui.previewRatio >= 1 ? 128 : 176 * app.ui.previewRatio,
                            padding: 0,
                            title: title,
                            width: dialogWidth
                        })
                        .bindEvent('resize', function(event, data) {
                            var dialogRatio = data.width / (data.height - 48),
                                height, width;
                            if (dialogRatio < app.ui.previewRatio) {
                                width = data.width;
                                height = width / app.ui.previewRatio;
                            } else {
                                height = (data.height - 48 - 2);
                                width = height * app.ui.previewRatio;
                            }
                            app.$ui.previewImage.css({
                                width: width + 'px',
                                height: height + 'px', // fixme: why -2 ?
                            })
                        })
                        .open();
                    //app.$ui.previewImage = $image;
                    //Ox.print(app.$document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
                }
            });
        },
        paste: function(event, data) {
            data.items && getListData().editable && pandora.api.addListItems({
                list: app.user.ui.list,
                items: data.items
            }, reloadList);
        },
        select: function(event, data) {
            var $still, $timeline;
            app.ui.selectedMovies = data.ids;
            if (data.ids.length) {
                app.$ui.mainMenu.enableItem('copy');
                app.$ui.mainMenu.enableItem('openmovie');
            } else {
                app.$ui.mainMenu.disableItem('copy');
                app.$ui.mainMenu.disableItem('openmovie');            
            }
            if (data.ids.length == 1) {
                pandora.api.getItem(data.ids[0], function(result) {
                    app.ui.infoRatio = result.data.stream.aspectRatio;
                    var height = app.$ui.info.width() / app.ui.infoRatio + 16;
                    if(app.$ui.infoStill) app.$ui.infoStill.removeElement();
                    app.$ui.infoStill = pandora.ui.flipbook(data.ids[0])
                                                  .appendTo(app.$ui.info.$element);
                    app.$ui.infoStill.css({
                       'height': (height - 16) + 'px'
                    });
                    !app.user.ui.showInfo && app.$ui.leftPanel.css({bottom: -height});
                    app.$ui.leftPanel.size(2, height);
                    app.$ui.info.animate({
                        height: height + 'px'
                    }, 250, function() {
                        pandora.resizeFolders();
                    });
                });
                app.$ui.infoTimeline.attr('src', '/'+data.ids[0]+'/timeline.16.png')
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
                app.$ui.selected.html(pandora.ui.status('selected', result.data));
            });
        },
        sort: function(event, data) {
            /* some magic has already set user.ui.sort
            Ox.print(':', user.ui.sort[0])
            if (data.key != user.ui.sort[0].key) {
                app.$ui.mainMenu.checkItem('sort_sortmovies_' + data.key);
            }
            if (data.operator != user.ui.sort[0].operator) {
                app.$ui.mainMenu.checkItem('sort_ordermovies_' + data.operator === '' ? 'ascending' : 'descending');
            }
            user.ui.sort[0] = data;
            */
            app.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + data.key);
            app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (data.operator === '' ? 'ascending' : 'descending'));
        }
    });
    that.display = function() { // fixme: used?
        app.$ui.rightPanel.replaceElement(1, app.$ui.contentPanel = pandora.ui.contentPanel());
    };
    return that;
};

