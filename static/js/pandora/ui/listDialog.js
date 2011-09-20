// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.listDialog = function(list, section) {

    var tabs = Ox.merge([
        {id: 'general', title: 'General'},
        {id: 'icon', title: 'Icon'}
    ], list.type == 'smart'
        ? {id: 'query', title: 'Query'}
        : []
    );
    Ox.getObjectById(tabs, section).selected = true;
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                if (id == 'general') {
                    return Ox.Element({}).css({padding: '16px'}).html('General');
                } else if (id == 'icon') {
                    return pandora.ui.listIconPanel(list);
                } else if (id == 'query') {
                    return pandora.$ui.filter = pandora.ui.filter(list);
                }
            },
            tabs: tabs
        })
        .bindEvent({
            change: function(data) {
                $dialog.options({
                    title: 'Smart List - ' + list.name + ' - '
                        + Ox.getObjectById(tabs, data.selected).title
                });
                if (data.selected == 'icon') {
                    $dialog.options({
                        maxWidth: 704 + Ox.UI.SCROLLBAR_SIZE,
                        minWidth: 704 + Ox.UI.SCROLLBAR_SIZE,
                        width: 704 + Ox.UI.SCROLLBAR_SIZE
                    });
                }
            }
        });

    var $dialog = Ox.Dialog({
        buttons: [
            Ox.Button({
                    id: 'debug',
                    title: 'Debug',
                })
                .bindEvent({
                    click: function() {
                        alert(JSON.stringify(pandora.$ui.filter.options('query')));
                    }
                }),
            /*
            Ox.Button({
                    id: 'cancel',
                    title: 'Cancel'
                })
                .bindEvent({
                    click: function() {
                        pandora.$ui.filterDialog.close();
                    }
                }),
            */
            Ox.Button({
                    id: 'done',
                    title: 'Done'
                })
                .bindEvent({
                    click: function() {
                        pandora.$ui.filterDialog.close();
                    }
                })
        ],
        content: $tabPanel,
        maxWidth: (section == 'icon' ? 704 : 648) + Ox.UI.SCROLLBAR_SIZE,
        minHeight: 312,
        minWidth: (section == 'icon' ? 704 : 648) + Ox.UI.SCROLLBAR_SIZE,
        height: 312,
        // keys: {enter: 'save', escape: 'cancel'},
        //title: list ? 'Smart List - ' + list.name : 'Advanced Find',
        title: 'Smart List - ' + list.name + ' - '
            + Ox.getObjectById(tabs, section).title,
        width: (section == 'icon' ? 704 : 648) + Ox.UI.SCROLLBAR_SIZE
    });

    return $dialog;

};

pandora.ui.listIconPanel = function(list) {

    var quarter = 'top-left';

    var $interface = Ox.Element({
            tooltip: function(e) {
                return 'Edit ' + $(e.target).attr('id').replace('-', ' ') + ' image';
            }
        })
        .css({position: 'absolute', width: '256px', height: '256px', margin: '16px', cursor: 'pointer'})
        .click(function(e) {
            quarter = $(e.target).attr('id');
            renderQuarters();
        });

    var $list = Ox.IconList({
        borderRadius: 16,
        item: function(data, sort) {
            var size = 128;
            return {
                height: size,
                id: data.id,
                info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
                title: data.title + (data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
                url: '/' + data.id + '/icon' + size + '.jpg',
                width: size
            };
        },
        items: function(data, callback) {
            //Ox.print('data, pandora.Query.toObject', data, pandora.Query.toObject())
            pandora.api.find(Ox.extend(data, {
                query: {
                    conditions: [{key: 'list', value: list.id, operator: '='}],
                    operator: '&'
                }
            }), callback);
        },
        keys: ['director', 'duration', 'id', 'title', 'videoRatio', 'year'],
        max: 1,
        min: 1,
        orientation: 'vertical',
        size: 128,
        sort: pandora.user.ui.lists[pandora.user.ui.list].sort,
        unique: 'id'
    })
    .css({width: '144px'})
    .bindEvent({
        select: function(data) {
            var value = $list.value(data.ids[0]);
            //frameCSS['border-' + quarter + '-radius'] = '120px';
            Ox.print("$$$", value)
            $preview.empty().append(
                    pandora.ui.videoPreview({
                        duration: value.duration,
                        frameRatio: value.videoRatio,
                        height: 256,
                        id: value.id,
                        width: 240
                    })
                    .css({margin: '16px', overflow: 'hidden'})
            );
        }
    })   
    
    var $preview = Ox.Element()
        .css({width: '256px', height: '256px'});

    renderQuarters();

    function renderFrame() {
        $frame.css({borderRadius: 0});
        $frame.css('border-' + quarter + '-radius', '128px');
    }

    function renderQuarters() {
        $interface.empty();
        ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(function(q) {
            $interface.append(
                $('<div>')
                    .attr({id: q})
                    .css({
                        float: 'left',
                        width: '126px',
                        height: '126px',
                        border: '1px solid rgba(255, 255, 255, ' + (q == quarter ? 0.75 : 0) + ')',
                        background: 'rgba(0, 0, 0, ' + (q == quarter ? 0 : 0.75) + ')'
                    })
                    .css('border-' + q + '-radius', '64px')
            );
        });
    }
        
    var that = Ox.SplitPanel({
        elements: [
            {
                element: Ox.Element({}).append(
                    $('<img>').css({position: 'absolute', margin: '16px'}).attr({src: '/static/png/icon256.png'})
                ).append(
                    $interface
                ),
                size: 288
            },
            {
                element: Ox.SplitPanel({
                    elements: [
                        {
                            element: Ox.Bar({size: 24}).append(
                                Ox.FormElementGroup({
                                        elements: [
                                            pandora.$ui.findIconItemSelect = Ox.Select({
                                                items: pandora.site.findKeys,
                                                overlap: 'right',
                                                type: 'image'
                                            })
                                            .bindEvent({
                                                change: function(data) {

                                                }
                                            }),
                                            pandora.$ui.findIconItemInput = Ox.Input({
                                                changeOnKeypress: true,
                                                clear: true,
                                                placeholder: 'Find: Foo',
                                                width: 120
                                            })
                                            .bindEvent({
                                                change: function(data) {

                                                }
                                            })
                                        ],
                                    })
                                    .css({
                                        float: 'right',
                                        margin: '4px',
                                        align: 'right'
                                    })
                            ),
                            size: 24
                        },
                        {
                            element: $list
                        }
                    ],
                    orientation: 'vertical'
                })
            },
            {
                element: $preview,
                size: 272                
            }
        ],
        orientation: 'horizontal'
    })
    return that;
}
