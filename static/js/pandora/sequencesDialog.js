// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.sequencesDialog = function() {

    var data = pandora.getItemIdAndPosition(),
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        mode = pandora.user.ui.sequenceMode,
        sidebarWidth = 144,
        $list,
        $tabPanel = Ox.TabPanel({
            content: function(mode) {
                var $splitPanel = Ox.SplitPanel({
                        elements: [
                            {
                                element: Ox.Element(),
                                size: sidebarWidth
                            },
                            {
                                element: Ox.Element()
                            }
                        ],
                        orientation: 'horizontal'
                    });
                pandora.api.getSequence({
                    id: data.id,
                    mode: mode,
                    position: data.position
                }, function(result) {
                    // result.data: {hash, in, out}
                    var fixedRatio = 16/9,
                        hash = result.data.hash,
                        $sidebar = Ox.Element(); // add video player
                    $list = Ox.IconList({
                            fixedRatio: fixedRatio,
                            item: function(data, sort, size) {
                                var ratio = data.videoRatio,
                                    width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio),
                                    height = Math.round(width / ratio);
                                return {
                                    height: height,
                                    id: data.id,
                                    info: Ox.formatDuration(data['in']) + ' - ' + Ox.formatDuration(data.out),
                                    title: data.title + (data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
                                    url: '/' + data.id.split('/')[0] + '/' + height + 'p' + data['in'] + '.jpg',
                                    width: width
                                };
                            },
                            items: function(data, callback) {
                                pandora.api.findSequences(Ox.extend(data, {
                                    query: {
                                        conditions: [
                                            {key: 'mode', value: mode, operator: '=='},
                                            {key: 'hash', value: hash, operator: '=='}
                                        ],
                                        operator: '&'
                                    }
                                }), callback);
                            },
                            keys: ['director', 'id', 'title', 'videoRatio'],
                            max: 1,
                            orientation: 'both',
                            size: 128,
                            sort: pandora.user.ui.sequenceSort,
                            unique: 'id'
                        })
                        .bindEvent({
                            init: function(data) {
                                $status.html(
                                    Ox.formatNumber(data.items) + ' Clip'
                                    + (data.items == 1 ? '' : 's')
                                );
                            },
                            open: openClip,
                            select: function(data) {
                                $dialog[
                                    data.ids.length ? 'enableButton' : 'disableButton'
                                ]('open');
                            }
                        });
                    $splitPanel.replaceElement(0, $sidebar);
                    $splitPanel.replaceElement(1, $list);
                });
                return $splitPanel;                
            },
            tabs: [
                {id: 'shape', title: 'Similar Shapes'},
                {id: 'color', title: 'Similar Colors'}
            ]
        }),
        $dialog = Ox.Dialog({
            buttons: [
                Ox.Button({
                    disabled: true,
                    id: 'open',
                    title: 'Open Selected Clip',
                    width: 128
                }).bindEvent({
                    click: openClip
                }),
                Ox.Button({
                    id: 'close',
                    title: 'Close',
                    width: 64
                }).bindEvent({
                    click: function() {
                        $dialog.close();
                    }
                })
            ],
            closeButton: true,
            content: $tabPanel,
            height: dialogHeight,
            keys: {escape: 'close'},
            maximizeButton: true,
            padding: 0,
            removeOnClose: true,
            title: 'Similar Clips',
            width: dialogWidth
        }),
        $toolbar = $tabPanel.children('.OxBar'),
        $orderButton = Ox.Button({
                title: getTitle(),
                tooltip: getTooltip(),
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({sequenceSort: [{
                        key: pandora.user.ui.sequenceSort[0].key,
                        operator: pandora.user.ui.sequenceSort[0].operator == '+' ? '-' : '+'
                    }]});
                    updateButton();
                }
            })
            .css({float: 'right', margin: '4px 4px 4px 2px'})
            .appendTo($toolbar),
        $sortSelect = Ox.Select({
                items: ['title', 'director', 'position', 'duration'].map(function(id) {
                    return {id: id, title: 'Sort by ' + Ox.toTitleCase(id)};
                }),
                width: 128
            })
            .bindEvent({
                change: function(data) {
                    var key = data.value;
                    pandora.UI.set({sequenceSort: [{
                        key: key,
                        operator: pandora.getSortOperator(key)
                    }]});
                }
            })
            .css({float: 'right', margin: '4px 2px'})
            .appendTo($toolbar),
        $statusbar = $dialog.children('.OxButtonsbar'),
        $status = Ox.Element()
            .css({
                margin: '6px 0 0 204px', // 4 + 128 + 4 + 64 + 4
                fontSize: '9px',
                textAlign: 'center'
            })
            .appendTo($statusbar);

    function getTitle() {
        return pandora.user.ui.sequenceSort[0].operator == '+' ? 'up' : 'down';
    }
    function getTooltip() {
        return pandora.user.ui.sequenceSort[0].operator == '+' ? 'Ascending' : 'Descending';
    }
    function openClip() {
        var selected = $list.options('selected')[0],
            split = selected.replace('-', '/').split('/'),
            item = split[0],
            // FIXME: should be split[1] and split[2],
            // but API currently returns 'id/mode/in-out'
            inPoint = parseFloat(split[2]),
            outPoint = parseFloat(split[3]),
            set = {
                item: split[0],
                itemView: pandora.user.ui.videoView
            };
        set['videoPoints.' + split[0]] = {
            annotation: '',
            'in': inPoint,
            out: outPoint,
            position: inPoint
        };
        Ox.print(selected, '???', set);
        $dialog.close();
        pandora.UI.set(set)
    }
    function updateButton() {
        that.options({
            title: getTitle(),
            tooltip: getTooltip()
        });
    }

    return $dialog;

};
