'use strict';

pandora.ui.collectionIconPanel = function(listData) {

    var quarter = 0,
        quarters = ['top-left', 'top-right', 'bottom-left', 'bottom-right'],

        ui = pandora.user.ui,
        folderItems = pandora.getFolderItems(ui.section),
        folderItem = folderItems.slice(0, -1),


        $iconPanel = Ox.Element(),

        $icon = $('<img>')
            .attr({
                src: pandora.getListIcon(ui.section, listData.id, 256)
            })
            .css({position: 'absolute', borderRadius: '64px', margin: '16px'})
            .appendTo($iconPanel),

        $previewPanel = Ox.Element(),

        $preview,

        $list = Ox.Element(),

        ui = pandora.user.ui,

        that = Ox.SplitPanel({
            elements: [
                {
                    element: $iconPanel,
                    size: 280
                },
                {
                    element: $previewPanel
                },
                {
                    element: $list,
                    size: 144 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'horizontal'
        });

    pandora.api['find' + folderItems]({
        query: {
            conditions: [{key: 'id', value: listData.id, operator: '=='}],
            operator: '&'
        },
        keys: ['posterFrames']
    }, function(result) {

        var posterFrames = result.data.items[0].posterFrames,
            posterFrame = posterFrames[quarter],

            $interface = Ox.Element({
                    tooltip: function(e) {
                        var quarterName = ($(e.target).attr('id') || '').replace('-', ' ');
                        return quarterName ? Ox._('Edit ' + quarterName + ' image') : null;
                    }
                })
                .css({
                    position: 'absolute',
                    width: '256px',
                    height: '256px',
                    marginLeft: '16px',
                    marginTop: '16px',
                    cursor: 'pointer'
                })
                .on({
                    click: function(e) {
                        clickIcon(e);
                    },
                    dblclick: function(e) {
                        clickIcon(e, true);
                    }
                })
                .appendTo($iconPanel);

        renderQuarters();

        $list = Ox.IconList({
            borderRadius: 16,
            item: function(data, sort) {
                var infoKey = ['title', 'author'].indexOf(sort[0].key) > -1
                        ? pandora.site.documentKeys.filter(function(key) {
                            return ['year', 'date'].indexOf(key.id) > -1
                        }).map(function(key) {
                            return key.id;
                        })[0] : sort[0],key,
                    size = 128;
                return {
                    height: size,
                    id: data.id,
                    info: data[infoKey] || '',
                    title: data.title,
                    url: pandora.getMediaURL('/documents/' + data.id + '/' + size + 'p.jpg?' + data.modified),
                    width: size
                };
            },
            items: function(data, callback) {
                var listData = pandora.getListData();
                pandora.api.findDocuments(Ox.extend(data, {
                    query: {
                        conditions: [{key: 'collection', value: listData.id, operator: '=='}],
                        operator: '&'
                    }
                }), callback);
            },
            keys: ['duration', 'id', 'modified', 'title'],
            max: 1,
            min: 1,
            //orientation: 'vertical',
            selected: posterFrame ? [posterFrame.document] : [],
            size: 128,
            sort: ui.collectionSort,
            unique: 'id'
        })
        //.css({width: '144px'})
        .bindEvent({
            open: function(data) {
                setPosterFrame(data.ids[0], $list.value(data.ids[0], 'posterFrame'))
            },
            select: function(data) {
                renderPreview($list.value(data.ids[0]));
            }
        })
        .bindEventOnce({
            load: function() {
                var itemData;
                if (!posterFrame) {
                    itemData = $list.value(0);
                    $list.options({selected: [itemData.id]});
                } else {
                    itemData = $list.value(posterFrame.item);
                }
                itemData && renderPreview(itemData);
            }
        })
        .gainFocus();

        that.replaceElement(2, $list);

        function clickIcon(e, isDoubleClick) {
            quarter = quarters.indexOf($(e.target).attr('id'));
            renderQuarters();
            if (isDoubleClick && posterFrames.length) {
                var item = posterFrames[quarter].item;
                $list.options({selected: [item]});
                renderPreview($list.value(item), posterFrames[quarter].page);
            }
        }

        function renderPreview(itemData, page) {
            var size = 256;
            if (itemData.id) {
                $preview = Ox.Element('<img>').attr({
                    src: pandora.getMediaURL('/documents/' + itemData.id + '/' + size + 'p.jpg?' + itemData.modified),
                })
                .css({
                    width: size + 'px',
                    height: size + 'px',
                    marginLeft: '8px', marginTop: '16px', overflow: 'hidden'
                })
                .on({
                    click: function(d) {
                        setPosterFrame(itemData.id);
                    }
                });
            } else {
                $preview = Ox.Element()
            }
            $previewPanel.empty().append($preview);
        }

        function renderQuarters() {
            $interface.empty();
            quarters.forEach(function(q, i) {
                $interface.append(
                    $('<div>')
                        .attr({id: q})
                        .css({
                            float: 'left',
                            width: '126px',
                            height: '126px',
                            border: '1px solid rgba(255, 255, 255, ' + (i == quarter ? 0.75 : 0) + ')',
                            background: 'rgba(0, 0, 0, ' + (i == quarter ? 0 : 0.75) + ')'
                        })
                        .css('border-' + q + '-radius', '64px')
                );
            });
        }

        function setPosterFrame(document, page) {
            var posterFrame = {document: document, page: page};
            if (posterFrames.length) {
                posterFrames[quarter] = posterFrame;
            } else {
                posterFrames = Ox.range(4).map(function() { return Ox.clone(posterFrame); } );
            }
            pandora.api['edit' + folderItem]({
                id: listData.id,
                posterFrames: posterFrames
            }, function() {
                $icon.attr({
                    src: pandora.getListIcon(ui.section, listData.id, 256)
                });
                pandora.$ui.folderList[listData.folder].$element
                    .find('img[src*="'
                        + pandora.getMediaURL('/' + encodeURIComponent(listData.id))
                        + '/"]'
                    )
                    .attr({
                        src: pandora.getListIcon(ui.section, listData.id, 256)
                    });
                pandora.$ui.info.updateListInfo();
            });
            $preview.options({page: page});
        }

    });

    function renderFrame() {
        $frame.css({borderRadius: 0});
        $frame.css('border-' + quarters[quarter] + '-radius', '128px');
    }

    that.updateQuery = function(key, value) {
        $list.options({
            items: function(data, callback) {
                pandora.api.find(Ox.extend(data, {
                    query: {
                        conditions: [{key: 'collection', value: listData.id, operator: '=='}].concat(
                        value !== ''
                            ? [{key: key, value: value, operator: '='}]
                            : []
                        ),
                        operator: '&'
                    }
                }), callback);
            }
        });
    };

    return that;

}
