'use strict';

pandora.ui.homeDialog = function() {

    var items = [];

    var autocompleteData = {};

    var $folders = $('<div>').css({overflowX: 'hidden', overflowY: 'auto'});

    var $item = $('<div>').addClass('OxTextPage');

    var $form = $('<div>');

    var $title, $text, $typeSelect, $imageInput, $linkInput, $nameInput;

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
        height: 256, //576,
        removeOnClose: true,
        title: Ox._('Manage Home Screen'),
        width: 1050 // 256 + 17 + 512 + 17 + 256
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

    function editItem(id, key, value) {
        var title = $title.value();
        var text = $text.value();
        var type = $typeSelect.value();
        if (type == 'custom') {
            var image = $imageInput.value();
            var link = $linkInput.value();
        } else {
            var name = $nameInput.value();
        }
        if (
            !title || !text
            || (type == 'custom' && (!image || !link))
            || (type != 'custom' && !name)   
        ) {
            return;
        }
        pandora.api.editHomeItem(Ox.extend({id: id}, key, value), function(result) {
            // ...
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
                    autocompleteData[value] = result.data.items.map(function(item) {
                        return item.id;
                    });
                    callback();
                });
            },
            callback
        );
    }

    function renderFolder(type, items, selected) {
        var extras = [
            Ox.MenuButton({
                items: [
                    {id: 'newitem', title: Ox._(
                        'New ' + (type == 'active' ? 'Active' : 'Inactive') + ' Item'
                    )},
                    {id: 'deleteitem', title: Ox._('Delete Selected Item')}
                ],
                title: 'edit',
                tooltip: Ox._('Manage Items'),
                type: 'image'
            }).bindEvent({
                click: function(data) {
                    if (data.id == 'newitem') {
                        // ...
                    } else if (data.id == 'deleteitem') {
                        // ...
                    }
                }
            })
        ];
        var $folder = Ox.CollapsePanel({
            collapsed: false,
            extras: extras,
            size: 16,
            title: Ox._((type == 'active' ? 'Active' : 'Inactive') + ' Items')
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
            return item.active == (type == 'active');
        }), selected).bindEventOnce({
            init: function(data) {
                $placeholder[data.items ? 'hide' : 'show']();
                $folder.$content.css({
                    height: (data.items || 1) * 16 + 'px'
                });
            }
        }).appendTo($folder.$content);

        return $folder;
    }

    function renderFolders(items, selected) {
        $folders.empty();
        ['active', 'inactive'].forEach(function(type) {
            var $folder = renderFolder(type, items, selected).appendTo($folders);
        });
    }

    function renderForm(data, focus) {
        $form.empty();
        $typeSelect = Ox.Select({
            items: [
                {id: 'custom', title: Ox._('Custom')},
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
            change: function(data) {
                var item = {type: data.value};
                renderItem(item);
                renderForm(item, true);
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
                change: function(data) {
                    editItem(data.id, 'image', data.value);
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
                change: function(data) {
                    editItem(data.id, 'link', data.value);
                }
            }).appendTo($form);
        } else {
            $nameInput = Ox.Input({
                autocomplete: autocompleteData[data.type],
                autocompleteSelect: true,
                autocompleteSelectMaxWidth: 256,
                label: Ox._('Name'),
                labelWidth: 80,
                value: data.contentid || '',
                width: 240
            }).css({
                margin: '8px'
            }).bindEvent({
                change: function(data) {
                    editItem(data.id, 'name', data.value);
                }
            }).appendTo($form);
        }
        if (focus) {
            (data.type == 'custom' ? $imageInput : $nameInput).focusInput();
        }
    }

    function renderItem(data) {
        $item.empty();
        if (data.image) {
            var $image = $('<img>').attr({
                src: data.image
            }).css({
                borderRadius: '32px',
                float: 'left',
                height: '128px',
                margin: '12px',
                width: '128px'
            }).appendTo($item)
        } else {
            var $placeholder = $('<div>').css({
                border: 'dotted 1px rgb(0, 0, 0)', // FIXME: make themes
                borderRadius: '32px',
                height: '128px',
                margin: '8px',
                width: '128px'
            }).appendTo($item);
        }
        var $container = $('<div>').css({
            margin: '10px 12px 8px 0'
        }).appendTo($item);
        var title = data.title ? (
            (
                data.type == 'custom' ? ''
                : Ox._('Featured ' + Ox.toTitleCase(data.type) + ': ')
            ) + data.title
        ) : '';
        $title = Ox.EditableContent({
            editable: data.type == 'custom',
            placeholder: '<span class="OxLight">' + Ox._('Title') + '</span>',
            value: title
        }).css({
            fontSize: '13px',
            fontWeight: 'bold'
        }).bindEvent({
            submit: function(data) {
                editItem(data.id, 'title', data.value);
            }
        }).appendTo($container);
        $text = Ox.EditableContent({
            editable: data.type == 'custom',
            placeholder: '<span class="OxLight">' + Ox._('Text') + '</span>',
            type: 'textarea',
            value: data.text || ''
        }).css({
            margin: '0 12px 0 0'
        }).bindEvent({
            submit: function(data) {
                editItem(data.id, 'text', data.value);
            }
        }).appendTo($item);
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
                    id: 'active',
                    format: function(value) {
                        return value ? $('<img>').attr({
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
                if (data.ids.length) {
                    var item = Ox.getObjectById(items, data.ids[0])
                    renderItem(item);
                    renderForm(item);
                }
            },
            selectafter: function() {
                // ...
            },
            selectbefore: function() {
                // ...
            }
        })
        .css({
            width: '256px'
        });
        return $list;
    }

    return that;

};