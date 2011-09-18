// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.group = function(id) {
    //Ox.print('group', id, Ox.getPositionById(pandora.user.ui.groups, id))
    var i = Ox.getPositionById(pandora.user.ui.groups, id),
        group = Ox.getObjectById(pandora.site.groups, id),
        panelWidth = pandora.$ui.document.width() - (pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize) - 1,
        title = Ox.getObjectById(pandora.site.groups, id).title,
        //width = pandora.getGroupWidth(i, panelWidth),
        that = Ox.TextList({
            columns: [
                {
                    align: 'left',
                    id: 'name',
                    format: function(value) {
                        return ['country', 'language'].indexOf(id) > -1
                            ? $('<div>')
                                .append(
                                    $('<img>')
                                        .attr({src: Ox[
                                            id == 'country' ? 'getImageByGeoname' : 'getImageByLanguage'
                                        ]('icon', 16, value)})
                                        .css({
                                            float: 'left',
                                            width: '14px',
                                            height: '14px',
                                            margin: '0 3px 0 -2px',
                                            borderRadius: '4px'
                                        })
                                )
                                .append(
                                    $('<div>')
                                        .css({
                                            float: 'left',
                                            width: pandora.user.ui.groupsSizes[i] - 64 - Ox.UI.SCROLLBAR_SIZE,
                                            //background: 'red',
                                            textOverflow: 'ellipsis',
                                            overflowX: 'hidden'
                                        })
                                        .html(value)
                                )
                            : value
                    },
                    operator: group.type == 'string' ? '+' : '-',
                    title: title,
                    unique: true,
                    visible: true,
                    width: pandora.user.ui.groupsSizes[i] - 40 - Ox.UI.SCROLLBAR_SIZE
                },
                {
                    align: 'right',
                    id: 'items',
                    operator: '-',
                    title: '#',
                    visible: true,
                    width: 40
                }
            ],
            columnsVisible: true,
            id: 'group_' + id,
            items: function(data, callback) {
                //if (pandora.user.ui.showGroups) {
                    delete data.keys;
                    return pandora.api.find(Ox.extend(data, {
                        group: id,
                        query: pandora.user.ui.groupsData[i].query
                    }), callback);
                //} else {
                //    callback({data: {items: data.keys ? [] : 0}});
                //}
            },
            scrollbarVisible: true,
            selected: pandora.user.ui.groupsData[i].selected,
            sort: [{
                key: pandora.user.ui.groups[i].sort[0].key,
                operator: pandora.user.ui.groups[i].sort[0].operator
            }]
        })
        .bindEvent({
            paste: function(data) {
                pandora.$ui.list.triggerEvent('paste', data);
            },
            select: function(data) {
                var conditions = data.ids.map(function(value) {
                        return {
                            key: id,
                            value: value,
                            operator: '='
                        };
                    }),
                    index = pandora.user.ui.groupsData[i].index;
                if (Ox.isArray(index)) {
                    // this group had multiple selections and the | query
                    // was on the top level, i.e. not bracketed
                    pandora.user.ui.query = {
                        conditions: conditions,
                        operator: conditions.length > 1 ? '|' : ''
                    }
                } else {
                    if (index == -1) {
                        // this group had no selection, i.e. no query
                        index = pandora.user.ui.query.conditions.length;
                        if (pandora.user.ui.query.operator == '|') {
                            pandora.user.ui.query = {
                                conditions: [pandora.user.ui.query],
                                operator: '&'
                            };
                            index = 1;
                        } else {
                            pandora.user.ui.query.operator = index ? '&' : '';
                        }
                    }
                    if (conditions.length == 0) {
                        pandora.user.ui.query.conditions.splice(index, 1);
                        if (pandora.user.ui.query.conditions.length == 1) {
                            pandora.user.ui.query.operator = '';
                        }
                    } else if (conditions.length == 1) {
                        pandora.user.ui.query.conditions[index] = conditions[0];
                    } else {
                        pandora.user.ui.query.conditions[index].conditions = conditions;
                        pandora.user.ui.query.conditions[index].operator = '|';
                        delete pandora.user.ui.query.conditions[index].key;
                        delete pandora.user.ui.query.conditions[index].value;
                    }
                }
                pandora.Query.updateGroups();
                pandora.URL.push(pandora.Query.toString());
                pandora.reloadGroups(i);
            },
            sort: function(data) {
                Ox.print('SORT', data)
                var groups = Ox.clone(pandora.user.ui.groups);
                pandora.$ui.mainMenu.checkItem('sortMenu_sortgroups_sortgroup' + id + '_' + data.key);
                pandora.$ui.mainMenu.checkItem('sortMenu_ordergroups_ordergroup' + id + '_' + (data.operator == '+' ? 'ascending' : 'descending'));
                groups[i].sort = [{key: data.key, operator: data.operator}];
                pandora.UI.set({groups: groups});
            }
        });
    Ox.Select({
            items: pandora.site.groups.map(function(group) {
                return {
                    checked: group.id == id,
                    id: group.id,
                    title: group.title
                }
            }),
            max: 1,
            min: 1,
            type: 'image'
        })
        .bindEvent('change', function(data) {
            var groups = Ox.clone(pandora.user.ui.groups),
                id_ = data.selected[0].id,
                i_ = Ox.getPositionById(pandora.user.ui.groups, id_);
            if (i_ == -1) {
                // new group was not part of old group set
                if (pandora.user.ui.groupsData[i].selected.length) {
                    // if group with selection gets replaced, reload
                    pandora.user.ui.query.conditions.splice(pandora.user.ui.groupsData[i].index, 1);
                    pandora.Query.updateGroups();
                    pandora.URL.push(pandora.Query.toString());
                    pandora.reloadGroups(i);
                }
                groups[i] = makeGroup(id_);
                pandora.UI.set({groups: groups});
                replaceGroup(i, id_);
                // fixme: there is an obscure special case not yet covered:
                // switching to a new group may change find from advanced to not advanced
                // if part of the existing query works as a group selection in the new group
            } else {
                // swap two existing groups
                var groupsData = Ox.clone(pandora.user.ui.groupsData[i]);
                pandora.user.ui.groupsData[i] = pandora.user.ui.groupsData[i_];
                pandora.user.ui.groupsData[i_] = groupsData;
                groups[i] = makeGroup(id_, pandora.user.ui.groups[i_].sort);
                groups[i_] = makeGroup(id, pandora.user.ui.groups[i].sort);
                pandora.UI.set({groups: groups});
                replaceGroup(i, id_);
                replaceGroup(i_, id);
            }
            pandora.$ui.mainMenu.replaceMenu('sortMenu', pandora.getSortMenu());
            function makeGroup(id, sort) {
                // makes user.ui.groups object from site.groups object
                var group = Ox.getObjectById(pandora.site.groups, id);
                return {
                    id: group.id,
                    sort: sort || [{key: group.type == 'integer' ? 'name' : 'items', operator: '-'}]
                };
            }
            function replaceGroup(i, id, query) {
                // if query is passed, selected items will be derived from it
                var isOuter = i % 4 == 0;
                pandora.$ui[isOuter ? 'browser' : 'groupsInnerPanel'].replaceElement(
                    isOuter ? i / 2 : i - 1,
                    pandora.$ui.groups[i] = pandora.ui.group(id)
                );
            }
        })
        .appendTo(that.$bar.$element);
    return that;
};

pandora.ui.groups = function() {
    var $groups = [];
    //pandora.user.queryGroups = [];
    pandora.user.ui.groups.forEach(function(group, i) {
        $groups[i] = pandora.ui.group(group.id);
    });
    return $groups;
};

pandora.ui.groupsInnerPanel = function() {
    var that = Ox.SplitPanel({
        elements: [
            {
                element: pandora.$ui.groups[1],
                size: pandora.user.ui.groupsSizes[1]
            },
            {
                element: pandora.$ui.groups[2],
            },
            {
                element: pandora.$ui.groups[3],
                size: pandora.user.ui.groupsSizes[3]
            }
        ],
        orientation: 'horizontal'
    });
    return that;
};

