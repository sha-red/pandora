'use strict';

pandora.ui.allItems = function() {

    var that = Ox.Element()
        .addClass('OxSelectableElement' + (pandora.user.ui._list ? '' : ' OxSelected'))
        .css({
            height: '16px',
            cursor: 'default',
            overflow: 'hidden'
        })
        .on({
            click: function() {
                that.gainFocus();
                if (pandora.user.ui.section == 'items') {
                    pandora.user.ui._list && pandora.UI.set('find', {conditions: [], operator: '&'});
                } else {
                    pandora.UI.set(pandora.user.ui.section.slice(0, -1), '');
                }
            }
        })
        .bindEvent({
            pandora_find: function() {
                that[pandora.user.ui._list ? 'removeClass' : 'addClass']('OxSelected');
            }
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
        .html(pandora.user.ui.section == 'items' ? 'All ' + pandora.site.itemName.plural
            : pandora.site.site.name + ' ' + Ox.toTitleCase(pandora.user.ui.section))
        .appendTo(that);

    if (pandora.user.ui.section == 'items') {
        var $items = $('<div>')
            .css({
                float: 'left',
                width: '42px',
                margin: '1px 4px 1px 3px',
                textAlign: 'right'
            })
            .appendTo(that),
        $clickButton = Ox.Button({
                style: 'symbol',
                title: 'click',
                type: 'image'
            })
            .css({opacity: 0.25})
            .appendTo(that),
        $uploadButton = Ox.Button({
                style: 'symbol',
                title: 'upload',
                type: 'image'
            })
            .appendTo(that);
        pandora.api.find({
            query: {conditions: [], operator: '&'}
        }, function(result) {
            that.update(result.data.items);
        });
    }

    that.update = function(items) {
        $items.html(Ox.formatNumber(items));
    };

    that.resizeElement = function(width) {
        $name.css({width: width + 'px'});
    };

    return that;

};
