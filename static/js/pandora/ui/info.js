// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.info = function() {
    var id = pandora.user.ui.item || (
            pandora.user.ui.listSelection.length
            ? pandora.user.ui.listSelection[pandora.user.ui.listSelection.length - 1]
            : null
        ),
        view = getView(),
        that = Ox.Element()
            .css({overflowX: 'hidden', overflowY: 'auto'})
            .bindEvent({
                toggle: function(data) {
                    pandora.UI.set({showInfo: !data.collapsed});
                    pandora.resizeFolders();
                }
            });
    Ox.print('INFO', view)
    if (view == 'list') {
        that.empty().append(pandora.$ui.listInfo = pandora.ui.listInfo(pandora.user.ui._list));
    } else if (view == 'poster') {
        pandora.api.get({id: id, keys: ['director', 'posterRatio', 'title']}, function(result) {
            var ratio = result.data.posterRatio,
                height = pandora.getInfoHeight();
            that.empty().append(
                pandora.$ui.posterInfo = pandora.ui.posterInfo(Ox.extend(result.data, {id: id}))
            );
        });
    } else if (view == 'video') {
        pandora.api.get({id: id, keys: ['duration', 'videoRatio']}, function(result) {
            if (result.data) {
                pandora.$ui.videoPreview && pandora.$ui.videoPreview.removeElement();
                pandora.$ui.videoPreview = pandora.ui.videoPreview({
                    duration: result.data.duration,
                    frameRatio: result.data.videoRatio,
                    height: pandora.getInfoHeight(),
                    id: id,
                    width: pandora.user.ui.sidebarSize
                }).appendTo(pandora.$ui.info);
            }
        });
    }
    pandora.$ui.leftPanel && resize();
    function getView() {
        return !id ? 'list'
            : !pandora.user.ui.item && pandora.isClipView() ? 'poster'
            : 'video';
    }
    function resize() {
        var height = pandora.getInfoHeight();
        if (height != pandora.$ui.leftPanel.size(2)) {
            !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -height});
            // fixme: why is this timeout needed?
            setTimeout(function() {
                pandora.$ui.leftPanel.size(2, height, function() {
                    pandora.resizeFolders();
                });
            }, 0)
        }
    }
    that.resizeInfo = function() {
        if (view == 'list') {
            pandora.$ui.listInfo.resizeIcon();
        } else if (view == 'poster') {
            pandora.$ui.posterInfo.resizePoster();
        } else if (view == 'video') {
            pandora.$ui.videoPreview.options({
                height: pandora.getInfoHeight(),
                width: pandora.user.ui.sidebarSize
            })
        }
    };
    return that;
};

pandora.ui.listInfo = function(data) {
    var that = $('<div>').css({padding: '16px', textAlign: 'center'});
    var $icon = $('<img>')
        .attr({src: !pandora.user.ui._list ? '/static/png/icon256.png' : Ox.UI.getImageURL('symbolIcon')})
        .css(getIconCSS())
        .appendTo(that);
    $('<div>').css({padding: '16px 0 16px 0', fontWeight: 'bold'}).html(!pandora.user.ui._list ? 'All Movies' : pandora.user.ui._list.replace(':', ': ')).appendTo(that);
    $('<div>').css({textAlign: 'left'}).html(Ox.repeat('This is the list info text. ', 10)).appendTo(that);
    function getIconCSS() {
        var size = Math.round(pandora.user.ui.sidebarSize / 2);
        return {width: size + 'px', height: size + 'px'};
    }
    that.resizeIcon = function() {
        $icon.css(getIconCSS());
    }
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
            );
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
