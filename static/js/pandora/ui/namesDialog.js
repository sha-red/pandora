// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.namesDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        numberOfNames = 0,

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
                        id: 'name',
                        operator: '+',
                        removable: false,
                        title: 'Name',
                        visible: true,
                        width: 250
                    },
                    {
                        id: 'nameSort',
                        operator: '+',
                        title: 'Sort Name',
                        visible: true,
                        width: 250
                    },
                    {
                        id: 'numberofnames',
                        align: 'right',
                        operator: '-',
                        title: 'Number of Names',
                        visible: true,
                        width: 60
                    },
                ],
                columnsRemovable: true,
                columnsVisible: true,
                items: pandora.api.findNames,
                keys: [],
                max: 1,
                scrollbarVisible: true,
                sort: [
                    {key: 'name', operator: '+'}
                ]
            })
            .bindEvent({
                init: function(data) {
                    numberOfNames = data.items;
                    $status.options({
                        title: Ox.formatNumber(numberOfNames)
                            + ' name' + (numberOfNames == 1 ? '' : 's')
                    });
                },
                select: function(data) {
                    var values;
                    $name.empty();
                    if (data.ids.length) {
                        values = $list.value(data.ids[0]);
                        $nameLabel.options({
                            title: values.name + ' &lt;' + values.nameSort + '&gt;'
                        });
                        $name.append(renderNameForm(values))
                    } else {
                        $nameLabel.options({title: 'No name selected'});
                    }
                }
            }),

        $nameLabel = Ox.Label({
                textAlign: 'center',
                title: 'No name selected',
                width: 248
            })
            .css({margin: '4px'}),

        $name = Ox.Element({}),

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
                                        .append($nameLabel),
                                    size: 24
                                },
                                {
                                    element: $name
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
            title: 'Manage Names',
            width: width
        });

    function renderNameForm(nameData) {
        var $checkbox;
        return Ox.Form({
                items: [
                    Ox.Input({
                            id: 'name',
                            label: 'Name',
                            labelWidth: 80,
                            value: nameData.name,
                            width: 240
                        })
                        .bindEvent({
                            submit: function(data) {
                                
                            }
                        }),
                    Ox.Input({
                            id: 'nameSort',
                            label: 'Sort Name',
                            labelWidth: 80,
                            value: nameData.nameSort,
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
                    var data = {id: nameData.id}, key, value;
                    data[event.id] = event.data.value;
                    $list.value(nameData.id, event.id, data[event.id]); 
                    pandora.api.editName(data, function(result) {
                        Ox.Request.clearCache('findNames');
                    });
                }
            });
    }

    function updateList(key, value) {
        var query = {
                conditions: [{key: 'name', value: value, operator: '='}],
                operator: '&'
            };
        $list.options({
            items: function(data, callback) {
                return pandora.api.findNames(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });        
    }

    return that;

};

