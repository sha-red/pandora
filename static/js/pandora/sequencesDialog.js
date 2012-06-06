// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.sequencesDialog = function(id, position) {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        mode = pandora.user.ui.sequenceMode,
        sidebarWidth = 144,
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
                pandora.api.getSequence({id: id, mode: mode, position: position}, function(result) {
                    // result.data: {hash, in, out}
                    var fixedRatio = 16/9,
                        hash = result.data.hash,
                        $sidebar = Ox.Element(), // add video player
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
                                open: function(data) {
                                    // ...
                                },
                                openpreview: function(data) {
                                    // ...
                                },
                                select: function(data) {
                                    // ...
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
                    id: 'close',
                    title: 'Close'
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
        });

    return $dialog;

};
