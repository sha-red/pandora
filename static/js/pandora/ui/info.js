// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.info = function(id) {
    id = id || pandora.user.ui.item;
    var that = Ox.Element()
        .bindEvent({
            toggle: function(data) {
                pandora.UI.set({showInfo: !data.collapsed});
                pandora.resizeFolders();
            }
        });
    if (id) {
        if (!pandora.user.ui.item && pandora.isClipView(pandora.user.ui.lists[pandora.user.ui.list].listView)) {
            // Poster
            pandora.api.get({id: id, keys: ['director', 'posterRatio', 'title']}, function(result) {
                var ratio = result.data.posterRatio,
                    height = Math.min(pandora.user.ui.sidebarSize, 256);
                that.empty().append(
                    Ox.Element({
                        element: '<img>',
                        tooltip: '<span class="OxBright">' + result.data.title + '</span>' + (
                            result.data.director ? '<br/>' + result.data.director.join(', ') : ''
                        )
                    }).attr({
                        src: '/' + id + '/poster256.jpg'
                    }).css({
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        height: height + 'px',
                        margin: 'auto'
                    })
                );
                pandora.user.infoRatio = 1;
            });
        } else {
            // Video Preview
            pandora.api.get({id: id, keys: ['duration', 'videoRatio']}, function(result) {
                if (result.data) {
                    pandora.$ui.videoPreview && pandora.$ui.videoPreview.removeElement();
                    pandora.$ui.videoPreview = pandora.ui.videoPreview({
                        id: id,
                        duration: result.data.duration,
                        frameRatio: result.data.videoRatio
                    }).appendTo(pandora.$ui.info);
                }
            });
        }
    } else if (pandora.$ui.leftPanel) {
        //pandora.user.infoRatio = 1;
        //resize(pandora.user.ui.sidebarSize);
    }
    return that;
};

