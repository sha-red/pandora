'use strict';

pandora.ui.editPanel = function() {

    var that = Ox.SplitPanel({
            elements: [
                {element: Ox.Element(), size: 24},
                {element: Ox.Element()},
                {element: Ox.Element(), size: 16}
            ],
            orientation: 'vertical'
        });

    pandora.user.ui.edit && render();

    function render() {
        pandora.api.getEdit({id: pandora.user.ui.edit}, function(result) {

            var edit = result.data;

            var $toolbar = Ox.Bar({size: 24}),

                $editMenu,

                $viewSelect =  Ox.Select({
                    items: [
                        {'id': 'list', 'title': Ox._('View as List')},
                        {'id': 'player', 'title': Ox._('View as Player')},
                    ],
                    value: 'list',
                    width: 128
                })
                .css({
                    float: 'left',
                    margin: '4px 0 0 4px'
                })
                .bindEvent({
                    change: function(data) {
                        $panel.replaceElement(0, pandora.$ui.edit = pandora.ui[
                            data.value == 'player' ? 'editPlayer' : 'editList'
                        ](edit));
                    },
                }).appendTo($toolbar),

                $statusbar = Ox.Bar({size: 16}),

                $panel = Ox.SplitPanel({
                    elements: [
                        {
                            element: pandora.$ui.edit = pandora.ui.editList(edit)
                        },
                        {
                            element: Ox.Element(),
                            size: 0,
                            resizable: false
                        }
                    ],
                    orientation: 'horizontal'
                });

            that.replaceElement(0, $toolbar);
            that.replaceElement(1, $panel);
            that.replaceElement(2, $statusbar);
        });
    }

    that.reload = function() {
        render();        
    }

    return that;

};

pandora.ui.editList = function(edit) {

    var height = getHeight(),
        width = getWidth(),

        that = Ox.Element()
            .css({
                'overflow-y': 'auto'
            });

    self.$list = Ox.TableList({
            columns: [
                {
                    align: 'left',
                    id: 'index',
                    operator: '+',
                    title: Ox._('Index'),
                    visible: false,
                    width: 60
                },
                {
                    align: 'left',
                    id: 'id',
                    operator: '+',
                    title: Ox._('ID'),
                    visible: false,
                    width: 60
                },
                {
                    align: 'left',
                    id: 'item',
                    operator: '+',
                    title: Ox._(pandora.site.itemName.singular),
                    visible: true,
                    width: 360
                },
                {
                    editable: true,
                    id: 'in',
                    operator: '+',
                    title: Ox._('In'),
                    visible: true,
                    width: 60
                },
                {
                    editable: true,
                    id: 'out',
                    operator: '+',
                    title: Ox._('Out'),
                    visible: true,
                    width: 60
                },
                {
                    id: 'duration',
                    operator: '+',
                    title: Ox._('Duration'),
                    visible: true,
                    width: 60
                }
            ],
            columnsMovable: true,
            columnsRemovable: true,
            columnsResizable: true,
            columnsVisible: true,
            items: edit.clips,
            scrollbarVisible: true,
            sort: [{key: 'index', operator: '+'}],
            sortable: true,
            unique: 'id'
        })
        .appendTo(that)
        .bindEvent({
            add: function(data) {
                if(pandora.user.ui.item) {
                    pandora.api.addClip({
                        edit: pandora.user.ui.edit,
                        item: pandora.user.ui.item,
                        'in': pandora.user.ui.videoPoints[pandora.user.ui.item]['in'],
                        out: pandora.user.ui.videoPoints[pandora.user.ui.item].out,
                    }, function(result) {
                        Ox.Request.clearCache();
                        pandora.$ui.rightPanel.reload()
                    });
                }
            },
            'delete': function(data) {
                if (data.ids.length > 0 && edit.editable) {
                    pandora.api.removeClip({
                        ids: data.ids,
                        edit: pandora.user.ui.edit
                    }, function(result) {
                        Ox.Request.clearCache();
                        pandora.$ui.rightPanel.reload();
                    });
                }
            },
            move: function(data) {
                Ox.Request.clearCache();
                pandora.api.sortClips({
                    edit: pandora.user.ui.edit,
                    ids: data.ids
                })
            },
            select: function(data) {
            },
            submit: function(data) {
                var value = self.$list.value(data.id, data.key);
                if (data.value != value && !(data.value === '' && value === null)) {
                    self.$list.value(data.id, data.key, data.value || null);
                    var edit = {
                        id: data.id,
                    };
                    edit[data.key] = parseFloat(data.value);
                    pandora.api.editClip(edit, function(result) {
                        self.$list.value(data.id, data.key, result.data[data.key]);
                        self.$list.value(data.id, 'duration', result.data.duration);
                    });
                }
            }
        });

    function getHeight() {
        // 24 menu + 24 toolbar + 16 statusbar + 32 title + 32 margins
        // + 1px to ge trid of scrollbar
        return window.innerHeight - 128 -1;
    }

    function getWidth() {
        return window.innerWidth
            - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
            - pandora.user.ui.embedSize - 1
            - 32;
    }

    that.update = function() {
        $text.options({
            maxHeight: getHeight(),
            width: getWidth()
        });
        return that;
    };

    return that;

};

pandora.ui.editPlayer = function(edit) {

    var that = Ox.Element()
        .css({
            overflowY: 'auto'
        });

    self.$player = Ox.VideoPlayer({
        controlsBottom: ['play', 'volume', 'previous', 'next', 'loop', 'scale', 'space', 'position'],
        controlsTop: ['fullscreen', 'space', 'open'],
        enableKeyboard: true,
        enableMouse: true,
        enablePosition: true,
        enableTimeline: true,
        height: getHeight(),
        paused: true,
        position: 0,
        video: Ox.flatten(edit.clips.map(function(clip) {
            return pandora.getClipVideos(clip);
        })),
        width: getWidth()
    }).appendTo(that);

    function getHeight() {
        // 24 menu + 24 toolbar + 16 statusbar + 32 title + 32 margins
        // + 1px to ge trid of scrollbar
        return window.innerHeight - 128 -1;
    }

    function getWidth() {
        return window.innerWidth
            - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1;
    }

    return that;
};
