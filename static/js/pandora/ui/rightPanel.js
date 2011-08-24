// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.rightPanel = function() {
    var that;
    if (pandora.user.ui.section == 'site') {
        if (pandora.user.ui.sitePage == 'home') {
            that = pandora.ui.homePage()
                .bindEvent({
                    resize: function(data) {
                        that.resize();
                    }
                });
        } else {
            that = Ox.Element().css({padding: '8px'});
            pandora.api.getPage(pandora.user.ui.sitePage, function(result) {
                that.html(result.data.body).css({overflowY: 'auto'});                        
            });
        }
    } else if (pandora.user.ui.section == 'items') {
        that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.toolbar = pandora.ui.toolbar(),
                    size: 24
                },
                {
                    element: pandora.$ui.contentPanel = pandora.ui.contentPanel()
                },
                {
                    element: pandora.$ui.statusbar = pandora.ui.statusbar(),
                    size: 16
                }
            ],
            id: 'rightPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(event, data) {
                if (!pandora.user.ui.item) {
                    pandora.resizeGroups();
                    pandora.$ui.list.size();
                    if (pandora.user.ui.lists[pandora.user.ui.list].listView == 'timelines') {
                        pandora.$ui.list.options({
                            width: data
                        });
                    } else if (pandora.user.ui.lists[pandora.user.ui.list].listView == 'map') {
                        pandora.$ui.map.resizeMap();
                    }
                } else {
                    pandora.$ui.browser.scrollToSelection();
                    pandora.user.ui.itemView == 'player' && pandora.$ui.player.options({
                        width: data
                    });
                    pandora.user.ui.itemView == 'timeline' && pandora.$ui.editor.options({
                        width: data
                    });
                }
            }
        });
    }
    return that;
};

