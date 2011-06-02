// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.rightPanel = function() {
    var that;
    if (app.user.ui.section == 'site') {
        that = new Ox.Element()
            .html(app.user.ui.sitePage)
            .bindEvent({
                resize: function(event, data) {
                    
                }
            });
            pandora.api.getPage(app.user.ui.sitePage, function(result) {
                that.html(result.data.body).css({'overflow-y':'auto'});                        
            });
    } else if (app.user.ui.section == 'items') {
        that = new Ox.SplitPanel({
            elements: [
                {
                    element: app.$ui.toolbar = pandora.ui.toolbar(),
                    size: 24
                },
                {
                    element: app.$ui.contentPanel = pandora.ui.contentPanel()
                },
                {
                    element: app.$ui.statusbar = pandora.ui.statusbar(),
                    size: 16
                }
            ],
            id: 'rightPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(event, data) {
                //Ox.print('???? resize rightPanel', event, data)
                if (!app.user.ui.item) {
                    pandora.resizeGroups(data);
                    app.$ui.list.size();
                    if (app.user.ui.lists[app.user.ui.list].listView == 'map') {
                        app.$ui.map.resizeMap();
                    }
                } else {
                    app.$ui.browser.scrollToSelection();
                    app.user.ui.itemView == 'player' && app.$ui.player.options({
                        width: data
                    });
                    app.user.ui.itemView == 'timeline' && app.$ui.editor.options({
                        width: data
                    });
                }
            }
        });
    }
    return that;
};

