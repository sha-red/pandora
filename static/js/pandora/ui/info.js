// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.info = function() {
    var that = new Ox.Element()
        .append(
            app.$ui.infoStill = new Ox.Element()
                .css({
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '96px'
                })
        )
        .append(
            app.$ui.infoTimeline = new Ox.Element('<img>')
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
    if(app.user.ui.item) {
        pandora.api.getItem(app.user.ui.item, function(result) {
            app.ui.infoRatio = result.data.stream.aspectRatio;
            var width = that.width() || 256,
                height = width / app.ui.infoRatio + 16;
            app.$ui.infoStill.removeElement();
            app.$ui.infoStill = pandora.ui.flipbook(app.user.ui.item)
                                  .appendTo(that.$element);
            app.$ui.infoStill.css({
                'height': (height-16) + 'px'
            });
            that.css({
                height: height  + 'px'
            });
            pandora.resizeFolders();
            !app.user.ui.showInfo && app.$ui.leftPanel.css({bottom: -height});
            app.$ui.leftPanel.size(2, height );
        });
        app.$ui.infoTimeline.attr('src', '/'+app.user.ui.item+'/timeline.16.png');
    }
    return that;
};

