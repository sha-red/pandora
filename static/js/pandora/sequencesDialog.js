// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.sequencesDialog = function() {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        fixedRatio = 16/9,
        fps = 25,
        item = pandora.getItemIdAndPosition(),
        mode = pandora.user.ui.sequenceMode,
        sequence,
        sidebarWidth = 160,
        $item,
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
                    $dialog && $dialog.disableButton('open');
                    pandora.api.get({
                        id: item.id,
                        keys: ['director', 'duration', 'title', 'videoRatio']
                    }, function(result) {
                        Ox.extend(item, result.data);
                        pandora.api.getSequence({
                            id: item.id,
                            mode: mode,
                            position: item.position
                        }, function(result) {
                            // result.data: {hash, id, in, out}
                            sequence = Ox.extend({}, item, result.data);
                            $item = Ox.IconList({
                                    fixedRatio: fixedRatio,
                                    item: getItem,
                                    /*
                                    items: [item],
                                    */
                                    ///*
                                    items: function(data, callback) {
                                        setTimeout(function() {
                                            callback({
                                                data: {items: data.keys ? [sequence] : 1},
                                                status: {code: 200, text: 'ok'}
                                            });
                                        }, 250);
                                    },
                                    //*/
                                    max: 0,
                                    orientation: 'both',
                                    size: 128,
                                    sort: [{key: 'id', operator: '+'}],
                                    unique: 'id'
                                });
                            $list = Ox.IconList({
                                    fixedRatio: fixedRatio,
                                    item: getItem,
                                    items: function(data, callback) {
                                        pandora.api.findSequences(Ox.extend(data, {
                                            query: {
                                                conditions: [
                                                    {key: 'id', value: sequence.id, operator: '!='},
                                                    {key: 'mode', value: mode, operator: '=='},
                                                    {key: 'hash', value: sequence.hash, operator: '=='}
                                                ],
                                                operator: '&'
                                            }
                                        }), callback);
                                    },
                                    keys: ['director', 'id', 'title', 'videoRatio'],
                                    max: 1,
                                    orientation: 'both',
                                    size: 128,
                                    sort: Ox.clone(pandora.user.ui.sequenceSort),
                                    unique: 'id'
                                })
                                .bindEvent({
                                    init: function(data) {
                                        $status.html(
                                            Ox.formatNumber(data.items) + ' Clip'
                                            + (data.items == 1 ? '' : 's')
                                        );
                                    },
                                    open: changeClip,
                                    select: function(data) {
                                        $dialog[
                                            data.ids.length ? 'enableButton' : 'disableButton'
                                        ]('open');
                                    },
                                    pandora_sequencesort: function(data) {
                                        Ox.print('SEQUENCESORT:', data)
                                        $list.options({sort: data.value});
                                    }
                                });
                            Ox.print('SEQUENCE::', sequence)
                            $clipButtons[sequence['in'] > 0 ? 'enableButton' : 'disableButton']('previous');
                            $clipButtons[sequence.out < item.duration ? 'enableButton' : 'disableButton']('next');
                            $splitPanel.replaceElement(0, $item);
                            $splitPanel.replaceElement(1, $list);
                            $image.attr({src: getImageURL(mode, sequence.hash)});
                        });
                    });
                    return $splitPanel;                
                },
                tabs: [
                    {id: 'shape', title: 'Similar Shapes', selected: pandora.user.ui.sequenceMode == 'shape'},
                    {id: 'color', title: 'Similar Colors', selected: pandora.user.ui.sequenceMode == 'color'}
                ]
            })
            .bindEvent({
                change: function(data) {
                    pandora.UI.set({sequenceMode: data.selected});
                }
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

        $clipButtons = Ox.ButtonGroup({
                buttons: [
                    {id: 'previous', title: 'left', disabled: true},
                    {id: 'next', title: 'right', disabled: true}
                ],
                type: 'image'
            })
            .css({float: 'left', width: '32px', margin: '4px'})
            .bindEvent({
                click: function(data) {
                    item.position = data.id == 'previous'
                        ? sequence['in'] - 1 / fps : sequence.out;
                    $status.html('Loading...');
                    $tabPanel.reloadPanel();
                }
            })
            .appendTo($toolbar),

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
                    updateOrderButton();
                    $list.options({sort: pandora.user.ui.sequenceSort});
                }
            })
            .css({float: 'right', margin: '4px 4px 4px 2px'})
            .appendTo($toolbar),

        $sortSelect = Ox.Select({
                items: ['title', 'director', 'position', 'duration'].map(function(id) {
                    return {
                        id: id,
                        title: 'Sort by ' + Ox.toTitleCase(id)
                    };
                }),
                value: pandora.user.ui.sequenceSort[0].key,
                width: 128
            })
            .bindEvent({
                change: function(data) {
                    var key = data.value;
                    pandora.UI.set({sequenceSort: [{
                        key: key,
                        operator: pandora.getSortOperator(key)
                    }]});
                    updateOrderButton();
                    $list.options({sort: pandora.user.ui.sequenceSort});
                }
            })
            .css({float: 'right', margin: '4px 2px'})
            .appendTo($toolbar),

        $statusbar = $dialog.children('.OxButtonsbar'),

        $image = $('<img>')
            .attr({src: getImageURL()})
            .css({
                float: 'left',
                width: '24px',
                height: '16px',
                borderRadius: '2px',
                margin: '4px 4px 4px 8px',
                boxShadow: '0 0 1px rgb(128, 128, 128)'
            })
            .appendTo($statusbar),

        $status = Ox.Element()
            .css({
                float: 'left',
                width: dialogWidth - 408 + 'px', // 2 * (4 + 128 + 4 + 64 + 4)
                margin: '6px 0 0 168px', // 4 + 128 + 4 + 64 + 4 - 8 - 24 - 4
                fontSize: '9px',
                textAlign: 'center'
            })
            .html('Loading...')
            .appendTo($statusbar);

    $($tabPanel.find('.OxButtonGroup')[0]).css({width: '256px'});

    function changeClip(data) {
        var split = data.ids[0].replace('-', '/').split('/');
        item.id = split[0];
        item.position = parseFloat(split[1]);
        $status.html('Loading...');
        $tabPanel.reloadPanel();
    }

    function getImageURL(mode, hash) {
        var canvas = $('<canvas>').attr({width: 8, height: 8})[0],
            context = canvas.getContext('2d'),
            imageData = context.getImageData(0, 0, 8, 8),
            data = imageData.data;
        if (mode == 'shape') {
            Ox.loop(8, function(y) {
                var value = parseInt(hash.substr(14 - y * 2, 2), 16);
                Ox.loop(8, function(x) {
                    var color = value & Math.pow(2, x) ? 255 : 0,
                        index = y * 32 + x * 4;
                    Ox.loop(3, function(i) {
                        data[index + i] = color;
                    });
                    data[index + 3] = 255;
                });
            });
        } else if (mode == 'color') {
            Ox.loop(8, function(part) {
                var x = part % 4 * 2,
                    y = Math.floor(part / 4) * 4,
                    value = parseInt(hash.substr(14 - part * 2, 2), 16),
                    // RRRGGGBB
                    color = [
                        (value >> 5) * 32,
                        (value >> 2 & 7) * 32,
                        (value & 3) * 64
                    ];
                Ox.loop(4, function(dy) {
                   Ox.loop(2, function(dx) {
                       var index = (y + dy) * 32 + (x + dx) * 4;
                       Ox.loop(3, function(i) {
                           data[index + i] = color[i];
                       });
                       data[index + 3] = 255;
                   });
                });
            });
        }
        context.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }

    function getItem(data, sort, size) {
        var ratio = data.videoRatio,
            width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio),
            height = Math.round(width / ratio);
        return {
            height: height,
            id: data.id,
            info: Ox.formatDuration(data['in'], 2) + '-' + Ox.formatDuration(data.out, 2),
            title: data.title + (data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
            url: '/' + data.id.split('/')[0] + '/' + height + 'p' + data['in'] + '.jpg',
            width: width
        };
    }

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
            inPoint = parseFloat(split[1]),
            outPoint = parseFloat(split[2]),
            set = {
                item: item,
                itemView: pandora.user.ui.videoView
            };
        set['videoPoints.' + split[0]] = {
            annotation: '',
            'in': inPoint,
            out: outPoint,
            position: inPoint
        };
        $dialog.close();
        pandora.UI.set(set)
    }

    function updateOrderButton() {
        $orderButton.options({
            title: getTitle(),
            tooltip: getTooltip()
        });
    }

    return $dialog;

};
