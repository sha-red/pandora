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
        if (!pandora.user.ui.item && pandora.user.ui.lists[pandora.user.ui.list].listView == 'clip') {
            // Poster
            pandora.api.get({id: id, keys: ['posterRatio']}, function(result) {
                var ratio = result.data.posterRatio,
                    height = pandora.user.ui.sidebarSize;
                that.empty().append(
                    $('<img>').attr({
                        src: '/' + id + '/poster' + pandora.user.ui.sidebarSize + '.jpg'
                    }).css({
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        margin: 'auto'
                    })
                );
                pandora.user.infoRatio = 1;
                resize(height);
            });
        } else {
            // Video Preview
            pandora.api.get({id: id, keys: ['duration', 'videoRatio']}, function(result) {
                if(result.data) {
                    var height = Math.round(pandora.user.ui.sidebarSize / result.data.videoRatio) + 16;
                    pandora.$ui.videoPreview && pandora.$ui.videoPreview.removeElement();
                    pandora.$ui.videoPreview = pandora.ui.videoPreview({
                        id: id,
                        duration: result.data.duration,
                        ratio: result.data.videoRatio
                    }).appendTo(pandora.$ui.info);
                    pandora.user.infoRatio = pandora.user.ui.sidebarSize / height;
                    resize(height);
                }
            });
        }
    } else if (pandora.$ui.leftPanel) {
        pandora.user.infoRatio = 1;
        resize(pandora.user.ui.sidebarSize);
    }
    function resize(height) {
        !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -height});
        pandora.$ui.leftPanel.size(2, height);
        that.animate({
            height: height + 'px'
        }, 250, function() {
            pandora.resizeFolders();
        });
    }
    return that;
};

