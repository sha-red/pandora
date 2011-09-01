// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.folderBrowserList = function(id) {
    // fixme: user and name are set to the same width here,
    // but resizeFolders will set them to different widths
    var columnWidth = (pandora.user.ui.sidebarSize - Ox.UI.SCROLLBAR_SIZE - 96) / 2,
        i = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id),
        that = Ox.TextList({
            columns: [
                {
                    format: function() {
                        return $('<img>').attr({
                            src: Ox.UI.getImageURL('symbolIcon')
                        }).css({
                            width: '10px',
                            height: '10px',
                            padding: '3px 2px 1px 2px'
                        });
                    },
                    id: 'id',
                    operator: '+',
                    title: $('<img>').attr({
                            src: Ox.UI.getImageURL('symbolIcon')
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
                    format: {type: 'number'},
                    operator: '-',
                    title: 'Items',
                    visible: true,
                    width: 48
                },
                {
                    clickable: function(data) {
                        return data.type == 'smart';
                    },
                    format: function(value, data) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(value == 'static' ? 'symbolClick' : 'symbolFind')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px', // fixme: strange
                                opacity: data.user == pandora.user.username ? 1 : 0.25
                            });
                    },
                    id: 'type',
                    operator: '+',
                    title: $('<img>')
                        .attr({
                            src: Ox.UI.getImageURL('symbolEdit')
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px 2px 1px 2px',
                        }),
                    tooltip: function(data) {
                        return data.type == 'smart'
                            ? (data.user == pandora.user.username ? 'Edit Query' : 'Show Query')
                            : '';
                    },
                    visible: true,
                    width: 16
                },
                {
                    clickable: true,
                    format: function(value) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(
                                    'symbol' + (id == 'favorite' ? 'Like' : 'Star')
                                )
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px',
                                opacity: id == 'favorite'
                                    ? (value ? 1 : 0.25)
                                    : (value == 'featured' ? 1 : 0.25)
                            });
                    },
                    id: id == 'favorite' ? 'subscribed' : 'status',
                    operator: '+',
                    title: $('<img>')
                        .attr({
                            src: Ox.UI.getImageURL(
                                'symbol' + (id == 'favorite' ? 'Like' : 'Star')
                            )
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px 2px 1px 2px'
                        }),
                    tooltip: function(data) {
                        var checked = id == 'favorite' ? data.subscribed : data.status == 'featured';
                        return (checked ? 'Remove from' : 'Add to')
                            + ' ' + Ox.toTitleCase(id) + ' Lists';
                    },
                    visible: true,
                    width: 16
                },
            ],
            columnsVisible: true,
            items: function(data, callback) {
                var query = id == 'favorite' ? {conditions: [
                    {key: 'status', value: 'public', operator: '='},
                    {key: 'user', value: pandora.user.username, operator: '!'}
                ], operator: '&'} : {conditions: [
                    {key: 'status', value: 'private', operator: '!'}
                ], operator: ''};
                return pandora.api.findLists(Ox.extend(data, {
                    query: query
                }), callback);
            },
            pageLength: 1000,
            // fixme: select if previously selected
            // selected: pandora.user.ui.list ? [pandora.user.ui.list] : [],
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
                        if (result.data.user == pandora.user.username || result.data.subscribed) {
                            Ox.Request.clearCache(); // fixme: remove
                            pandora.$ui.folderList[
                                result.data.user == pandora.user.username ? 'personal' : 'favorite'
                            ].reloadList();
                        }
                        that.value(data.id, 'status', result.data.status);
                    });
                }
            },
            init: function(event, data) {
                pandora.site.sectionFolders[pandora.user.ui.section][i].items = data.items;
                pandora.$ui.folder[i].$content.css({
                    height: 40 + data.items * 16 + 'px'
                });
                pandora.$ui.folderList[id].css({
                    height: 16 + data.items * 16 + 'px'
                });
                pandora.resizeFolders();
            },
            paste: function(event, data) {
                pandora.$ui.list.triggerEvent('paste', data);
            },
            select: function(event, data) {
                // fixme: duplicated
                if (data.ids.length) {
                    $.each(pandora.$ui.folderList, function(id_, $list) {
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

/*
pandora.ui.folderList = function(id) {
    var i = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id),
        that;
    if (pandora.user.ui.section == 'site') {
        that = Ox.TextList({
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
                    width: pandora.user.ui.sidebarSize - 16
                }
            ],
            items: function(data, callback) {
                var result = {data: {}};
                if (!data.range) {
                    result.data.items = Ox.getObjectById(pandora.site.sectionFolders.site, id).items.length;
                } else {
                    result.data.items = Ox.getObjectById(pandora.site.sectionFolders.site, id).items;
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
                $.each(pandora.$ui.folderList, function(id_, $list) {
                    id != id_ && $list.options('selected', []);
                })
                pandora.URL.set((id == 'admin' ? 'admin/' : '' ) + data.ids[0]);
            },
        });
    } else if (pandora.user.ui.section == 'items') {
        that = Ox.TextList({
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
                    width: pandora.user.ui.sidebarWidth - 88
                },
                {
                    editable: function(data) {
                        return data.user == pandora.user.username;
                    },
                    id: 'name',
                    input: {
                        autovalidate: pandora.ui.autovalidateListname
                    },
                    operator: '+',
                    visible: id != 'favorite',
                    width: pandora.user.ui.sidebarWidth - 88
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
                                src: Ox.UI.getImageURL('symbolFind')
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
                                src: Ox.UI.getImageURL(
                                    'symbol' + (value == 'featured' ? 'Star' : 'Publish')
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
                        {key: 'user', value: pandora.user.username, operator: '='},
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
            sortable: id == 'personal' || id == 'favorite' || pandora.user.level == 'admin'
        })
        .css({
            left: 0,
            top: 0,
            width: pandora.user.ui.sidebarWidth + 'px',
        })
        .bind({
            dragenter: function(e) {
                //Ox.print('DRAGENTER', e)
            }
        })
        .bindEvent({
            click: function(event, data) {
                var $list = pandora.$ui.folderList[id];
                if (data.key == 'type') {
                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
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
                var $list = pandora.$ui.folderList[id];
                pandora.user.ui.listQuery.conditions = [];
                pandora.URL.set(pandora.Query.toString());
                $list.options({selected: []});
                if (id == 'personal') {
                    pandora.api.removeList({
                        id: data.ids[0]
                    }, function(result) {
                        // fixme: is this the best way to delete a ui preference?
                        delete pandora.user.ui.lists[data.ids[0]];
                        pandora.UI.set({lists: pandora.user.ui.lists});
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
                } else if (id == 'featured' && pandora.user.level == 'admin') {
                    pandora.api.editList({
                        id: data.ids[0],
                        status: 'public'
                    }, function(result) {
                        // fixme: duplicated
                        if (result.data.user == pandora.user.username || result.data.subscribed) {
                            Ox.Request.clearCache(); // fixme: remove
                            pandora.$ui.folderList[
                                result.data.user == pandora.user.username ? 'personal' : 'favorite'
                            ].reloadList();
                        }
                        $list.reloadList();
                    });
                }
            },
            init: function(event, data) {
                pandora.site.sectionFolders[pandora.user.ui.section][i].items = data.items;
                pandora.$ui.folder[i].$content.css({
                    height: data.items * 16 + 'px'
                });
                pandora.$ui.folderList[id].css({
                    height: data.items * 16 + 'px'
                });
                pandora.resizeFolders();
            },
            move: function(event, data) {
                data.ids.forEach(function(id, pos) {
                    pandora.user.ui.lists[id].position = pos;
                });
                pandora.api.sortLists({
                    section: id,
                    ids: data.ids
                });
            },
            paste: function(event, data) {
                pandora.$ui.list.triggerEvent('paste', data);
            },
            select: function(event, data) {
                if (data.ids.length) {
                    $.each(pandora.$ui.folderList, function(id_, $list) {
                        id != id_ && $list.options('selected', []);
                    });
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
                        pandora.$ui.folderList[id].value(data.id, 'name', result.data.name);
                        pandora.$ui.folderList[id].value(data.id, 'id', result.data.id);
                        pandora.URL.set('?find=list:' + result.data.id);
                    }
                });
            }
        });
    }
    return that;
};

pandora.ui.folders = function() {
    var that = Ox.Element()
        .css({overflowX: 'hidden', overflowY: 'auto'})
        .bindEvent({
            resize: function(event, data) {
                pandora.resizeFolders();
            }
        });
    var counter = 0;
    //var $sections = [];
    pandora.$ui.folder = [];
    pandora.$ui.folderBrowser = {};
    pandora.$ui.folderList = {};
    if (pandora.user.ui.section == 'site') {
        $.each(pandora.site.sectionFolders.site, function(i, folder) {
            var height = (Ox.getObjectById(pandora.site.sectionFolders.site, folder.id).items.length * 16);
            pandora.$ui.folder[i] = Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !pandora.user.ui.showFolder.site[folder.id],
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    toggle: function(event, data) {
                        
                    }
                });
            //alert(JSON.stringify(Ox.getObjectById(pandora.site.sectionFolders.site, folder.id)))
            pandora.$ui.folder[i].$content.css({
                height: height + 'px'
            })
                //.appendTo(that);
            pandora.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .css({
                    height: height + 'px'
                })
                .appendTo(pandora.$ui.folder[i].$content);
            pandora.$ui.folder.forEach(function($folder) {
                that.append($folder);
            });
        });
        //pandora.resizeFolders();
    } else if (pandora.user.ui.section == 'items') {
        $.each(pandora.site.sectionFolders.items, function(i, folder) {
            var extras = [];
            if (folder.id == 'personal' && pandora.user.level != 'guest') {
                extras = [Ox.Select({
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
                        var $list = pandora.$ui.folderList[folder.id],
                            id;
                        if (data.id == 'new' || data.id == 'newsmart') {
                            pandora.api.addList({
                                name: 'Untitled',
                                status: 'private',
                                type: data.id == 'new' ? 'static' : 'smart'
                            }, function(result) {
                                id = result.data.id;
                                pandora.UI.set(['lists', id].join('|'), pandora.site.user.ui.lists['']); // fixme: necessary?
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
            } else if (folder.id == 'favorite' && pandora.user.level != 'guest') {
                extras = [Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'Edit',
                    tooltip: 'Manage Favorite Lists',
                    type: 'image'
                })
                .bindEvent({
                    change: function(event, data) {
                        Ox.Request.clearCache(); // fixme: remove
                        pandora.site.sectionFolders.items[i].showBrowser = !pandora.site.sectionFolders.items[i].showBrowser;
                        if (pandora.site.sectionFolders.items[i].showBrowser) {
                            pandora.$ui.folderList.favorite.replaceWith(
                                pandora.$ui.folderBrowser.favorite = pandora.ui.folderBrowser('favorite')
                            );
                        } else {
                            pandora.$ui.folderBrowser.favorite.replaceWith(
                                pandora.$ui.folderList.favorite = pandora.ui.folderList('favorite')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            } else if (folder.id == 'featured' && pandora.user.level == 'admin') {
                extras = [Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'Edit',
                    tooltip: 'Manage Featured Lists',
                    type: 'image'
                })
                .bindEvent({
                    change: function(event, data) {
                        Ox.Request.clearCache(); // fixme: remove
                        pandora.site.sectionFolders.items[i].showBrowser = !pandora.site.sectionFolders.items[i].showBrowser;
                        if (pandora.site.sectionFolders.items[i].showBrowser) {
                            pandora.$ui.folderList.featured.replaceWith(
                                pandora.$ui.folderBrowser.featured = pandora.ui.folderBrowser('featured'));
                        } else {
                            pandora.$ui.folderBrowser.featured.replaceWith(
                                pandora.$ui.folderList.featured = pandora.ui.folderList('featured')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            }
            pandora.$ui.folder[i] = Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !pandora.user.ui.showFolder.items[folder.id],
                    extras: extras,
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    // fixme: duplicated
                    click: function(event, data) {
                        var $list = pandora.$ui.folderList[i],
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
                            //pandora.$ui.sectionList[1].replaceWith(pandora.$ui.publicLists = pandora.ui.publicLists());
                            //pandora.site.showAllPublicLists = true;
                        }
                    },
                    toggle: function(event, data) {
                        data.collapsed && pandora.$ui.folderList[folder.id].loseFocus();
                        pandora.UI.set('showFolder|items|' + folder.id, !data.collapsed);
                        pandora.resizeFolders();
                    }
                });
            //$sections.push(pandora.$ui.section[i]);
            pandora.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .bindEventOnce({
                    init: function(event, data) {
                        Ox.print('init', i, counter)
                        if (++counter == 3) {
                            pandora.$ui.folder.forEach(function($folder) {
                                that.append($folder);
                            });
                            pandora.resizeFolders();
                            pandora.selectList(); //fixme: doesn't work
                        }
                    }
                })
                .appendTo(pandora.$ui.folder[i].$content);
        });
    }
    that.toggle = function() {
        
    }
    return that;
};
*/

