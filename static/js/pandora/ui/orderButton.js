// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.orderButton = function() {
    var that = Ox.Button({
            id: 'orderButton',
            title: getTitle(),
            // tooltip: 'Change sort order',
            type: 'image'
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            click: function(data) {
                pandora.UI.set({
                    listSort: [{
                        key: pandora.user.ui.listSort[0].key,
                        operator: pandora.user.ui.listSort[0].operator == '+' ? '-' : '+'
                    }]
                });
                that.options({title: getTitle()});
            },
            pandora_listsort: function() {
                that.options({title: getTitle()});
            }
        });
    function getTitle() {
        return pandora.user.ui.listSort[0].operator == '+' ? 'up' : 'down';
    }
    return that;
}