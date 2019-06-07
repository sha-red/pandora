'use strict';

pandora.ui.documentFilter = function(id) {
    var i = Ox.getIndexById(pandora.user.ui.documentFilters, id),
        filter = Ox.getObjectById(pandora.site.documentFilters, id),
        panelWidth = Ox.$document.width() - (pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize) - 1,
        title = Ox._(Ox.getObjectById(pandora.site.documentFilters, id).title),
        //width = pandora.getFilterWidth(i, panelWidth),
        that = Ox.TableList({
            _selected: !pandora.user.ui.showFilters
                ? pandora.user.ui._documentFilterState[i].selected
                : false,
            columns: [
                {
                    align: 'left',
                    id: 'name',
                    format: function(value) {
                        var layer = Ox.getObjectById(pandora.site.layers, filter.id),
                            key = Ox.getObjectById(pandora.site.itemKeys, filter.id);
                        if ((layer && layer.translate) || (key && key.translate)) {
                            value = Ox._(value)
                        }
                        return filter.flag
                            ? $('<div>')
                                .append(
                                    $('<img>')
                                        .attr({src: Ox[
                                            filter.flag == 'country'
                                                ? 'getFlagByGeoname'
                                                : 'getFlagByLanguage'
                                        ](value, 16)})
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
                                        .addClass('flagname')
                                        .css({
                                            float: 'left',
                                            width: pandora.user.ui.filterSizes[i]
                                                - 68 - Ox.UI.SCROLLBAR_SIZE,
                                            textOverflow: 'ellipsis',
                                            overflowX: 'hidden'
                                        })
                                        .html(value)
                                )
                            : value
                    },
                    operator: filter.type == 'string' || filter.type == 'layer' ? '+' : '-',
                    title: title,
                    visible: true,
                    width: pandora.user.ui.filterSizes[i] - 44 - Ox.UI.SCROLLBAR_SIZE
                },
                {
                    align: 'right',
                    format: function(value) {
                        return Ox.formatNumber(value);
                    },
                    id: 'items',
                    operator: '-',
                    title: '#',
                    visible: true,
                    width: 44
                }
            ],
            columnsVisible: true,
            id: 'filter_' + id,
            items: function(data, callback) {
                if (pandora.user.ui.showFilters) {
                    delete data.keys;
                    return pandora.api.findDocuments(Ox.extend(data, {
                        group: id,
                        query: pandora.user.ui._documentFilterState[i].find
                    }), callback);
                } else {
                    callback({data: {items: data.keys ? [] : 0}});
                }
            },
            scrollbarVisible: true,
            selected: pandora.user.ui.showFilters
                ? pandora.user.ui._documentFilterState[i].selected
                : [],
            sort: [{
                key: pandora.user.ui.documentFilters[i].sort[0].key,
                operator: pandora.user.ui.documentFilters[i].sort[0].operator
            }],
            unique: 'name'
        })
        .bindEvent({
            init: function(data) {
                that.setColumnTitle(
                    'name',
                    Ox._(Ox.getObjectById(pandora.site.documentFilters, id).title)
                    + '<div class="OxColumnStatus OxLight">'
                    + Ox.formatNumber(data.items) + '</div>'
                );
            },
            paste: function(data) {
                pandora.$ui.list.triggerEvent('paste', data);
            },
            select: function(data) {
                // fixme: cant index be an empty array, instead of -1?
                // FIXME: this is still incorrect when deselecting a filter item
                // makes a selected item in another filter disappear
                var conditions = data.ids.map(function(value) {
                        return {
                            key: id,
                            value: value,
                            operator: '=='
                        };
                    }),
                    index = pandora.user.ui._documentFilterState[i].index,
                    find = Ox.clone(pandora.user.ui.findDocuments, true);
                if (Ox.isArray(index)) {
                    // this filter had multiple selections and the | query
                    // was on the top level, i.e. not bracketed
                    find = {
                        conditions: conditions,
                        operator: conditions.length > 1 ? '|' : '&'
                    }
                } else {
                    if (index == -1) {
                        // this filter had no selection, i.e. no query
                        index = find.conditions.length;
                        if (find.operator == '|') {
                            find = {
                                conditions: [find],
                                operator: '&'
                            };
                            index = 1;
                        } else {
                            find.operator = '&';
                        }
                    }
                    if (conditions.length == 0) {
                        // nothing selected
                        find.conditions.splice(index, 1);
                        if (find.conditions.length == 1) {
                            if (find.conditions[0].conditions) {
                                // unwrap single remaining bracketed query
                                find = {
                                    conditions: find.conditions[0].conditions,
                                    operator: '|'
                                };
                            } else {
                                find.operator = '&';
                            }
                        }
                    } else if (conditions.length == 1) {
                        // one item selected
                        find.conditions[index] = conditions[0];
                    } else {
                        // multiple items selected
                        if (pandora.user.ui.findDocuments.conditions.length == 1) {
                            find = {
                                conditions: conditions,
                                operator: '|'
                            };
                        } else {
                            find.conditions[index] = {
                                conditions: conditions,
                                operator: '|'
                            };
                        }
                    }
                }
                pandora.UI.set({findDocuments: find});
                pandora.$ui.documentFilters.updateMenus();
            },
            sort: function(data) {
                Ox.Log('', 'SORT', data)
                var filters = Ox.clone(pandora.user.ui.documentFilters);
                pandora.$ui.mainMenu.checkItem('sortMenu_sortfilters_sortfilter' + id + '_' + data.key);
                pandora.$ui.mainMenu.checkItem('sortMenu_orderfilters_orderfilter' + id + '_' + (data.operator == '+' ? 'ascending' : 'descending'));
                filters[i].sort = [{key: data.key, operator: data.operator}];
                pandora.UI.set({filters: filters});
            }
        }),
        $menu = Ox.MenuButton({
                items: [
                    {id: 'clearFilter', title: Ox._('Clear Filter'), keyboard: 'shift control a'},
                    {id: 'clearFilters', title: Ox._('Clear All Filters'), keyboard: 'shift alt control a'},
                    {},
                    {group: 'filter', max: 1, min: 1, items: pandora.site.documentFilters.map(function(filter) {
                        return Ox.extend({checked: filter.id == id}, filter);
                    })}
                ],
                type: 'image',
            })
            .css(Ox.UI.SCROLLBAR_SIZE == 8 ? {
                right: '-1px',
                width: '8px',
            } : {
                right: '2px',
                width: (Ox.UI.SCROLLBAR_SIZE - 2) + 'px'
            })
            .bindEvent({
                change: function(data) {
                    var filters = Ox.clone(pandora.user.ui.documentFilters),
                        find,
                        id_ = data.checked[0].id,
                        i_ = Ox.getIndexById(pandora.user.ui.documentFilters, id_);
                    if (i_ == -1) {
                        // new filter was not part of old filter set
                        if (pandora.user.ui._documentFilterState[i].selected.length) {
                            // if filter with selection gets replaced, update find
                            find = Ox.clone(pandora.user.ui.findDocuments, true);
                            find.conditions.splice(pandora.user.ui._documentFilterState[i].index, 1);
                        }
                        filters[i] = makeFilter(id_);
                        pandora.UI.set(Ox.extend({
                            filters: filters
                        }, find ? {
                            findDocuments: find
                        } : {}));
                        replaceFilter(i, id_);
                        // fixme: there is an obscure special case not yet covered:
                        // switching to a new filter may change find from advanced to not advanced
                        // if part of the existing query works as a filter selection in the new filter
                    } else {
                        // swap two existing filters
                        var filterData = Ox.clone(pandora.user.ui._documentFilterState[i]);
                        pandora.user.ui._documentFilterState[i] = pandora.user.ui._documentFilterState[i_];
                        pandora.user.ui._documentFilterState[i_] = filterData;
                        filters[i] = makeFilter(id_, pandora.user.ui.documentFilters[i_].sort);
                        filters[i_] = makeFilter(id, pandora.user.ui.documentFilters[i].sort);
                        pandora.UI.set({filters: filters});
                        replaceFilter(i, id_);
                        replaceFilter(i_, id);
                    }
                    pandora.$ui.documentFilters.updateMenus();
                    function makeFilter(id, sort) {
                        // makes user.ui._documentFilterState object from site.documentFilters object
                        var filter = Ox.getObjectById(pandora.site.documentFilters, id);
                        return {
                            id: filter.id,
                            sort: sort || [{key: filter.type == 'integer' ? 'name' : 'items', operator: '-'}]
                        };
                    }
                    function replaceFilter(i, id) {
                        var isOuter = i % 4 == 0;
                        pandora.$ui[isOuter ? 'browser' : 'filtersInnerPanel'].replaceElement(
                            isOuter ? i / 2 : i - 1,
                            pandora.$ui.documentFilters[i] = pandora.ui.documentFilter(id)
                        );
                    }
                },
                click: function(data) {
                    if (data.id == 'clearFilter') {
                        // FIXME: List should trigger event on options change
                        if (!Ox.isEmpty(that.options('selected'))) {
                            that.options({selected: []}).triggerEvent('select', {ids: []});
                        }
                    } else if (data.id == 'clearFilters') {
                        pandora.$ui.documentFilters.clearFilters();
                    }
                }
            })
            .appendTo(that.$bar);
    Ox.UI.SCROLLBAR_SIZE < 16 && $($menu.find('input')[0]).css({
        marginRight: '-3px',
        marginTop: '1px',
        width: '8px',
        height: '8px'
    });
    that.disableMenuItem = function(id) {
        $menu.disableItem(id);
    };
    that.enableMenuItem = function(id) {
        $menu.enableItem(id);
    };
    return that;
};

pandora.ui.documentFilters = function() {
    var $filters = [];
    pandora.user.ui.documentFilters.forEach(function(filter, i) {
        $filters[i] = pandora.ui.documentFilter(filter.id);
    });
    $filters.clearFilters = function() {
        var find = Ox.clone(pandora.user.ui.findDocuments, true),
            indices = pandora.user.ui._documentFilterState.map(function(filterState) {
                return filterState.index;
            }).filter(function(index) {
                return index > -1;
            });
        find.conditions = find.conditions.filter(function(condition, index) {
            return !Ox.contains(indices, index);
        });
        pandora.UI.set({findDocuments: find})
    };
    $filters.updateMenus = function() {
        var selected = $filters.map(function($filter) {
                return !Ox.isEmpty($filter.options('selected'));
            }),
            filtersHaveSelection = !!Ox.sum(selected);
        $filters.forEach(function($filter, i) {
            $filter[
                 selected[i] ? 'enableMenuItem' : 'disableMenuItem'
            ]('clearFilter');
            $filter[
                filtersHaveSelection ? 'enableMenuItem' : 'disableMenuItem'
            ]('clearFilters');
        });
        return $filters;
    };
    return $filters.updateMenus();
};

pandora.ui.documentFiltersInnerPanel = function() {
    var that = Ox.SplitPanel({
        elements: [
            {
                element: pandora.$ui.documentFilters[1],
                size: pandora.user.ui.filterSizes[1]
            },
            {
                element: pandora.$ui.documentFilters[2]
            },
            {
                element: pandora.$ui.documentFilters[3],
                size: pandora.user.ui.filterSizes[3]
            }
        ],
        orientation: 'horizontal'
    });
    return that;
};


