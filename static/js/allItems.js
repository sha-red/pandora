'use strict';

pandora.ui.allItems = function(section) {

    section = section || pandora.user.ui.section;

    var canAddItems = !pandora.site.itemRequiresVideo && pandora.site.capabilities.canAddItems[pandora.user.level],
        canUploadVideo = pandora.site.capabilities.canAddItems[pandora.user.level],
        that = Ox.Element()
            .addClass('OxSelectableElement' + (pandora.user.ui._list ? '' : ' OxSelected'))
            .css({
                height: '16px',
                cursor: 'default',
                overflow: 'hidden'
            })
            .on({
                click: function() {
                    that.gainFocus();
                    if (section == 'items') {
                        pandora.user.ui._list && pandora.UI.set({find: {conditions: [], operator: '&'}});
                    } else {
                        pandora.UI.set(section.slice(0, -1), '');
                    }
                }
            })
            .bindEvent({
                pandora_edit: updateSelected,
                pandora_find: updateSelected,
                pandora_section: updateSelected,
                pandora_text: updateSelected
            }),
        $icon = $('<img>')
            .attr({src: '/static/png/icon.png'})
            .css({float: 'left', width: '14px', height: '14px', margin: '1px'})
            .appendTo(that),
        $name = $('<div>')
            .css({
                float: 'left',
                height: '14px',
                margin: '1px 4px 1px 3px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
            })
            .html(pandora.getAllItemsTitle(section))
            .appendTo(that),
        $items;

    if (section == 'items') {
        $items = $('<div>')
            .css({
                float: 'left',
                width: '42px',
                margin: '1px 4px 1px 3px',
                textAlign: 'right'
            })
            .appendTo(that);
        Ox.Button({
                style: 'symbol',
                title: 'add',
                tooltip: canAddItems ? Ox._('Add {0}', [Ox._(pandora.site.itemName.singular)]) : '',
                type: 'image'
            })
            .css({opacity: canAddItems ? 1 : 0.25})
            .bindEvent({
                click: pandora.addItem
            })
            .appendTo(that);
        Ox.Button({
                style: 'symbol',
                title: 'upload',
                tooltip: canUploadVideo ? Ox._('Upload Video...') : '',
                type: 'image'
            })
            .css({opacity: canUploadVideo ? 1 : 0.25})
            .bindEvent({
                click: function() {
                    pandora.$ui.uploadDialog = pandora.ui.uploadDialog().open();
                }
            })
            .appendTo(that);
        pandora.api.find({
            query: {conditions: [], operator: '&'}
        }, function(result) {
            that.update(result.data.items);
        });
    } else if (section == 'edits') {
    } else if (section == 'texts') {
        Ox.Button({
                style: 'symbol',
                title: 'file',
                tooltip: Ox._('HTML'),
                type: 'image'
            })
            .appendTo(that);
        Ox.Button({
                style: 'symbol',
                title: 'help',
                tooltip: Ox._('Help'),
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'help'});
                }
            })
            .appendTo(that);
    }

    updateSelected();

    function updateSelected() {
        that[
            (section == 'items' && pandora.user.ui._list)
            || (section == 'edits' && pandora.user.ui.edit)
            || (section == 'texts' && pandora.user.ui.text)
            ? 'removeClass' : 'addClass'
        ]('OxSelected');
    }

    that.update = function(items) {
        $items && $items.html(Ox.formatNumber(items));
    };

    that.resizeElement = function(width) {
        $name.css({width: width + 'px'});
    };

    return that;

};
