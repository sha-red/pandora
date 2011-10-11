// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.titlesDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
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
                        width: 250
                    },
                    {
                        id: 'titleSort',
                        operator: '+',
                        title: 'Sort Title',
                        visible: true,
                        width: 250
                    },
                ],
                columnsRemovable: true,
                columnsVisible: true,
                items: pandora.api.findTitles,
                keys: [],
                max: 1,
                scrollbarVisible: true,
                sort: [
                    {key: 'title', operator: '+'}
                ]
            })
            .bindEvent({
                init: function(data) {
                    numberOfTitles = data.items;
                    $status.options({
                        title: Ox.formatNumber(numberOfTitles)
                            + ' title' + (numberOfTitles == 1 ? '' : 's')
                    });
                },
                select: function(data) {
                    var values;
                    $title.empty();
                    if (data.ids.length) {
                        values = $list.value(data.ids[0]);
                        $titleLabel.options({
                            title: values.title + ' &lt;' + values.titleSort + '&gt;'
                        });
                        $title.append(renderTitleForm(values))
                    } else {
                        $titleLabel.options({title: 'No title selected'});
                    }
                }
            }),

        $titleLabel = Ox.Label({
                textAlign: 'center',
                title: 'No title selected',
                width: 248
            })
            .css({margin: '4px'}),

        $title = Ox.Element({}),

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
                        element: Ox.SplitPanel({
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
                        })      
                    },
                    {
                        element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append($titleLabel),
                                    size: 24
                                },
                                {
                                    element: $title
                                }
                            ],
                            orientation: 'vertical'
                        }),
                        size: 256
                    }
                ],
                orientation: 'horizontal'
            }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: 'Manage Titles',
            width: width
        });

    function renderTitleForm(titleData) {
        var $checkbox;
        return Ox.Form({
                items: [
                    Ox.Input({
                            id: 'title',
                            label: 'Title',
                            labelWidth: 80,
                            value: titleData.title,
                            width: 240
                        })
                        .bindEvent({
                            submit: function(data) {
                                
                            }
                        }),
                    Ox.Input({
                            id: 'titleSort',
                            label: 'Sort Title',
                            labelWidth: 80,
                            value: titleData.titleSort,
                            width: 240
                        })
                        .bindEvent({
                            submit: function(data) {

                            }
                        }),
                ],
                width: 240
            })
            .css({margin: '8px'})
            .bindEvent({
                change: function(event) {
                    var data = {id: titleData.id}, key, value;
                    data[event.id] = event.data.value;
                    $list.value(titleData.id, event.id, data[event.id]); 
                    pandora.api.editTitle(data, function(result) {
                        Ox.Request.clearCache('findTitles');
                    });
                }
            });
    }

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

