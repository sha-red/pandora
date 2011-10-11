// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.titlesDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = 512 + Ox.UI.SCROLLBAR_SIZE,
        numberOfTitles = 0,

        $status = Ox.Label({
                title: 'Loading...'
            })
            .css({float: 'left', margin: '4px'}),

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: 'Find: All'}
                ],
                overlap: 'right',
                type: 'image'
            })
            .bindEvent({
                change: function(data) {
                    var key = data.selected[0].id,
                        value = $findInput.value();
                    value && updateList(key, value);
                    $findInput.options({
                        placeholder: data.selected[0].title
                    });
                }
            }),

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: 'Find: All',
                width: 192
            })
            .bindEvent({
                change: function(data) {
                    var key = $findSelect.value(),
                        value = data.value;
                    updateList(key, value);
                }
            }),

        $findElement = Ox.FormElementGroup({
                elements: [
                    $findSelect,
                    $findInput
                ]
            })
            .css({float: 'right', margin: '4px'}),

        $list = Ox.TextList({
                columns: [
                    {
                        id: 'id',
                        title: 'ID',
                        unique: true,
                        visible: false,
                    },
                    {
                        id: 'title',
                        operator: '+',
                        removable: false,
                        title: 'Title',
                        visible: true,
                        width: 256
                    },
                    {
                        editable: true,
                        id: 'sorttitle',
                        operator: '+',
                        title: 'Sort Title',
                        visible: true,
                        width: 256
                    },
                ],
                columnsRemovable: true,
                columnsVisible: true,
                items: pandora.api.findTitles,
                keys: [],
                max: 1,
                scrollbarVisible: true,
                sort: [{key: 'sorttitle', operator: '+'}]
            })
            .bindEvent({
                init: function(data) {
                    numberOfTitles = data.items;
                    $status.options({
                        title: Ox.formatNumber(numberOfTitles)
                            + ' title' + (numberOfTitles == 1 ? '' : 's')
                    });
                },
                submit: function(data) {
                    pandora.api.editTitle({
                        id: data.id,
                        sortname: data.sortname
                    });
                }
            }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'done',
                    title: 'Done'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.SplitPanel({
                elements: [
                    {
                        element: Ox.Bar({size: 24})
                            .append($status)
                            .append(
                                $findElement
                            ),
                        size: 24
                    },
                    {
                        element: $list
                    }
                ],
                orientation: 'vertical'
            }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: 'Manage Titles',
            width: width
        });

    function updateList(key, value) {
        var query = {
                conditions: [{key: 'title', value: value, operator: '='}],
                operator: '&'
            };
        $list.options({
            items: function(data, callback) {
                return pandora.api.findTitles(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });        
    }

    return that;

};

