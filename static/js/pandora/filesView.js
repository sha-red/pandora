// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.filesView = function(options, self) {

    var self = self || {},
        that = Ox.Element({}, self)
            .defaults({
                id: ''
            })
            .options(options || {});

    self.wasChecked = false;
    self.numberOfItems = 0;
    self.selected = [];

    self.$toolbar = Ox.Bar({
        size: 24
    });

    /*
    self.$versionSelect = Ox.Select({
            items: [
                {id: 'user/volume/version', title: 'Version: user/volume/version'}
            ],
            width: 240
        })
        .css({
            float: 'left',
            margin: '4px'
        })
        .appendTo(self.$toolbar);
    */

    self.$deleteButton = Ox.Button({
            disabled: false,
            title: 'Delete ' + pandora.site.itemName.singular,
            width: 116
        })
        .css({
            float: 'right',
            margin: '4px'
        })
        .appendTo(self.$toolbar)
        .bindEvent({
            click: deleteItem 
        });

    self.$ignoreButton = Ox.Button({
            disabled: 'true',
            title: 'Ignore Selected Files...'
        })
        .css({
            float: 'right',
            margin: '4px'
        })
        .appendTo(self.$toolbar)
        .bindEvent({
            click: function() {
                var data = {
                    ids: self.selected,
                    ignore: true
                };
                pandora.api.editFiles(data, function(result) {
                    Ox.Request.clearCache();
                    self.$filesList.reloadList();
                });
            }
        });

    self.$filesList = Ox.TableList({
            columns: [
                {
                    clickable: function(data) {
                        return true;
                    },
                    format: function(value, data) {
                        return $('<img>')
                            .attr({
                                src: data.wanted ? Ox.UI.getImageURL('symbolStar') :
                                                   Ox.UI.getImageURL('symbolCheck')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px',
                                opacity: (value || data.wanted) ? 1 : 0
                            });
                    },
                    id: 'selected',
                    operator: '-',
                    title: 'Status',
                    titleImage: 'check',
                    tooltip: function (data) {
                        return data.instances.filter(function(i) {return i.ignore; }).length > 0
                            ? 'Use this file'
                            : 'Dont use this file';
                    },
                    visible: true,
                    width: 16
                },
                {
                    align: 'left',
                    id: 'users',
                    operator: '+',
                    title: 'Users',
                    visible: true,
                    width: 50
                },
                {
                    align: 'left',
                    id: 'path',
                    operator: '+',
                    title: 'Path',
                    visible: true,
                    width: 480
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
                pandora.api.findFiles(Ox.extend(data, {
                    query: {
                        conditions: [{
                            key: 'id',
                            value: self.options.id,
                            operator: '=='
                        }]
                    }
                }), callback);
            },
            keys: ['wanted', 'instances'],
            scrollbarVisible: true,
            sort: [{key: 'path', operator: '+'}],
            unique: 'id'
        })
        .bindEvent({
            click: function(data) {
                if (data.key == 'selected') {
                    var ignored = self.$filesList.value(data.id, 'instances')
                            .filter(function(i) {return i.ignore; }).length > 0;
                    pandora.api.editFile({
                        id: data.id,
                        ignore: !ignored
                    }, function(result) {
                        Ox.Request.clearCache();
                        self.$filesList.reloadList();
                    });
                }
            },
            'delete': function(data) {
                var ids = data.ids.filter(function(id) {
                    return self.$filesList.value(id, 'instances').length == 0;
                });
                if (ids.length > 0 && pandora.user.level == 'admin') {
                    pandora.api.removeFiles({
                        ids: ids
                    }, function(result) {
                        Ox.Request.clearCache();
                        self.$filesList.reloadList();
                    });
                }
            },
            init: function(data) {
                self.numberOfItems = data.items;
            },
            open: openFiles,
            select: selectFiles
        });

    self.$instancesList = Ox.TableList({
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
                id: 'path',
                operator: '+',
                title: 'Path',
                visible: true,
                width: 480
            },
        ],
        columnsMovable: true,
        columnsRemovable: true,
        columnsResizable: true,
        columnsVisible: true,
        id: 'files',
        items: [],
        scrollbarVisible: true,
        sort: [{key: 'user', operator: '+'}],
        unique: 'path'
    });

    self.$movieLabel = Ox.Label({
            textAlign: 'center',
            title: 'Move selected files to another '
                + pandora.site.itemName.singular.toLowerCase(),
            width: 240
        })
        .css({margin: '8px'});

    ['title', 'director', 'year', 'id'].forEach(function(key) {
        self['$' + key + 'Input'] = Ox.Input({
            label: key == 'id' ? 'ID' : Ox.toTitleCase(key),
            labelWidth: 64,
            width: 240
        })
        .bindEvent({
            change: function(data) {
                var conditions;
                if (data.value.length) {
                    conditions = {};
                    ['id', 'title', 'director', 'year'].map(function(key) {
                        var value = self['$' + key + 'Input'].value();
                        if (value.length) {
                            conditions[key] = key == 'director' ? value.split(', ') : value;
                        }
                    });
                    pandora.api.findId(conditions, function(result) {
                        var length = result.data.items.length;
                        if (length == 0) {
                            if (key != 'id') {
                                self.$idInput.value('');
                            }
                        } else if (result.data.items.length == 1) {
                            ['title', 'director', 'year', 'id'].forEach(function(key) {
                                self['$' + key + 'Input'].value(
                                    key == 'director'
                                        ? result.data.items[0][key].join(', ')
                                        : result.data.items[0][key]
                                );
                            });
                        } else {
                            self.$idInput.value('');
                        }
                    });
                }
            }
        });
    });

    self.$switch = Ox.Checkbox({
        title: 'Switch to this '
            + pandora.site.itemName.singular.toLowerCase()
            + ' after moving files',
        value: false,
        width: 240
    });

    self.$movieForm = Ox.Form({
            items: [
                self.$titleInput,
                self.$directorInput,
                self.$yearInput,
                self.$idInput,
                self.$switch
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
                    self['$' + key + 'Input'].value('');
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
            click: moveFiles
        });
    

    self.$moviePanel = Ox.Element()
        .append(self.$movieLabel)
        .append(self.$movieForm)
        .append(self.$clearButton)
        .append(self.$moveButton);

    that.setElement(Ox.SplitPanel({
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
        })
    );

    function deleteItem(data) {
        pandora.api.get({
            id: pandora.user.ui.item,
            keys: ['id', 'title']
        },function(result) {
            pandora.ui.deleteItemDialog(result.data).open();
        });
    }

    function moveFiles(data) {
        var data = {
            ids: self.selected,
            itemId: self.$idInput.value()
        };
        ['title', 'director', 'year'].forEach(function(key) {
            data[key] = self['$' + key + 'Input'].value();
        });
        pandora.api.moveFiles(data, function(result) {
            if (
                pandora.user.ui.item == self.options.id
                && pandora.user.ui.itemView == 'files'
            ) {
                Ox.Request.clearCache(); // fixme: remove
                if (self.$switch.value()) {
                    pandora.UI.set({item: result.data.itemId});
                } else {
                    Ox.Log('', 'moved', self.selected, result.data.itemId);
                    self.$filesList.reloadList();
                    self.$instancesList.reloadList();
                }
            }
        });
    }

    function openFiles(data) {
        data.ids.length == 1 && pandora.api.parsePath({
            path: self.$filesList.value(data.ids[0], 'path')
        }, function(result) {
            ['title', 'director', 'year'].forEach(function(key) {
                if (result.data[key]) {
                    self['$' + key + 'Input'].value(
                        key == 'director'
                            ? result.data[key].join(', ')
                            : result.data[key]
                    );
                }
            });
            updateForm();
            self.$titleInput.triggerEvent('change', {value: result.data['title']});
        });
    }

    function selectFiles(data) {
        self.selected = data.ids;
        self.$instancesList.options({
            items: data.ids.length == 1
                ? self.$filesList.value(data.ids[0], 'instances') : []
        });
        updateForm();
    }

    function updateForm() {
        if (self.selected.length == self.numberOfItems) {
            self.wasChecked = self.$switch.value();
            self.$switch.options({
                disabled: true,
                value: true
            });
        } else {
            self.$switch.options({
                disabled: false,
                value: self.wasChecked
            });
        }
        self.$moveButton.options({
            disabled: self.selected.length == 0
        });
        self.$ignoreButton.options({
            disabled: self.selected.length == 0
        });
    }

    return that;

};
