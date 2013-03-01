// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.sortElement = function(isNavigationView) {

    var isClipView = pandora.isClipView(),
        items = (
            isClipView ? pandora.site.clipKeys.map(function(key) {
                return Ox.extend(Ox.clone(key), {
                    title: 'Sort by ' + (!pandora.user.ui.item ? 'Clip ' : '') + key.title
                });
            }) : []
        ).concat(
            !pandora.user.ui.item ? pandora.site.sortKeys.map(function(key) {
                return Ox.extend(Ox.clone(key), {
                    title: 'Sort by ' + key.title
                });
            }) : []
        ),
        sortKey = !pandora.user.ui.item ? 'listSort' : 'itemSort',

        $sortSelect = Ox.Select({
                items: items,
                value: pandora.user.ui[sortKey][0].key,
                width: isNavigationView ? 120 + Ox.UI.SCROLLBAR_SIZE : 144
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
                        key: pandora.user.ui[sortKey][0].key,
                        operator: pandora.user.ui[sortKey][0].operator == '+' ? '-' : '+'
                    }]);
                    updateButton();
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
        return pandora.user.ui[sortKey][0].operator == '+' ? 'up' : 'down';
    }

    function getButtonTooltip() {
        return pandora.user.ui[sortKey][0].operator == '+' ? 'Ascending' : 'Descending';
    }

    function updateElement() {
        $sortSelect.value(pandora.user.ui[sortKey][0].key);
        $orderButton.options({
            title: getButtonTitle(),
            tooltip: getButtonTooltip()
        });
    }

    return that;
    
};