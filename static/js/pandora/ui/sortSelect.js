// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.sortSelect = function() {
    var that = Ox.Select({
            id: 'sortSelect',
            items: pandora.site.sortKeys.map(function(key) {
                //Ox.print('????', pandora.user.ui.lists[pandora.user.ui.list].sort.key, key.id)
                return Ox.extend(Ox.extend({}, key), {
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
            change: function(data) {
                var key = data.selected[0].id,
                    operator = pandora.getSortOperator(key);
                pandora.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + key);
                pandora.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator === '' ? 'ascending' : 'descending'));
                pandora.$ui.list.options({
                    sort: [{key: key, operator: operator}]
                });
                pandora.UI.set('lists|' + pandora.user.ui.list + '|sort', [{key: key, operator: operator}]);
                pandora.URL.push(pandora.Query.toString());
            }
        });
    return that;
};

