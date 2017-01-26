'use strict';

pandora.ui.homeDialog = function() {

    var $lists = Ox.Element();

    var $item = $('<div>');

    var $dialogPanel = Ox.SplitPanel({
        elements: [
            {element: $lists, size: 256},
            {element: $item}
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
        height: 576,
        removeOnClose: true,
        title: Ox._('Manage Home Screen'),
        width: 768
    });

    pandora.api.getHomeItems({}, function(result) {
        var $activeList = renderList(result.data.items.filter(function(item) {
            return item.active;
        })).appendTo($lists);
        var $inactiveList = renderList(result.data.items.filter(function(item) {
            return !item.active;
        }))//.appendTo($lists);
    });

    function renderItem(data) {
        var $item = $('<div>');
        if (!data) {
            return $item;
        }
        var $form = $('<div>').appendTo($item);
        var $typeSelect = Ox.Select({
            items: [
                {id: 'custom', title: Ox._('Custom')},
                {id: 'list', title: Ox._('List')},
                {id: 'edit', title: Ox._('Edit')},
                {id: 'collection', title: Ox._('Collection')}
            ],
            label: Ox._('Type'),
            labelWidth: 128,
            width: 512
        }).css({
            margin: '4px'
        }).bindEvent({
            change: function(data) {
                renderItem({type: data.value})
            }
        }).appendTo($form);
        if (data.type == 'custom') {
            var $imageInput = Ox.Input({
                label: Ox._('Image URL'),
                labelWidth: 128,
                width: 512
            }).css({
                margin: '4px'
            }).appendTo($form);
            var $linkInput = Ox.Input({
                label: Ox._('Link URL'),
                labelWidth: 128,
                width: 512
            }).css({
                margin: '4px'
            }).appendTo($form);
        } else {
            var $nameInput = Ox.Input({
                label: Ox._('List Name'),
                labelWidth: 128,
                width: 512
            }).css({
                margin: '4px'
            }).appendTo($form);
        }
        var $preview = $('<div>').appendTo($item);
        var $imageContainer = $('<div>').css({
            background: 'rgb(0, 0, 0)', // FIXME: make themes
            borderRadius: '32px',
            height: '128px',
            width: '128px'
        }).appendTo($preview);
        if (data.image) {
            $image = $('<img>').attr({
                src: data.image
            }).css({
                borderRadius: '32px',
                height: '128px',
                width: '128px'
            }).appendTo($imageContainer)
        }
        Ox.EditableContent({
            placeholder: '<span class="OxLight">' + Ox._('Title') + '</span>',
            value: data.title
        })
        .bindEvent({
            submit: function(data) {
                editItem('title', data.value);
            }
        }).appendTo($preview);
        Ox.EditableContent({
            placeholder: '<span class="OxLight">' + Ox._('Text') + '</span>',
            value: data.text
        })
        .bindEvent({
            submit: function(data) {
                editItem('text', data.value);
            }
        }).appendTo($preview);
        return $item;
    }

    function renderList(items) {
        console.log('LIST', items)
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
            sort: [{key: 'index', operator: '+'}],
            sortable: true,
            unique: 'id'
        })
        .bindEvent({
            select: function() {
                
            }
        })
        .css({
            width: '256px'
        });
        return $list;
    }

    return that;

};