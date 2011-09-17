// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.group = function(id) {
    var i = pandora.user.ui.groups.indexOf(id),
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
                    operator: id == 'year' ? '-' : '+',
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
                key: id == 'year' ? 'name' : 'items',
                operator: '-'
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
            var id_ = data.selected[0].id,
                i_ = pandora.user.ui.groups.indexOf(id_);
            if (i_ == -1) {
                // new group was not part of old group set
                if (pandora.user.ui.groupsData[i].selected.length) {
                    // if group with selection gets replaced, reload
                    pandora.user.ui.query.conditions.splice(pandora.user.ui.groupsData[i].index, 1);
                    pandora.Query.updateGroups();
                    pandora.URL.push(pandora.Query.toString());
                    pandora.reloadGroups(i);
                }
                pandora.user.ui.groups[i] = id_;
                pandora.UI.set({groups: pandora.user.ui.groups});
                replaceGroup(i, id_);
            } else {
                // swap two existing groups
                var groupsData = Ox.clone(pandora.user.ui.groupsData[i]);
                pandora.user.ui.groupsData[i] = pandora.user.ui.groupsData[i_];
                pandora.user.ui.groupsData[i_] = groupsData;
                pandora.user.ui.groups[i] = id_;
                pandora.user.ui.groups[i_] = id;
                pandora.UI.set({groups: pandora.user.ui.groups});
                replaceGroup(i, id_);
                replaceGroup(i_, id);
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
    pandora.user.queryGroups = [];
    pandora.user.ui.groups.forEach(function(id, i) {
        $groups[i] = pandora.ui.group(id);
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

