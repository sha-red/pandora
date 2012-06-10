// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.info = function() {

    var ui = pandora.user.ui,
        view = getView(),

        that = Ox.Element()
            .css({overflowX: 'hidden', overflowY: 'auto'})
            .bindEvent({
                toggle: function(data) {
                    pandora.UI.set({showInfo: !data.collapsed});
                },
                pandora_find: function() {
                    if (pandora.user.ui._list != pandora.UI.getPrevious('_list')) {
                        updateInfo();
                    }
                },
                pandora_item: updateInfo,
                pandora_listselection: updateInfo,
                pandora_listview: function(data) {
                    if (
                        pandora.isClipView(data.value) != pandora.isClipView(data.previousValue)
                        || data.value == 'timelines' || data.previousValue == 'timelines'
                    ) {
                        updateInfo();
                    }
                }
            });

    //pandora.$ui.leftPanel && resize();

    updateInfo();

    function getId() {
        return ui.item || (
            ui.listSelection.length
            ? ui.listSelection[ui.listSelection.length - 1]
            : null
        );
    }

    function getView() {
        return !getId() ? 'list'
            : !ui.item && pandora.isClipView() ? 'poster'
            : 'video';
    }

    function resizeInfo() {
        var height = pandora.getInfoHeight(true);
        pandora.$ui.leftPanel.size(2, height);
        pandora.resizeFolders();
        !ui.showInfo && pandora.$ui.leftPanel.css({bottom: -height + 'px'});
    }

    function updateInfo() {
        var id = getId(),
            previousView = view;
        view = getView();
        if (view == 'list') {
            pandora.$ui.listInfo && pandora.$ui.listInfo.remove();
            that.empty().append(pandora.$ui.listInfo = pandora.ui.listInfo());
            previousView == 'video' && resizeInfo();
        } else if (view == 'poster') {
            pandora.api.get({id: id, keys: ['director', 'posterRatio', 'title']}, function(result) {
                var ratio = result.data.posterRatio,
                    height = pandora.getInfoHeight(true);
                pandora.$ui.posterInfo && pandora.$ui.posterInfo.remove();                
                that.empty().append(
                    pandora.$ui.posterInfo = pandora.ui.posterInfo(Ox.extend(result.data, {id: id}))
                );
                previousView == 'video' && resizeInfo();
            });
        } else if (view == 'video') {
            pandora.api.get({
                id: id,
                keys: ['duration', 'rendered', 'videoRatio']
            }, function(result) {
                if (result.data && result.data.rendered) {
                    pandora.$ui.videoPreview && pandora.$ui.videoPreview.remove();
                    that.empty().append(
                        pandora.$ui.videoPreview = pandora.ui.videoPreview({
                                duration: result.data.duration,
                                frameRatio: result.data.videoRatio,
                                height: pandora.getInfoHeight(true),
                                id: id,
                                position: !ui.item && ui.listView == 'timelines'
                                    ? (ui.videoPoints[id] ? ui.videoPoints[id].position : 0)
                                    : void 0,
                                width: ui.sidebarSize
                            })
                            .bindEvent({
                                click: function(data) {
                                    pandora.UI.set(
                                        'videoPoints.' + id,
                                        {'in': 0, out: 0, position: data.position}
                                    );
                                    if (ui.item && ['timeline', 'player', 'editor'].indexOf(ui.itemView) > -1) {
                                        pandora.$ui[ui.itemView].options({
                                            position: data.position
                                        });
                                    } else {
                                        pandora.UI.set({
                                            item: id,
                                            itemView: ui.videoView
                                        });
                                    }
                                }
                            })
                    );
                    previousView != 'video' && resizeInfo();
                }
            });
        }
    }

    that.resizeInfo = function() {
        var view = getView();
        if (view == 'list') {
            pandora.$ui.listInfo.resizeInfo();
        } else if (view == 'poster') {
            pandora.$ui.posterInfo.resizeInfo();
        } else if (view == 'video') {
            pandora.$ui.videoPreview.options({
                height: pandora.getInfoHeight(true),
                width: ui.sidebarSize
            });
        }
    };

    that.updateListInfo = function() {
        getView() == 'list' && that.empty().append(
            pandora.$ui.listInfo = pandora.ui.listInfo()
        );
    };

    return that;

};

pandora.ui.listInfo = function() {

    var list = pandora.user.ui._list,
        canEditFeaturedLists = pandora.site.capabilities.canEditFeaturedLists[pandora.user.level],
        that = $('<div>').css({padding: '16px', textAlign: 'center'}),
        $icon = Ox.Element('<img>')
            .attr({
                src: list
                    ? '/list/' + list + '/icon256.jpg?' + Ox.uid()
                    : '/static/png/icon.png'
            })
            .css(getIconCSS())
            .appendTo(that),
        $title, $description;

    that.append($('<div>').css({height: '16px'}));

    //fixme: allow editing
    //pandora.api.editList({id: list, description: 'foobbar'}, callback)
    //pandora.api.editPage({name: 'allItems', body: 'foobar'}, callback)
    if (list) {
        pandora.api.findLists({
            query: {conditions: [{key: 'id', value: list, operator: '=='}]},
            keys: ['description', 'status', 'name', 'user']
        }, function(result) {
            if (result.data.items.length) {
                var item = result.data.items[0],
                    editable = item.user == pandora.user.username
                        || (item.status == 'featured' && canEditFeaturedLists);
                if (editable) {
                    $icon.options({
                        tooltip: 'Doubleclick to edit icon'
                    }).bindEvent({
                        doubleclick: editIcon
                    });
                }
                that.append(
                    $title = Ox.Editable({
                            editable: editable,
                            format: function(value) {
                                // FIXME: document what we're trying to do here!
                                return Ox.encodeHTMLEntities(
                                    Ox.decodeHTMLEntities(
                                        item.status == 'featured' || editable
                                            ? value
                                            : item.user + ': ' + value
                                    )
                                )
                            },
                            tooltip: editable ? 'Doubleclick to edit title' : '',
                            value: item.name,
                            width: pandora.user.ui.sidebarSize - 32
                        })
                        .css({fontWeight: 'bold', textAlign: 'center'})
                        .bindEvent({
                            edit: function() {
                                $title.options({
                                    width: that.width()
                                });
                            },
                            submit: function(data) {
                                data.value = Ox.decodeHTMLEntities(data.value);
                                if (data.value != item.name) {
                                    pandora.api.editList({
                                        id: list,
                                        name: data.value
                                    }, function(result) {
                                        if (result.data.id != list) {
                                            pandora.renameList(list, result.data.id, result.data.name);
                                            list = result.data.id;
                                            item.name = result.data.name;
                                        }
                                    });
                                }
                            }
                        })
                ).append(
                    $('<div>').css({height: '8px'})
                ).append(
                    $description = Ox.Editable({
                            clickLink: pandora.clickLink,
                            format: function(value) {
                                return '<div style="color: rgb(128, 128, 128); text-align: center">'
                                    + value + '</div>';
                            },
                            editable: editable,
                            height: pandora.user.ui.sidebarSize - 32,
                            placeholder: editable
                                ? '<div style="color: rgb(128, 128, 128); text-align: center">No description</span>'
                                : '',
                            tooltip: editable ? 'Doubleclick to edit description' : '',
                            type: 'textarea',
                            value: item.description,
                            width: pandora.user.ui.sidebarSize - 32
                        })
                        .css({textAlign: 'center'})
                        .bindEvent({
                            edit: function() {
                                // scrollbars may appear
                                setTimeout(function() {
                                    var width = that.width();
                                    $description.options({
                                        height: width,
                                        width: width
                                    });
                                }, 25);
                            },
                            submit: function(data) {
                                if (data.value != item.description) {
                                    pandora.api.editList({
                                        id: list,
                                        description: data.value
                                    }, function(result) {
                                        item.description = result.data.description;
                                        Ox.Request.clearCache('findLists');
                                    });
                                }
                            }
                        })
                );
            } else {
                that.append(
                    $('<div>')
                        .css({paddingTop: '16px'})
                        .html('List not found')
                );
            }
        });
    } else {
        that.append(
            $('<div>')
                .css({fontWeight: 'bold'})
                .html('All ' + pandora.site.itemName.plural)
        );
    }

    function editIcon() {
        // timeout is needed since if the icon is clicked before the list
        // folders have loaded, the list dialog cannot get the list data yet.
        if (pandora.getListData().id) {
            pandora.$ui.listDialog = pandora.ui.listDialog('icon').open();
        } else {
            setTimeout(editIcon, 250);
        }
    }

    function getIconCSS() {
        var size = Math.round(pandora.user.ui.sidebarSize / 2);
        return {
            width: size + 'px',
            height: size + 'px',
            borderRadius: Math.round(size / 4) + 'px'
        };
    }

    that.resizeInfo = function() {
        var width = that.width();
        $icon.css(getIconCSS());
        $title && $title.options({
            width: width
        });
        $description && $description.options({
            height: width,
            width: width
        });
    };

    return that;

};

pandora.ui.posterInfo = function(data) {
    var $poster = $('<img>')
            .attr({src: '/' + data.id + '/poster512.jpg'})
            .css(getPosterCSS()),
        $text = $('<div>')
            .css({
                width: pandora.user.ui.sidebarSize - 8 + 'px',
                height: '12px',
                padding: '2px 4px 2px 4px',
                fontSize: '9px',
                textAlign: 'center',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
            })
            .html(
                data.title + (
                    Ox.len(data.director) ? ' (' + data.director.join(', ') + ')' : ''
                )
            ),
        that = Ox.SplitPanel({
            elements: [
                {
                    element: $('<div>').append($poster)
                },
                {
                    element: Ox.Bar({size: 16}).append($text),
                    size: 16
                }
            ],
            orientation: 'vertical'
        });
    function getPosterCSS() {
        var css = {},
            ratio = pandora.user.ui.sidebarSize / (pandora.user.ui.sidebarSize - 16);
        if (data.posterRatio < ratio) {
            css.height = pandora.user.ui.sidebarSize - 16;
            css.width = Math.round(css.height * data.posterRatio);
            css.marginLeft = Math.floor((pandora.user.ui.sidebarSize - css.width) / 2);
        } else {
            css.width = pandora.user.ui.sizebarSize;
            css.height = Math.round(css.width / data.posterRatio);
            css.marginTop = Math.floor((pandora.user.ui.sidebarSize - 16 - css.height) / 2);
        }
        return Ox.map(css, function(value) {
            return value + 'px';
        });
    }
    that.resizeInfo = function() {
        $poster.css(getPosterCSS());
        $text.css({width: pandora.user.ui.sidebarSize - 8 + 'px'})
    }
    return that;
};
