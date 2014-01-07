// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.sortElement = function(isNavigationView) {

    var ui = pandora.user.ui,
        isClipView = pandora.isClipView(),
        isEmbed = pandora.isEmbedURL(),
        items = (
            isClipView ? pandora.site.clipKeys.map(function(key) {
                return Ox.extend(Ox.clone(key), {
                    title: Ox._((!ui.item ? 'Sort by Clip {0}' : 'Sort by {0}'), [Ox._(key.title)])
                });
            }) : []
        ).concat(
            !ui.item ? pandora.site.sortKeys.map(function(key) {
                return Ox.extend(Ox.clone(key), {
                    title: Ox._('Sort by {0}', [Ox._(key.title)])
                });
            }) : []
        ),
        sortKey = !ui.item ? 'listSort' : 'itemSort',

        $sortSelect = Ox.Select({
                items: items,
                value: ui[sortKey][0].key,
                width: !isEmbed && isNavigationView ? 120 + Ox.UI.SCROLLBAR_SIZE : 144
            })
            .bindEvent({
                change: function(data) {
                    var key = data.value;
                    pandora.UI.set(sortKey, [{
                        key: key,
                        operator: pandora.getSortOperator(key)
                    }]);
                }
            }),

        $orderButton = Ox.Button({
                overlap: 'left',
                title: getButtonTitle(),
                tooltip: getButtonTooltip(),
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set(sortKey, [{
                        key: ui[sortKey][0].key,
                        operator: ui[sortKey][0].operator == '+' ? '-' : '+'
                    }]);
                }
            }),

        that = Ox.FormElementGroup({
                elements: [$sortSelect, $orderButton],
                float: 'right'
            })
            .css({
                float: isNavigationView ? 'right' : 'left',
                margin: isNavigationView ? '4px 4px 0 0' : '4px 0 0 4px'
            })
            .bindEvent('pandora_' + sortKey.toLowerCase(), updateElement);

    function getButtonTitle() {
        return ui[sortKey][0].operator == '+' ? 'up' : 'down';
    }

    function getButtonTooltip() {
        return Ox._(ui[sortKey][0].operator == '+' ? 'Ascending' : 'Descending');
    }

    function updateElement() {
        $sortSelect.value(ui[sortKey][0].key);
        $orderButton.options({
            title: getButtonTitle(),
            tooltip: getButtonTooltip()
        });
    }

    return that;
    
};
