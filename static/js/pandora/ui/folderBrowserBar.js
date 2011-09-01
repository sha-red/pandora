// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.folderBrowserBar = function(id) {
    var that = Ox.Bar({
            size: 24
        });
    Ox.print('ID', id)
    pandora.$ui.findListElement[id] = Ox.FormElementGroup({
            elements: [
                pandora.$ui.findListSelect[id] = Ox.Select({
                    items: [
                        {id: 'user', title: 'Find: User', checked: true},
                        {id: 'list', title: 'Find: List'}
                    ],
                    overlap: 'right',
                    type: 'image'
                })
                .bindEvent({
                    change: function(data) {
                        pandora.$ui.findListInput[id].options({
                            placeholder: data.selected[0].title
                        });
                    }
                }),
                pandora.$ui.findListInput[id] = Ox.Input({
                    clear: true,
                    placeholder: 'Find: User',
                    width: pandora.getFoldersWidth() - 24
                })
                .bindEvent({
                    submit: function(data) {
                        var key = pandora.$ui.findListSelect[id].value() == 'user' ? 'user' : 'name',
                            value = data.value;
                        pandora.$ui.folderList[id].options({
                            items: function(data, callback) {
                                var query = id == 'favorite' ? {conditions: [
                                    {key: 'status', value: 'public', operator: '='},
                                    {key: 'user', value: pandora.user.username, operator: '!'},
                                    {key: key, value: value, operator: ''}
                                ], operator: '&'} : {conditions: [
                                    {key: 'status', value: 'private', operator: '!'},
                                    {key: key, value: value, operator: ''}
                                ], operator: '&'};
                                return pandora.api.findLists(Ox.extend(data, {
                                    query: query
                                }), callback);
                            }
                        });
                    }
                })
            ],
        })
        .css({
            float: 'right',
            margin: '4px',
            align: 'right'
        })
        .appendTo(that);
    return that;
};

