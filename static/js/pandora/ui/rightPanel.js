// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.rightPanel = function() {
    var that;
    if (pandora.user.ui.section == 'site') {
        that = new Ox.Element()
            .html(pandora.user.ui.sitePage)
            .bindEvent({
                resize: function(event, data) {
                    
                }
            });
            pandora.api.getPage(pandora.user.ui.sitePage, function(result) {
                that.html(result.data.body).css({'overflow-y':'auto'});                        
            });
    } else if (pandora.user.ui.section == 'items') {
        that = new Ox.SplitPanel({
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
                //Ox.print('???? resize rightPanel', event, data)
                if (!pandora.user.ui.item) {
                    pandora.resizeGroups(data);
                    pandora.$ui.list.size();
                    if (pandora.user.ui.lists[pandora.user.ui.list].listView == 'map') {
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

