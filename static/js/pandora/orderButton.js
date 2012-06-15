// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.orderButton = function(isNavigationView) {
    var sortKey = !pandora.user.ui.item ? 'listSort' : 'itemSort',
        that = Ox.Button({
            id: 'orderButton',
            title: getTitle(),
            tooltip: getTooltip(),
            // tooltip: 'Change sort order',
            type: 'image'
        })
        .css({
            float: isNavigationView ? 'right' : 'left',
            margin: isNavigationView ? '4px 4px 0 0' : '4px 0 0 4px'
        })
        .bindEvent({
            click: function() {
                pandora.UI.set(sortKey, [{
                    key: pandora.user.ui[sortKey][0].key,
                    operator: pandora.user.ui[sortKey][0].operator == '+' ? '-' : '+'
                }]);
                updateButton();
            },
            pandora_listsort: updateButton,
            pandora_itemsort: updateButton
        });
    function getTitle() {
        return pandora.user.ui[sortKey][0].operator == '+' ? 'up' : 'down';
    }
    function getTooltip() {
        return pandora.user.ui[sortKey][0].operator == '+' ? 'Ascending' : 'Descending';
    }
    function updateButton() {
        that.options({
            title: getTitle(),
            tooltip: getTooltip()
        });
    }
    return that;
}