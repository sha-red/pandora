// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.rightPanel = function() {
    var that;
    if (pandora.user.ui.section == 'items') {
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
            resize: function(data) {
                if (!pandora.user.ui.item) {
                    pandora.resizeGroups();
                    pandora.$ui.list.size();
                    if (pandora.user.ui.listView == 'clips') {
                        var clipsItems = pandora.getClipsItems();
                            previousClipsItems = pandora.getClipsItems(pandora.$ui.list.options('width'));
                        pandora.$ui.list.options({width: data.size});
                        if (clipsItems != previousClipsItems) {
                            Ox.Request.clearCache(); // fixme
                            pandora.$ui.list.reloadList(true);
                        }
                    } else if (pandora.user.ui.listView == 'timelines') {
                        pandora.$ui.list.options({width: data.size});
                    } else if (pandora.user.ui.listView == 'map') {
                        pandora.$ui.map.resizeMap();
                    } else if (pandora.user.ui.listView == 'calendar') {
                        pandora.$ui.calendar.resizeCalendar();
                    }
                } else {
                    pandora.$ui.browser.scrollToSelection();
                    if (pandora.user.ui.itemView == 'clips') {
                        pandora.$ui.clipList.size();
                    } else if (pandora.user.ui.itemView == 'video') {
                        pandora.$ui.player.options({width: data.size});
                    } else if (pandora.user.ui.itemView == 'timeline') {
                        pandora.$ui.editor.options({width: data.size});
                    } else if (pandora.user.ui.listView == 'map') {
                        pandora.$ui.map.resizeMap();
                    } else if (pandora.user.ui.listView == 'calendar') {
                        pandora.$ui.calendar.resizeCalendar();
                    }
                }
            }
        });
    }
    return that;
};

