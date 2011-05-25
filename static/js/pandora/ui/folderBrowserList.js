// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.folderBrowserList = function(id) {
    var columnWidth = (app.user.ui.sidebarSize - Ox.UI.SCROLLBAR_SIZE - 88) / 2,
        i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id),
        that = new Ox.TextList({
            columns: [
                {
                    format: function() {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.PATH + 'png/icon16.png'
                            });
                    },
                    id: 'id',
                    operator: '+',
                    title: $('<img>')
                        .attr({
                            src: Ox.UI.PATH + 'png/icon16.png'
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px 2px 1px 2px',
                        }),
                    unique: true,
                    visible: true,
                    width: 16
                },
                {
                    id: 'user',
                    operator: '+',
                    title: 'User',
                    visible: true,
                    width: Math.floor(columnWidth)
                },
                {
                    id: 'name',
                    operator: '+',
                    title: 'List',
                    visible: true,
                    width: Math.ceil(columnWidth)
                },
                {
                    align: 'right',
                    id: 'items',
                    operator: '-',
                    title: 'Items',
                    visible: true,
                    width: 40
                },
                {
                    clickable: function(data) {
                        return data.type == 'smart';
                    },
                    format: function(value) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImagePath('symbolFind.svg')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px', // fixme: strange
                                opacity: value == 'static' ? 0.1 : 1
                            });
                    },
                    id: 'type',
                    operator: '+',
                    title: $('<img>')
                        .attr({
                            src: Ox.UI.getImagePath('symbolFind.svg')
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px 2px 1px 2px',
                        }),
                    visible: true,
                    width: 16
                },
                {
                    clickable: true,
                    format: function(value) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImagePath(
                                    'symbol' + (id == 'favorite' ? 'Check' : 'Star') + '.svg'
                                )
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px',
                                opacity: id == 'favorite' ? (value ? 1 : 0.1) :
                                (value == 'featured' ? 1 : 0.1)
                            });
                    },
                    id: id == 'favorite' ? 'subscribed' : 'status',
                    operator: '+',
                    title: $('<img>')
                        .attr({
                            src: Ox.UI.getImagePath(
                                'symbol' + (id == 'favorite' ? 'Check' : 'Star') + '.svg'
                            )
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px 2px 1px 2px'
                        }),
                    visible: true,
                    width: 16
                },
            ],
            columnsVisible: true,
            items: function(data, callback) {
                var query = id == 'favorite' ? {conditions: [
                    {key: 'user', value: app.user.username, operator: '!'},
                    {key: 'status', value: 'public', operator: '='}
                ], operator: '&'} : {conditions: [
                    {key: 'status', value: 'public', operator: '='},
                    {key: 'status', value: 'featured', operator: '='}
                ], operator: '|'};
                return pandora.api.findLists($.extend(data, {
                    query: query
                }), callback);
            },
            pageLength: 1000,
            // fixme: select if previously selected
            // selected: app.user.ui.list ? [app.user.ui.list] : [],
            sort: [
                {key: 'name', operator: '+'}
            ]
        })
        .bindEvent({
            click: function(event, data) {
                if (data.key == 'type') {
                    alert('...');
                } else if (data.key == 'subscribed') {
                    var subscribed = that.value(data.id, 'subscribed');
                    pandora.api[subscribed ? 'unsubscribeFromList' : 'subscribeToList']({
                        id: data.id,
                    }, function(result) {
                        that.value(data.id, 'subscribed', !subscribed);
                    });
                } else if (data.key == 'status') {
                    pandora.api.editList({
                        id: data.id,
                        status: that.value(data.id, 'status') == 'featured' ? 'public' : 'featured'
                    }, function(result) {
                        Ox.print('result', result)
                        if (result.data.user == app.user.username || result.data.subscribed) {
                            Ox.Request.clearCache(); // fixme: remove
                            app.$ui.folderList[
                                result.data.user == app.user.username ? 'personal' : 'favorite'
                            ].reloadList();
                        }
                        that.value(data.id, 'status', result.data.status);
                    });
                }
            },
            init: function(event, data) {
                app.ui.sectionFolders[app.user.ui.section][i].items = data.items;
                app.$ui.folder[i].$content.css({
                    height: 40 + data.items * 16 + 'px'
                });
                app.$ui.folderList[id].css({
                    height: 16 + data.items * 16 + 'px'
                });
                pandora.resizeFolders();
            },
            paste: function(event, data) {
                app.$ui.list.triggerEvent('paste', data);
            },
            select: function(event, data) {
                // fixme: duplicated
                if (data.ids.length) {
                    $.each(app.$ui.folderList, function(id_, $list) {
                        id != id_ && $list.options('selected', []);
                    });
                    pandora.UI.set({list: data.ids[0]});
                    pandora.URL.set('?find=list:' + data.ids[0]);
                } else {
                    pandora.UI.set({list: ''});
                    pandora.URL.set('');
                }
            }
        });
    return that;
};

pandora.ui.folderList = function(id) {
    var i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id),
        that;
    if (app.user.ui.section == 'site') {
        that = new Ox.TextList({
            columns: [
                {
                    format: function() {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.PATH + 'png/icon16.png'
                            })
                    },
                    id: 'id',
                    operator: '+',
                    unique: true,
                    visible: true,
                    width: 16
                },
                {
                    id: 'title',
                    operator: '+',
                    visible: true,
                    width: app.user.ui.sidebarSize - 16
                }
            ],
            items: function(data, callback) {
                var result = {data: {}};
                if (!data.range) {
                    result.data.items = Ox.getObjectById(app.ui.sectionFolders.site, id).items.length;
                } else {
                    result.data.items = Ox.getObjectById(app.ui.sectionFolders.site, id).items;
                }
                callback(result);
            },
            max: 1,
            min: 1,
            sort: [{key: '', operator: ''}]
        })
        .bindEvent({
            select: function(event, data) {
                // fixme: duplicated
                $.each(app.$ui.folderList, function(id_, $list) {
                    id != id_ && $list.options('selected', []);
                })
                pandora.URL.set((id == 'admin' ? 'admin/' : '' ) + data.ids[0]);
            },
        });
    } else if (app.user.ui.section == 'items') {
        that = new Ox.TextList({
            columns: [
                {
                    format: function() {
                        return $('<img>').attr({
                            src: Ox.UI.PATH + 'png/icon16.png'
                        });
                    },
                    id: 'user',
                    operator: '+',
                    visible: true,
                    width: 16
                },
                {
                    format: function(value) {
                        return value.split('/').join(': ');
                    },
                    id: 'id',
                    operator: '+',
                    unique: true,
                    visible: id == 'favorite',
                    width: app.user.ui.sidebarWidth - 88
                },
                {
                    editable: function(data) {
                        return data.user == app.user.username;
                    },
                    id: 'name',
                    input: {
                        autovalidate: pandora.ui.autovalidateListname
                    },
                    operator: '+',
                    visible: id != 'favorite',
                    width: app.user.ui.sidebarWidth - 88
                },
                {
                    align: 'right',
                    id: 'items',
                    operator: '-',
                    visible: true,
                    width: 40
                },
                {
                    clickable: function(data) {
                        return data.type == 'smart';
                    },
                    format: function(value) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImagePath('symbolFind.svg')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px',
                                opacity: value == 'static' ? 0.1 : 1
                            });
                    },
                    id: 'type',
                    operator: '+',
                    visible: true,
                    width: 16
                },
                {
                    clickable: id == 'personal',
                    format: function(value) {
                        //var symbols = {private: 'Publish', public: 'Publish', featured: 'Star'};
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImagePath(
                                    'symbol' + (value == 'featured' ? 'Star' : 'Publish') + '.svg'
                                )
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px',
                                opacity: value == 'private' ? 0.1 : 1
                            })
                    },
                    id: 'status',
                    operator: '+',
                    visible: true,
                    width: 16
                }
            ],
            items: function(data, callback) {
                var query;
                if (id == 'personal') {
                    query = {conditions: [
                        {key: 'user', value: app.user.username, operator: '='},
                        {key: 'status', value: 'featured', operator: '!'}
                    ], operator: '&'};
                } else if (id == 'favorite') {
                    query = {conditions: [
                        {key: 'subscribed', value: true, operator: '='},
                        {key: 'status', value: 'featured', operator: '!'},
                    ], operator: '&'};
                } else if (id == 'featured') {
                    query = {conditions: [{key: 'status', value: 'featured', operator: '='}], operator: '&'};
                }
                return pandora.api.findLists($.extend(data, {
                    query: query
                }), callback);
            },
            max: 1,
            min: 0,
            pageLength: 1000,
            sort: [
                {key: 'position', operator: '+'}
            ],
            sortable: id == 'personal' || id == 'favorite' || app.user.level == 'admin'
        })
        .css({
            left: 0,
            top: 0,
            width: app.user.ui.sidebarWidth + 'px',
        })
        .bind({
            dragenter: function(e) {
                //Ox.print('DRAGENTER', e)
            }
        })
        .bindEvent({
            click: function(event, data) {
                var $list = app.$ui.folderList[id];
                if (data.key == 'type') {
                    app.$ui.filterDialog = pandora.ui.filterDialog().open();
                } else if (data.key == 'status') {
                    pandora.api.editList({
                        id: data.id,
                        status: $list.value(data.id, data.key) == 'private' ? 'public' : 'private'
                    }, function(result) {
                        $list.value(result.data.id, 'status', result.data.status);
                    });
                }
            },
            'delete': function(event, data) {
                var $list = app.$ui.folderList[id];
                app.user.ui.listQuery.conditions = [];
                pandora.URL.set(pandora.Query.toString());
                $list.options({selected: []});
                if (id == 'personal') {
                    pandora.api.removeList({
                        id: data.ids[0]
                    }, function(result) {
                        // fixme: is this the best way to delete a ui preference?
                        delete app.user.ui.lists[data.ids[0]];
                        pandora.UI.set({lists: app.user.ui.lists});
                        Ox.Request.clearCache(); // fixme: remove
                        $list.reloadList();
                    });
                } else if (id == 'favorite') {
                    pandora.api.unsubscribeFromList({
                        id: data.ids[0]
                    }, function(result) {
                        Ox.Request.clearCache(); // fixme: remove
                        $list.reloadList();
                    });
                } else if (id == 'featured' && app.user.level == 'admin') {
                    pandora.api.editList({
                        id: data.ids[0],
                        status: 'public'
                    }, function(result) {
                        // fixme: duplicated
                        if (result.data.user == app.user.username || result.data.subscribed) {
                            Ox.Request.clearCache(); // fixme: remove
                            app.$ui.folderList[
                                result.data.user == app.user.username ? 'personal' : 'favorite'
                            ].reloadList();
                        }
                        $list.reloadList();
                    });
                }
            },
            init: function(event, data) {
                app.ui.sectionFolders[app.user.ui.section][i].items = data.items;
                app.$ui.folder[i].$content.css({
                    height: data.items * 16 + 'px'
                });
                app.$ui.folderList[id].css({
                    height: data.items * 16 + 'px'
                });
                pandora.resizeFolders();
            },
            move: function(event, data) {
                /*
                data.ids.forEach(function(id, pos) {
                    app.user.ui.lists[id].position = pos;
                });
                */
                pandora.api.sortLists({
                    section: id,
                    ids: data.ids
                });
            },
            paste: function(event, data) {
                app.$ui.list.triggerEvent('paste', data);
            },
            select: function(event, data) {
                if (data.ids.length) {
                    $.each(app.$ui.folderList, function(id_, $list) {
                        id != id_ && $list.options('selected', []);
                    })
                    pandora.URL.set('?find=list:' + data.ids[0]);
                } else {
                    pandora.URL.set('?find=');
                }
            },
            submit: function(event, data) {
                data_ = {id: data.id};
                data_[data.key] = data.value;
                pandora.api.editList(data_, function(result) {
                    if (result.data.id != data.id) {
                        app.$ui.folderList[id].value(data.id, 'name', result.data.name);
                        app.$ui.folderList[id].value(data.id, 'id', result.data.id);
                        pandora.URL.set('?find=list:' + result.data.id);
                    }
                });
            }
        });
    }
    return that;
};

pandora.ui.folders = function() {
    var that = new Ox.Element()
        .css({overflowX: 'hidden', overflowY: 'auto'})
        .bindEvent({
            resize: function(event, data) {
                pandora.resizeFolders();
            }
        });
    var counter = 0;
    //var $sections = [];
    app.$ui.folder = [];
    app.$ui.folderBrowser = {};
    app.$ui.folderList = {};
    if (app.user.ui.section == 'site') {
        $.each(app.ui.sectionFolders.site, function(i, folder) {
            var height = (Ox.getObjectById(app.ui.sectionFolders.site, folder.id).items.length * 16);
            app.$ui.folder[i] = new Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !app.user.ui.showFolder.site[folder.id],
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    toggle: function(event, data) {
                        
                    }
                });
            //alert(JSON.stringify(Ox.getObjectById(app.ui.sectionFolders.site, folder.id)))
            app.$ui.folder[i].$content.css({
                height: height + 'px'
            })
                //.appendTo(that);
            app.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .css({
                    height: height + 'px'
                })
                .appendTo(app.$ui.folder[i].$content);
            app.$ui.folder.forEach(function($folder) {
                that.append($folder);
            });
        });
        //pandora.resizeFolders();
    } else if (app.user.ui.section == 'items') {
        $.each(app.ui.sectionFolders.items, function(i, folder) {
            var extras = [];
            if (folder.id == 'personal' && app.user.level != 'guest') {
                extras = [new Ox.Select({
                    items: [
                        { id: 'new', title: 'New List...' },
                        { id: 'newfromselection', title: 'New List from Current Selection...', disabled: true },
                        { id: 'newsmart', title: 'New Smart List...' },
                        { id: 'newfromresults', title: 'New Smart List from Current Results...', disabled: true },
                        {},
                        { id: 'addselection', title: 'Add Selection to List...' }
                    ],
                    max: 0,
                    min: 0,
                    selectable: false,
                    type: 'image'
                })
                .bindEvent({
                    click: function(event, data) {
                        var $list = app.$ui.folderList[folder.id],
                            id;
                        if (data.id == 'new' || data.id == 'newsmart') {
                            pandora.api.addList({
                                name: 'Untitled',
                                status: 'private',
                                type: data.id == 'new' ? 'static' : 'smart'
                            }, function(result) {
                                id = result.data.id;
                                pandora.UI.set(['lists', id].join('|'), app.config.user.ui.lists['']); // fixme: necessary?
                                pandora.URL.set('?find=list:' + id)
                                Ox.Request.clearCache(); // fixme: remove
                                $list.reloadList().bindEventOnce({
                                    load: function(event, data) {
                                        $list.gainFocus()
                                            .options({selected: [id]})
                                            .editCell(id, 'name');
                                    }
                                });
                            });
                        }
                    }
                })];
            } else if (folder.id == 'favorite' && app.user.level != 'guest') {
                extras = [new Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'Edit',
                    tooltip: 'Manage Favorite Lists',
                    type: 'image'
                })
                .bindEvent({
                    change: function(event, data) {
                        Ox.Request.clearCache(); // fixme: remove
                        app.ui.sectionFolders.items[i].showBrowser = !app.ui.sectionFolders.items[i].showBrowser;
                        if (app.ui.sectionFolders.items[i].showBrowser) {
                            app.$ui.folderList.favorite.replaceWith(
                                app.$ui.folderBrowser.favorite = pandora.ui.folderBrowser('favorite')
                            );
                        } else {
                            app.$ui.folderBrowser.favorite.replaceWith(
                                app.$ui.folderList.favorite = pandora.ui.folderList('favorite')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            } else if (folder.id == 'featured' && app.user.level == 'admin') {
                extras = [new Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'Edit',
                    tooltip: 'Manage Featured Lists',
                    type: 'image'
                })
                .bindEvent({
                    change: function(event, data) {
                        Ox.Request.clearCache(); // fixme: remove
                        app.ui.sectionFolders.items[i].showBrowser = !app.ui.sectionFolders.items[i].showBrowser;
                        if (app.ui.sectionFolders.items[i].showBrowser) {
                            app.$ui.folderList.featured.replaceWith(
                                app.$ui.folderBrowser.featured = pandora.ui.folderBrowser('featured'));
                        } else {
                            app.$ui.folderBrowser.featured.replaceWith(
                                app.$ui.folderList.featured = pandora.ui.folderList('featured')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            }
            app.$ui.folder[i] = new Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !app.user.ui.showFolder.items[folder.id],
                    extras: extras,
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    // fixme: duplicated
                    click: function(event, data) {
                        var $list = app.$ui.folderList[i],
                            hasFocus, id;
                        if (data.id == 'new' || data.id == 'newsmart') {
                            pandora.api.addList({
                                name: 'Untitled',
                                status: 'private',
                                type: data.id == 'new' ? 'static' : 'smart'
                            }, function(result) {
                                id = result.data.id;
                                pandora.URL.set('?find=list:' + id)
                                Ox.Request.clearCache(); // fixme: remove
                                $list.reloadList().bindEventOnce({
                                    load: function(event, data) {
                                        $list.gainFocus()
                                            .options({selected: [id]})
                                            .editCell(id, 'name');
                                    }
                                });
                            });
                        } else if (data.id == 'browse') {
                            alert('??')
                            /*
                            app.$ui.sectionList[1].replaceWith(app.$ui.publicLists = pandora.ui.publicLists());
                            app.ui.showAllPublicLists = true;
                            */
                        }
                    },
                    toggle: function(event, data) {
                        data.collapsed && app.$ui.folderList[folder.id].loseFocus();
                        pandora.UI.set('showFolder|items|' + folder.id, !data.collapsed);
                        pandora.resizeFolders();
                    }
                });
            //$sections.push(app.$ui.section[i]);
            app.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .bindEventOnce({
                    init: function(event, data) {
                        Ox.print('init', i, counter)
                        if (++counter == 3) {
                            app.$ui.folder.forEach(function($folder) {
                                that.append($folder);
                            });
                            pandora.resizeFolders();
                            pandora.selectList(); //fixme: doesn't work
                        }
                    }
                })
                .appendTo(app.$ui.folder[i].$content);
        });
    }
    that.toggle = function() {
        
    }
    return that;
};

