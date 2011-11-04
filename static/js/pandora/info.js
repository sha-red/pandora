// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.info = function() {

    var ui = pandora.user.ui,
        view = getView(),

        that = Ox.Element()
            .css({overflowX: 'hidden', overflowY: 'auto'})
            .bindEvent({
                toggle: function(data) {
                    Ox.Log('', 'INFO TOGGLE')
                    pandora.UI.set({showInfo: !data.collapsed});
                },
                pandora_find: function() {
                    if (pandora.user.ui._list != pandora.UI.getPrevious('_list')) {
                        updateInfo();
                    }
                },
                pandora_item: updateInfo,
                pandora_listselection: updateInfo,
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
        Ox.Log('', 'RESIZE INFO', ui.showInfo, height)
        pandora.$ui.leftPanel.size(2, height);
        pandora.resizeFolders();
        !ui.showInfo && pandora.$ui.leftPanel.css({bottom: -height + 'px'});
        /*
        if (ui.showInfo) {
            pandora.$ui.leftPanel.size(2, height, function() {
                pandora.resizeFolders();
            });
        } else {
            pandora.$ui.leftPanel.css({bottom: -height + 'px'});
            pandora.resizeFolders();
        }
        */
    }

    function updateInfo() {
        var id = getId(),
            previousView = view;
        view = getView();
        if (view == 'list') {
            that.empty().append(pandora.$ui.listInfo = pandora.ui.listInfo());
            previousView == 'video' && resizeInfo();
        } else if (view == 'poster') {
            pandora.api.get({id: id, keys: ['director', 'posterRatio', 'title']}, function(result) {
                var ratio = result.data.posterRatio,
                    height = pandora.getInfoHeight(true);
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
                    pandora.$ui.videoPreview && pandora.$ui.videoPreview.removeElement();
                    pandora.$ui.videoPreview = pandora.ui.videoPreview({
                            duration: result.data.duration,
                            frameRatio: result.data.videoRatio,
                            height: pandora.getInfoHeight(true),
                            id: id,
                            width: ui.sidebarSize
                        })
                        .bindEvent({
                            click: function(data) {
                                pandora.UI.set(
                                    'videoPoints.' + id,
                                    {'in': 0, out: 0, position: data.position}
                                );
                                if (ui.item && ['video', 'timeline'].indexOf(ui.itemView) > -1) {
                                    pandora.$ui[
                                        ui.itemView == 'video' ? 'player' : 'editor'
                                    ].options({
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
                        .appendTo(pandora.$ui.info);
                    previousView != 'video' && resizeInfo();
                }
            });
        }
    }

    that.resizeInfo = function() {
        var view = getView();
        if (view == 'list') {
            pandora.$ui.listInfo.resizeIcon();
        } else if (view == 'poster') {
            pandora.$ui.posterInfo.resizePoster();
        } else if (view == 'video') {
            pandora.$ui.videoPreview.options({
                height: pandora.getInfoHeight(true),
                width: ui.sidebarSize
            });
        }
    };

    return that;

};

pandora.ui.listInfo = function() {

    var list = pandora.user.ui._list,
        that = $('<div>').css({padding: '16px', textAlign: 'center'}),
        $icon = Ox.Element({
                element: '<img>',
                tooltip: list.split(':')[0] == pandora.user.username
                    ? 'Doubleclick to edit icon' : '',
            })
            .attr({
                src: list
                    ? '/list/' + list + '/icon256.jpg?' + Ox.uid()
                    : '/static/png/icon256.png'
            })
            .css(getIconCSS())
            .appendTo(that);

    that.append($('<div>').css({height: '16px'}));

    //fixme: allow editing
    //pandora.api.editList({id: list, description: 'foobbar'}, callback)
    //pandora.api.editPage({name: 'allItems', body: 'foobar'}, callback)
    if (list) {
        pandora.api.findLists({
            query: { conditions: [{key: 'id', value: list, operator: '=='}] },
            keys: ['description', 'name', 'user']
        }, function(result) {
            if (result.data.items.length) {
                var item = result.data.items[0];
                that.append(
                    Ox.Editable({
                            editable: item.user == pandora.user.username,
                            format: function(value) {
                                return Ox.encodeHTML(item.user + ':' + value)
                            },
                            tooltip: item.user == pandora.user.username
                                ? 'Doubleclick to edit title' : '',
                            value: item.name,
                            width: pandora.user.ui.sidebarSize - 32
                        })
                        .css({fontWeight: 'bold', textAlign: 'center'})
                ).append(
                    $('<div>').css({height: '8px'})
                ).append(
                    Ox.Editable({
                            editable: item.user == pandora.user.username,
                            format: function(value) {
                                return Ox.encodeHTML(value)
                            },
                            placeholder: '<div style="color: rgb(128, 128, 128); text-align: center">No description</span>',
                            tooltip: 'Doubleclick to edit description',
                            type: 'textarea',
                            value: item.description,
                            width: pandora.user.ui.sidebarSize - 32
                        })
                        .css({textAlign: 'left'})
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
                .css({paddingTop: '16px', fontWeight: 'bold'})
                .html('All ' + pandora.site.itemName.plural)
        );
    }

    function getIconCSS() {
        var size = Math.round(pandora.user.ui.sidebarSize / 2);
        return {
            width: size + 'px',
            height: size + 'px',
            borderRadius: Math.round(size / 4) + 'px',
        };
    }
    that.resizeIcon = function() {
        $icon.css(getIconCSS());
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
                    data.director ? ' (' + data.director.join(', ') + ')' : ''
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
    that.resizePoster = function() {
        $poster.css(getPosterCSS());
        $text.css({width: pandora.user.ui.sidebarSize - 8 + 'px'})
    }
    return that;
};
