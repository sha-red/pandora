// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.info = function() {
    var that = Ox.Element()
        .append(
            pandora.$ui.infoStill = Ox.Element()
                .css({
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '96px'
                })
        )
        .append(
            pandora.$ui.infoTimeline = Ox.Element('<img>')
                .css({
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    height: '16px'
                })
        )
        .bindEvent({
            toggle: function(event, data) {
                pandora.UI.set({showInfo: !data.collapsed});
                pandora.resizeFolders();
            }
        });
    if(pandora.user.ui.item) {
        pandora.api.getItem(pandora.user.ui.item, function(result) {
            pandora.user.infoRatio = result.data.stream.aspectRatio;
            var width = that.width() || 256,
                height = width / pandora.user.infoRatio + 16;
            pandora.$ui.infoStill.removeElement();
            pandora.$ui.infoStill = pandora.ui.flipbook(pandora.user.ui.item)
                                  .appendTo(that.$element);
            pandora.$ui.infoStill.css({
                'height': (height-16) + 'px'
            });
            that.css({
                height: height  + 'px'
            });
            pandora.resizeFolders();
            !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -height});
            pandora.$ui.leftPanel.size(2, height );
        });
        pandora.$ui.infoTimeline.attr('src', '/'+pandora.user.ui.item+'/timeline.16.png');
    }
    return that;
};

