// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.sortMenu = function() {

    var that = Ox.Select({
            items: Ox.merge(
                pandora.site.clipKeys.map(function(key) {
                    return Ox.extend(Ox.clone(key), {
                        checked: key.id == pandora.user.ui.itemSort[0].key,
                        id: key.id,
                        title: 'Sort by ' + key.title
                    });
                }),
                [
                    {},
                    {id: 'ascending', title: 'Ascending', checked: pandora.user.ui.itemSort[0].operator == '+'},
                    {id: 'descending', title: 'Descending', checked: pandora.user.ui.itemSort[0].operator == '-'}
                ]
            ),
            selectable: false,
            tooltip: 'Sort clips',
            type: 'image'
        })
        .css({float: 'left', margin: '2px'})
        .bindEvent({
            click: function(data) {
                if (data.checked) {
                    if (['ascending', 'descending'].indexOf(data.id) > -1) {
                        pandora.UI.set('itemSort', [{
                            key: pandora.user.ui.itemSort[0].key,
                            operator: data.id == 'ascending' ? '+' : '-'
                        }]);
                    } else {
                        pandora.UI.set('itemSort', [{
                            key: data.id,
                            operator: pandora.getSortOperator(data.id)
                        }]);
                    }
                }
            },
            pandora_itemsort: function() {
                pandora.$ui.sortMenu.replaceWith(
                    pandora.$ui.sortMenu = pandora.ui.sortMenu()
                );
            }
        });

    return that;
  
};