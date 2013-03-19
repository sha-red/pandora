// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.filesView = function(options, self) {

    var self = self || {},
        that = Ox.Element({}, self)
            .defaults({
                id: ''
            })
            .options(options || {});

    self.filesQuery = {
        conditions: [{
            key: 'id',
            value: self.options.id,
            operator: '=='
        }]
    };
    self.numberOfItems = 0;
    self.selected = [];
    self.wasChecked = false;

    self.$toolbar = Ox.Bar({
        size: 24
    });

    self.$menu = Ox.MenuButton({
            items: [
                {
                    disabled: true,
                    id: 'ignore',
                    title: 'Ignore Selected Files'
                },
                {},
                {
                    disabled: !pandora.site.capabilities.canRemoveItems[pandora.user.level],
                    id: 'delete',
                    title: 'Delete ' + pandora.site.itemName.singular + '...'
                }
            ],
            title: 'set',
            type: 'image'
        })
        .css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            click: function(data) {
                if (data.id == 'ignore') {
                    ignoreFiles();
                } else if (data.id == 'delete') {
                    deleteItem();
                }
            }
        })
        .appendTo(self.$toolbar);

    self.$saveButton = Ox.Button({
            disabled: true,
            title: 'Save Changes',
            width: 128
        })
        .css({
            float: 'right',
            margin: '4px'
        })
        .bindEvent({
            click: saveChanges
        })
        .appendTo(self.$toolbar);

    self.$filesList = Ox.TableList({
            columns: [
                {
                    clickable: function(data) {
                        return true;
                    },
                    format: function(value, data) {
                        return $('<img>')
                            .attr({
                                src: data.wanted ? Ox.UI.getImageURL('symbolUpload') :
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
                    width: 60
                },
                {
                    align: 'left',
                    id: 'path',
                    operator: '+',
                    title: 'Path',
                    visible: true,
                    width: 360
                },
                {
                    editable: true,
                    id: 'version',
                    operator: '+',
                    title: 'Version',
                    visible: true,
                    width: 60
                },
                {
                    editable: true,
                    id: 'part',
                    operator: '+',
                    title: 'Part',
                    visible: true,
                    width: 60
                },
                {
                    editable: true,
                    id: 'partTitle',
                    operator: '+',
                    title: 'Part Title',
                    visible: true,
                    width: 120
                },
                {
                    editable: true,
                    id: 'language',
                    operator: '+',
                    title: 'Language',
                    visible: true,
                    width: 60
                },
                {
                    editable: true,
                    id: 'extension',
                    operator: '+',
                    title: 'Extension',
                    visible: true,
                    width: 60
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
                    query: self.filesQuery
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
                    pandora.api.editFiles({
                        files: [{
                            id: data.id,
                            ignore: !ignored
                        }]
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
            select: selectFiles,
            submit: function(data) {
                var value = self.$filesList.value(data.id, data.key);
                if (data.value != value && !(data.value === '' && value === null)) {
                    self.$saveButton.options({disabled: false});
                    self.$filesList.value(data.id, data.key, data.value || null);
                }
            }
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
        })
        .bindEvent({
            open: openFiles
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
                var conditions, matches;
                if (key == 'id' && data.value.substr(0, 2) != '0x') {
                    if (pandora.site.site.id == '0xdb') {
                        matches = data.value.match(/\d{7}/);
                    } else {
                        matches = data.value.match(/[A-Z]+/);
                    }
                    data.value = matches ? matches[0] : '';
                    self.$idInput.value(data.value);
                }
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

    function ignoreFiles() {
        pandora.api.editFiles({
            files: self.selected.map(function(id) {
                return {id: id, ignore: true};
            })
        }, function(result) {
            Ox.Request.clearCache();
            self.$filesList.reloadList();
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
        self.$moveButton.options(
            {disabled: true, title: 'Moving Files...'}
        );
        pandora.api.moveFiles(data, function(result) {
            if (
                pandora.user.ui.item == self.options.id
                && pandora.user.ui.itemView == 'files'
            ) {
                Ox.Request.clearCache(); // fixme: remove
                if (self.$switch.value()) {
                    pandora.UI.set({item: result.data.itemId});
                    pandora.updateItemContext();
                } else {
                    self.$filesList.reloadList();
                    self.$instancesList.reloadList();
                    self.$moveButton.options(
                        {disabled: false, title: 'Move Files'}
                    );
                }
            }
        });
    }

    function openFiles(data) {
        data.ids.length == 1 && pandora.api.parsePath({
            path: self.$instancesList.value(data.ids[0], 'path')
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

    function saveChanges() {
        self.$saveButton.options({disabled: true, title: 'Saving Changes...'});
        pandora.api.findFiles({
            keys: ['id'],
            query: self.filesQuery
        }, function(result) {
            pandora.api.editFiles({
                files: result.data.items.map(function(item) {
                    [
                        'version', 'part', 'partTitle', 'language', 'extension'
                    ].forEach(function(key) {
                        Ox.extend(item, key, self.$filesList.value(item.id, key));
                    })
                    return item;
                })
            }, function(result) {
                self.$saveButton.options({title: 'Save Changes'});
                Ox.Request.clearCache(); // fixme: remove
                self.$filesList.reloadList();
            });
        });
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
        self.$menu[
            self.selected.length == 0 ? 'disableItem' : 'enableItem'
        ]('ignore');
    }

    that.reload = function() {
        self.$filesList.reloadList();
    }
    return that;

};
