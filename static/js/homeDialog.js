'use strict';

pandora.ui.homeDialog = function() {

    var items = [];

    var autocompleteData = {};

    var $folders = $('<div>').css({overflowX: 'hidden', overflowY: 'auto'});

    var $activeList, $inactiveList, $activeMenu, $inactiveMenu;

    var $item = $('<div>').addClass('OxTextPage').css({overflow: 'auto'});

    var $form = $('<div>');

    var $statusSelect, $typeSelect, $imageInput, $linkInput, $nameInput;

    var $dialogPanel = Ox.SplitPanel({
        elements: [
            {element: $folders, resizable: true, resize: [256], size: 256},
            {element: $item},
            {element: $form, resizable: true, resize: [256], size: 256}
        ],
        orientation: 'horizontal'
    })

    var that = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'done',
                title: Ox._('Done')
            }).bindEvent({
                click: function() {
                    that.close();
                }
            })
        ],
        closeButton: true,
        content: $dialogPanel,
        height: Math.round((window.innerHeight - 48) * 0.9),
        removeOnClose: true,
        title: Ox._('Manage Home Screen'),
        width: 1058 // 256 + 17 + 512 + 17 + 256
    });

    pandora.api.getHomeItems({}, function(result) {
        getAutocompleteData(function() {
            items = result.data.items;
            var selected = items.length ? items[0].id : null;
            renderFolders(result.data.items, selected);
            if (selected) {
                var item = Ox.getObjectById(items, selected)
                renderItem(item);
                renderForm(item);
            }
        });
    });

    function addItem(active, callback) {
        pandora.api.addHomeItem({
            active: active,
        }, function(response) {
            items.push(response.data);
            var selected = response.data.id;
            renderFolders(items, selected);
            var item = Ox.getObjectById(items, selected);
            renderItem(item);
            renderForm(item);
            callback && callback();
        });
    }
    function deleteItem(id, callback) {
        pandora.api.removeHomeItem({
            id: id
        }, function() {
            items = items.filter(function(item) {
                return item.id != id;
            });
            var selected = items[0].id;
            renderFolders(items, selected);
            var item = Ox.getObjectById(items, selected);
            renderItem(item);
            renderForm(item);
            callback && callback();
        });
    }

    function editItem(id, key, value, callback) {
        if (key == 'name') {
            key = 'contentid';
        }
        var data = Ox.extend({id: id}, key, value);
        if (key == 'type') {
            Ox.extend(data, {'contentid': ''});
        }
        pandora.api.editHomeItem(data, function(result) {
            Ox.Request.clearCache('Home');
            var item = Ox.getObjectById(items, id);
            Ox.unique(Object.keys(item).concat(Object.keys(result.data))).forEach(function(key) {
                item[key] = result.data[key] || '';
            });
            renderFolders(items, item.id);
            /*
            console.log('1', item)
            console.log('2', (item.status == 'active' ? $activeList : $inactiveList).value(id));
            (item.status == 'active' ? $activeList : $inactiveList).value(id, {
                image: item.image,
                title: item.title,
                text: item.text,
                link: item.link
            });
            */
            renderItem(item);
            renderForm(item);
            callback && callback();
        });
    }

    function getAutocompleteData(callback) {
        Ox.parallelForEach(
            ['list', 'edit', 'collection'],
            function(value, index, array, callback) {
                pandora.api['find' + Ox.toTitleCase(value) + 's']({
                    keys: ['id'],
                    query: {
                        conditions: [
                            {key: 'status', operator: '!=', value: 'private'}
                        ],
                        operator: '&'
                    },
                    range: [0, 1000]
                }, function(result) {
                    autocompleteData[value] = [''].concat(result.data.items.map(function(item) {
                        return item.id;
                    }));
                    callback();
                });
            },
            callback
        );
    }

    function renderFolder(status, items, selected) {
        var extras = [
            Ox.MenuButton({
                items: [
                    {id: 'newitem', title: Ox._(
                        'New ' + (status == 'active' ? 'Active' : 'Inactive') + ' Item'
                    )},
                    {id: 'deleteitem', title: Ox._('Delete Selected Item'), disabled: !selected}
                ],
                title: 'edit',
                tooltip: Ox._('Manage Items'),
                type: 'image'
            }).bindEvent({
                click: function(data) {
                    if (data.id == 'newitem') {
                        addItem(status == 'active');
                    } else if (data.id == 'deleteitem') {
                        var id = (
                                status == 'active' ? $activeList : $inactiveList
                            ).options('selected')[0];
                        id && deleteItem(id);
                    }
                },
            })
        ];
        if (status == 'active') {
            $activeMenu = extras[0];
        } else {
            $inactiveMenu = extras[0];
        }
        var $folder = Ox.CollapsePanel({
            collapsed: false,
            extras: extras,
            size: 16,
            title: Ox._((status == 'active' ? 'Active' : 'Inactive') + ' Items')
        }).bindEvent({
            toggle: function(data) {
                data.collapsed && $list.loseFocus();
            }
        });
        var $placeholder = Ox.Element().addClass('OxLight').css({
            height: '14px',
            padding: '1px 4px',
        }).html(Ox._('No items')).hide().appendTo($folder.$content)
        var $list = renderList(items.filter(function(item) {
            return item.active == (status == 'active');
        }), selected).bindEventOnce({
            init: function(data) {
                updateMenu(status, $list.options('selected').length);
                $placeholder[data.items ? 'hide' : 'show']();
                $folder.$content.css({
                    height: (data.items || 1) * 16 + 'px'
                });
            }
        }).bindEvent({
            add: function(event) {
                addItem(status == 'active');
            },
            'delete': function(data) {
                data.ids.length && deleteItem(data.ids[0]);
            }
        }).appendTo($folder.$content);
        if (status == 'active') {
            $activeList = $list;
        } else {
            $inactiveList = $list;
        }
        return $folder;
    }

    function renderFolders(items, selected) {
        $folders.empty();
        ['active', 'inactive'].forEach(function(status) {
            var $folder = renderFolder(status, items, selected).appendTo($folders);
        });
    }

    function renderForm(data, focus) {
        $form.empty();
        if (!data) {
            return;
        }
        $statusSelect = Ox.Select({
            items: [
                {id: 'active', title: Ox._('Active')},
                {id: 'inactive', title: Ox._('Inactive')}
            ],
            label: Ox._('Status'),
            labelWidth: 80,
            value: data.active ? 'active' : 'inactive',
            width: 240
        }).css({
            margin: '8px'
        }).bindEvent({
            change: function(data_) {
                editItem(data.id, 'active', data_.value == 'active');
            }
        }).appendTo($form);
        $typeSelect = Ox.Select({
            items: [
                {id: 'custom', title: Ox._('Custom')},
                {},
                {id: 'list', title: Ox._('List')},
                {id: 'edit', title: Ox._('Edit')},
                {id: 'collection', title: Ox._('Collection')}
            ],
            label: Ox._('Type'),
            labelWidth: 80,
            value: data.type,
            width: 240
        }).css({
            margin: '8px'
        }).bindEvent({
            change: function(data_) {
                editItem(data.id, 'type', data_.value, function() {
                    (data.type == 'custom' ? $imageInput : $nameInput).focusInput();
                });
            }
        }).appendTo($form);
        if (data.type == 'custom') {
            $imageInput = Ox.Input({
                label: Ox._('Image URL'),
                labelWidth: 80,
                value: data.image || '',
                width: 240
            }).css({
                margin: '8px'
            }).bindEvent({
                change: function(data_) {
                    editItem(data.id, 'image', data_.value);
                }
            }).appendTo($form);
            $linkInput = Ox.Input({
                label: Ox._('Link URL'),
                labelWidth: 80,
                value: data.link || '',
                width: 240
            }).css({
                margin: '8px'
            }).bindEvent({
                change: function(data_) {
                    editItem(data.id, 'link', data_.value);
                }
            }).appendTo($form);
        } else {
            $nameInput = Ox.Input({
                autocomplete: autocompleteData[data.type],
                autocompleteReplace: true,
                autocompleteReplaceCorrect: true,
                autocompleteSelect: true,
                autocompleteSelectMaxWidth: 256,
                label: Ox._('Name'),
                labelWidth: 80,
                value: data.contentid || '',
                width: 240
            }).css({
                margin: '8px'
            }).bindEvent({
                change: function(data_) {
                    editItem(data.id, 'name', data_.value);
                }
            }).appendTo($form);
        }
    }

    function renderItem(data) {
        $item.empty().append(
            pandora.renderHomeItem({
                data: data,
                editItem: editItem
            }).css({
                margin: '16px'
            })
        );
    }

    function renderList(items, selected) {
        var $list = Ox.TableList({
            columns: [
                {
                    id: 'image',
                    format: function(value) {
                        return $('<img>').attr({
                            src: value
                        }).css({
                            borderRadius: '4px',
                            height: '14px',
                            margin: '0 0 0 -2px',
                            width: '14px',
                        })
                    },
                    visible: true,
                    width: 16,
                },
                {
                    id: 'title',
                    visible: true,
                    width: 224
                },
                {
                    id: 'text',
                    visible: false,
                    width: 0
                },
                {
                    id: 'link',
                    visible: false,
                    width: 0
                },
                {
                    id: 'complete',
                    format: function(value, data) {
                        console.log('##', data);
                        return pandora.isCompleteHomeItem(data) ? $('<img>').attr({
                            src: Ox.UI.getImageURL('symbolCheck')
                        }).css({
                            width: '10px',
                            height: '10px',
                            padding: '3px'
                        }) : ''
                    },
                    visible: true,
                    width: 16
                }
            ],
            items: items,
            max: 1,
            selected: [selected],
            sort: [{key: 'index', operator: '+'}],
            sortable: true,
            unique: 'id'
        })
        .bindEvent({
            select: function(data) {
                var item = Ox.getObjectById($list.options('items'), data.ids[0]),
                    status = $list == $activeList ? 'active' : 'inactive';

                if (data.ids.length) {
                    (
                        status == 'active' ? $inactiveList : $activeList
                    ).options({selected: []});
                    updateMenu(status == 'active' ? 'inactive' : 'active', false);
                }
                updateMenu(status, data.ids.length);
                if (item || $activeList.options('selected').length + $inactiveList.options('selected').length == 0) {
                    renderItem(item);
                    renderForm(item);
                }
            },
            selectafter: function() {
                // ...
            },
            selectbefore: function() {
                // ...
            },
            move: function(data) {
                pandora.api.sortHomeItems({
                    ids: data.ids
                }, function() {
                    Ox.Request.clearCache('HomeItems');
                });
            }
        })
        .css({
            width: '256px'
        });
        return $list;
    }

    function updateMenu(status, value) {
        (
            status == 'active' ? $activeMenu : $inactiveMenu
        )[value ? 'enableItem' : 'disableItem']('deleteitem');
    }

    return that;

};
