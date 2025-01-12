'use strict';

pandora.ui.rightPanel = function() {
    var that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.toolbar = pandora.ui.toolbar(),
                    size: 24
                },
                {
                    element: pandora.$ui.contentPanel = pandora.ui.contentPanel()
                }
            ],
            id: 'rightPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                var clipsItems, previousClipsItems;
                if (!pandora.user.ui.item) {
                    pandora.resizeFilters();
                    pandora.$ui.list && pandora.$ui.list.size();
                    if (pandora.user.ui.listView == 'clips') {
                        if (pandora.$ui.list) {
                            clipsItems = pandora.getClipsItems();
                            previousClipsItems = pandora.getClipsItems(pandora.$ui.list.options('width'));
                            pandora.$ui.list.options({width: data.size});
                            if (clipsItems != previousClipsItems) {
                                Ox.Request.clearCache(); // fixme
                                pandora.$ui.list.reloadList(true);
                            }
                        }
                    } else if (pandora.user.ui.listView == 'timelines') {
                        pandora.$ui.list && pandora.$ui.list.options({width: data.size});
                    } else if (pandora.user.ui.listView == 'map') {
                        pandora.$ui.map && pandora.$ui.map.resizeMap();
                    } else if (pandora.user.ui.listView == 'calendar') {
                        pandora.$ui.calendar && pandora.$ui.calendar.resizeCalendar();
                    } else if (pandora.user.ui.listView == 'video') {
                        pandora.$ui.list && pandora.$ui.list.resize();
                    }
                } else {
                    pandora.$ui.browser && pandora.$ui.browser.scrollToSelection();
                    if (pandora.user.ui.itemView == 'documents') {
                        pandora.$ui.documents && pandora.$ui.documents.updateSize();
                    } else if (pandora.user.ui.itemView == 'clips') {
                        pandora.$ui.clipList && pandora.$ui.clipList.size();
                    } else if (pandora.user.ui.itemView == 'timeline') {
                        pandora.$ui.timeline && pandora.$ui.timeline.options({width: data.size});
                    } else if (pandora.user.ui.itemView == 'player') {
                        pandora.$ui.player && pandora.$ui.player.options({width: data.size});
                    } else if (pandora.user.ui.itemView == 'editor') {
                        pandora.$ui.editor && pandora.$ui.editor.options({width: data.size});
                    } else if (pandora.user.ui.listView == 'map') {
                        pandora.$ui.map && pandora.$ui.map.resizeMap();
                    } else if (pandora.user.ui.listView == 'calendar') {
                        pandora.$ui.calendar && pandora.$ui.calendar.resizeCalendar();
                    } else if (pandora.user.ui.listView == 'video') {
                        pandora.$ui.list && pandora.$ui.list.size();
                    }
                }
            }
        });
    return that;
};

