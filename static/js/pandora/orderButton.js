// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.orderButton = function(isNavigationView) {
    var sortKey = !pandora.user.ui.item ? 'listSort' : 'itemSort',
        that = Ox.Button({
            id: 'orderButton',
            title: getTitle(),
            // tooltip: 'Change sort order',
            type: 'image'
        })
        .css({
            float: isNavigationView ? 'right' : 'left',
            margin: isNavigationView ? '4px 4px 0 0' : '4px 0 0 4px'
        })
        .bindEvent({
            click: function(data) {
                pandora.UI.set(sortKey, [{
                    key: pandora.user.ui[sortKey][0].key,
                    operator: pandora.user.ui[sortKey][0].operator == '+' ? '-' : '+'
                }]);
                that.options({title: getTitle()});
            },
            pandora_listsort: function() {
                that.options({title: getTitle()});
            },
            pandora_itemsort: function() {
                that.options({title: getTitle()});
            }
        });
    function getTitle() {
        return pandora.user.ui[sortKey][0].operator == '+' ? 'up' : 'down';
    }
    return that;
}