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
                    element: app.$ui.map = Ox.Map({
                        height: window.innerHeight - app.user.ui.showGroups * app.user.ui.groupsSize - 61,
                        places: function(data, callback) {
                            return pandora.api.findPlaces($.extend({
                                query: {conditions: [], operator: ''}
                            }, data), callback);
                        },
                        showTypes: true,
                        toolbar: true,
                        width: window.innerWidth - app.user.ui.showSidebar * app.user.ui.sidebarSize - 2 - 144 - Ox.UI.SCROLLBAR_SIZE,
                    })
                },
                {
                    element: new Ox.Element(),
                    id: 'place',
                    size: 144 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent('resize', function() {
            app.$ui.map.resizeMap();
        });
    } else if (view == 'calendar') {
        that = new Ox.SplitPanel({
            elements: [
                {
                    element: app.$ui.calendar = Ox.Calendar({
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
                        height: window.innerHeight - app.user.ui.showGroups * app.user.ui.groupsSize - 61,
                        range: [-5000, 5000],
                        width: window.innerWidth - app.user.ui.showSidebar * app.user.ui.sidebarSize - 2 - 144 - Ox.UI.SCROLLBAR_SIZE,
                        zoom: 4
                    })
                },
                {
                    element: new Ox.Element(),
                    id: 'place',
                    size: 144 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent('resize', function() {

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

