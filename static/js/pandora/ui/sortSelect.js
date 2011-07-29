// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.sortSelect = function() {
    var that = Ox.Select({
            id: 'sortSelect',
            items: $.map(pandora.site.sortKeys, function(key) {
                //Ox.print('????', pandora.user.ui.lists[pandora.user.ui.list].sort.key, key.id)
                return $.extend($.extend({}, key), {
                    checked: pandora.user.ui.lists[pandora.user.ui.list].sort[0].key == key.id,
                    title: 'Sort by ' + key.title
                });
            }),
            width: 144
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            change: function(event, data) {
                var id = data.selected[0].id,
                    operator = pandora.getSortOperator(id);
                /*
                pandora.user.ui.lists[pandora.user.ui.list].sort[0] = {
                    key: id,
                    operator: operator
                };
                */
                pandora.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + id);
                pandora.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator === '' ? 'ascending' : 'descending'));
                pandora.$ui.list.sortList(id, operator);
                pandora.URL.set(pandora.Query.toString());
            }
        });
    return that;
};

