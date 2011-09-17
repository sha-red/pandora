// vim: et:ts=4:sw=4:sts=4:ft=javascript

Ox.FilesView = function(options, self) {

    var self = self || {},
        that = Ox.Element({}, self)
            .defaults({
                id: ''
            })
            .options(options || {});

    self.selected = [];

    self.$toolbar = Ox.Bar({
        size: 24
    });

    self.$userSelect = Ox.Select({
            items: [
                {id: 'admin', title: 'Admin', disabled: true},
                {id: 'j', title: 'User: j', checked: true},
                {id: 'rlx', title: 'User: rlx'},
                {},
                {id: 'admin', title: 'Staff', disabled: true},
                {},
                {id: 'admin', title: 'Member', disabled: true}
            ]
        })
        .css({
            float: 'left',
            width: '128px',
            margin: '4px'
        })
        .appendTo(self.$toolbar);

    self.$moveButton = Ox.Button({
            disabled: 'true',
            title: 'Move Selected Files...'
        })
        .css({
            float: 'right',
            margin: '4px'
        })
        .appendTo(self.$toolbar);

    self.$filesList = Ox.TextList({
            columns: [
                {
                    align: 'left',
                    id: 'users',
                    operator: '+',
                    title: 'Users',
                    visible: true,
                    width: 120
                },
                {
                    align: 'left',
                    id: 'folder',
                    operator: '+',
                    title: 'Folder',
                    visible: true,
                    width: 180
                },
                {
                    align: 'left',
                    id: 'name',
                    operator: '+',
                    title: 'Name',
                    visible: true,
                    width: 360
                },
                {
                    align: 'left',
                    id: 'type',
                    operator: '+',
                    title: 'Type',
                    visible: true,
                    width: 60
                },
                {
                    align: 'right',
                    id: 'part',
                    operator: '+',
                    title: 'Part',
                    visible: true,
                    width: 60
                },
                {
                    align: 'right',
                    format: {type: 'value', args: ['B']},
                    id: 'size',                    
                    operator: '-',
                    title: 'Size',
                    visible: true,
                    width: 90
                },
                {
                    align: 'right',
                    format: {type: 'resolution', args: ['px']},
                    id: 'resolution',
                    operator: '-',
                    title: 'Resolution',
                    visible: true,
                    width: 90
                },
                {
                    align: 'right',
                    format: {type: 'duration', args: [0, 'short']},
                    id: 'duration',
                    operator: '-',
                    title: 'Duration',
                    visible: true,
                    width: 90
                },
                {
                    align: 'left',
                    id: 'id',
                    operator: '+',
                    title: 'ID',
                    unique: true,
                    visible: false,
                    width: 120
                },
                {
                    align: 'left',
                    id: 'instances',
                    operator: '+',
                    title: 'Instances',
                    visible: false,
                    width: 120
                }
            ],
            columnsMovable: true,
            columnsRemovable: true,
            columnsResizable: true,
            columnsVisible: true,
            id: 'files',
            items: function(data, callback) {
                pandora.api.findFiles($.extend(data, {
                    query: {
                        conditions: [{
                            key: 'id',
                            value: self.options.id,
                            operator: '='
                        }]
                    }
                }), callback);
            },
            scrollbarVisible: true,
            sort: [{key: 'name', operator: '+'}]
        })
        .bindEvent({
            open: openFiles,
            select: selectFiles
        });

    self.$instancesList = Ox.TextList({
        columns: [
            {
                align: 'left',
                id: 'user',
                operator: '+',
                title: 'User',
                visible: true,
                width: 120
            },
            {
                align: 'left',
                id: 'volume',
                operator: '+',
                title: 'Volume',
                visible: true,
                width: 120
            },
            {
                align: 'left',
                id: 'folder',
                operator: '+',
                title: 'Folder',
                visible: true,
                width: 180
            },
            {
                align: 'left',
                id: 'name',
                operator: '+',
                title: 'Name',
                visible: true,
                width: 360
            },
        ],
        columnsMovable: true,
        columnsRemovable: true,
        columnsResizable: true,
        columnsVisible: true,
        id: 'files',
        items: [],
        scrollbarVisible: true,
        sort: [{key: 'user', operator: '+'}]
    });

    self.$movieLabel = Ox.Label({
            textAlign: 'center',
            title: 'Move Selected Files to Another Movie',
            width: 240
        })
        .css({margin: '8px'});

    ['title', 'director', 'year', 'id'].forEach(function(key) {
        self['$' + key + 'Input'] = Ox.Input({
            clear: true,
            id: key,
            label: key == 'id' ? 'ID' : Ox.toTitleCase(key),
            labelWidth: 64,
            width: 240
        })
        .bindEvent({
            change: function(data) {
                var conditions;
                if (data.value.length) {
                    if (key == 'id') {
                        conditions = [{key: 'id', value: data.value, operator: '='}]
                    } else {
                        conditions = Ox.map(['title', 'director', 'year'], function(key) {
                            var value = self['$' + key + 'Input'].options('value')
                            return value.length ? {key: key, value: value, operator: '='} : null;
                        })
                    }
                    pandora.api.find({
                        keys: ['title', 'director', 'year', 'id'],
                        query: {
                            conditions: conditions,
                            operator: '&'
                        },
                        range: [0, 2]
                    }, function(result) {
                        var length = result.data.items.length;
                        if (length == 0) {
                            if (key != 'id') {
                                self.$idInput.options({value: ''});
                            }
                        } else if (result.data.items.length == 1) {
                            ['title', 'director', 'year', 'id'].forEach(function(key) {
                                self['$' + key + 'Input'].options({
                                    value: key == 'director'
                                        ? result.data.items[0][key].join(', ')
                                        : result.data.items[0][key]
                                });
                            });
                        } else {
                            self.$idInput.options({value: ''});
                        }
                    })
                }
            }
        });
    });

    self.$checkbox = Ox.Checkbox({
        checked: false,
        id: 'go',
        title: 'Go to this movie after moving files', // fixme: wrong, can be 'Go to video' etc
        width: 240
    });

    self.$movieForm = Ox.Form({
            items: [
                self.$titleInput,
                self.$directorInput,
                self.$yearInput,
                self.$idInput,
                self.$checkbox
            ],
            width: 240
        })
        .css({margin: '8px'});

    self.$clearButton = Ox.Button({
            title: 'Clear Form',
            width: 116
        })
        .css({margin: '0 4px 4px 8px'})
        .bindEvent({
            click: function() {
                ['title', 'director', 'year', 'id'].forEach(function(key) {
                    self['$' + key + 'Input'].options({value: ''})
                });
            }
        });

    self.$moveButton = Ox.Button({
            disabled: true,
            title: 'Move Files',
            width: 116
        })
        .css({margin: '0 4px 4px 4px'})
        .bindEvent({
            click: function() {
                var data = {
                    ids: self.selected,
                    itemId: self.$idInput.value()
                };
                ['title', 'director', 'year'].forEach(function(key) {
                    data[key] = self['$' + key + 'Input'].value();
                });
                Ox.Request.clearCache(); // fixme: remove
                pandora.api.moveFiles(data, function(result) {
                    if(self.$checkbox.value()) {
                        pandora.URL.set(result.data.itemId);
                    } else {
                        Ox.print('moved', self.selected, result.data.itemId);
                        self.$filesList.reloadList();
                        self.$instancesList.reloadList();
                    }
                });
            }
        });

    self.$moviePanel = Ox.Element()
        .append(self.$movieLabel)
        .append(self.$movieForm)
        .append(self.$clearButton)
        .append(self.$moveButton);

    that.$element = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: self.$toolbar,
                                size: 24
                            },
                            {
                                element: self.$filesList
                            },
                            {
                                element: self.$instancesList,
                                size: 80
                            }
                        ],
                        orientation: 'vertical'
                    })
                },
                {
                    collapsible: true,
                    element: self.$moviePanel,
                    size: 256
                }
            ],
            orientation: 'horizontal'
        });

    function openFiles(data) {
        Ox.print('........', JSON.stringify(self.$filesList.value(data.ids[0], 'instances')))
    }

    function selectFiles(data) {
        Ox.print('........', JSON.stringify(self.$filesList.value(data.ids[0], 'instances')))
        self.selected = data.ids;
        self.$instancesList.options({
            items: data.ids.length == 1
                ? self.$filesList.value(data.ids[0], 'instances') : []
        });
        updateForm();
    }

    function updateForm() {
        self.$moveButton.options({
            disabled: self.selected.length === 0
        });
    }

    return that;

};
