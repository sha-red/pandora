// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.info = function(id) {
    id = id || pandora.user.ui.item;
    Ox.print('ID', id)
    var that = Ox.Element()
        .bindEvent({
            toggle: function(event, data) {
                pandora.UI.set({showInfo: !data.collapsed});
                pandora.resizeFolders();
            }
        });
    if (id) {
        pandora.api.get({id: id, keys:['stream']}, function(result) {
            var video = result.data.stream;
                height = Math.round(pandora.user.ui.sidebarSize / video.aspectRatio) + 16;
            pandora.$ui.videoPreview && pandora.$ui.videoPreview.removeElement();
            pandora.$ui.videoPreview = pandora.ui.videoPreview({
                id: id,
                video: video
            }).appendTo(pandora.$ui.info);
            pandora.user.infoRatio = video.aspectRatio;
            resize(height);
        });
    } else if (pandora.$ui.leftPanel) {
        resize(32);
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

