// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.Query = (function() {

    function constructFind(query) {
        return /*encodeURI(*/query.conditions.map(function(condition) {
            var ret;
            if (condition.conditions) {
                ret = '[' + constructFind(condition) + ']';
            } else {
                ret = condition.value !== ''
                    ? condition.key + (condition.key ? ':' : '')
                    + constructValue(condition.value, condition.operator)
                    : null;
            }
            return ret;
        }).join(query.operator == '&' ? ',' : '|')/*)*/;
    }

    function constructValue(value, operator) {
        value = encodeURIComponent(value);
        operator = operator.replace('=', '^$');
        if (operator.indexOf('$') > -1) {
            value = operator.substr(0, operator.length - 1) + value + '$';
        } else {
            value = operator + value;
        }
        return value;
    }

    function everyCondition(conditions, key, operator) {
        // if every condition has the given key and operator
        // (excluding conditions where all subconditions match)
        // returns true, otherwise false
        return Ox.every(conditions, function(condition) {
            return condition.key == key && condition.operator == operator;
        });
    }

    function getGroupsData(fullQuery) {
        // a group is selected if exactly one condition in an & query
        // or every condition in an | query
        // has the group id as key and "=" as operator
        return pandora.user.ui.groups.map(function(group) {
            var index = -1,
                key = group.id,
                query = Ox.clone(fullQuery, true),
                selected = [];
            if (query.operator == '|') {
                if (everyCondition(query.conditions, key, '=')) {
                    index = Ox.range(query.conditions.length);
                    selected = query.conditions.map(function(condition) {
                        return condition.value;
                    });
                }
            } else {
                index = oneCondition(query.conditions, key, '=');
                if (index > -1) {
                    selected = query.conditions[index].conditions
                        ? query.conditions[index].conditions.map(function(condition) {
                            return condition.value;
                        })
                        : [query.conditions[index].value];
                }
            }
            if (selected.length) {
                if (Ox.isArray(index)) {
                    query = {conditions: [], operator: ''};
                } else {
                    query.conditions.splice(index, 1);
                    if (query.conditions.length == 1) {
                        if (query.conditions[0].conditions) {
                            // unwrap single remaining bracketed query
                            query = {
                                conditions: query.conditions[0].conditions,
                                operator: query.conditions[0].operator
                            }
                        } else {
                            query.operator = '';
                        }
                    }
                }
            }
            return {
                index: index,
                query: query,
                selected: selected
            };
        });
    }

    function parseFind(str) {
        // takes a find query string, returns useful information about the application's state
        // (selected lists, find input key/value (and index of the corresponding condition), query object)
        var conditions,
            index, indices,
            ret = {
                find: {index: -1, key: '', value: ''},
                groups: [], // {index, query, selected}
                list: '',
                query: {conditions: [], operator: '&'}
            },
            subconditions = [];
        if (str.length) {
            // replace subconditions with placeholder,
            // so we can later split by main operator
            var counter = 0;
            Ox.forEach(str, function(c, i) {
                if (c == ']') {
                    counter--;
                }
                if (counter >= 1) {
                    subconditions[subconditions.length - 1] += c;
                }
                if (c == '[') {
                    (++counter == 1) && subconditions.push('');
                }
            });
            subconditions.forEach(function(subcondition, i) {
                str = str.replace(subcondition, i);
            });
            if (str.indexOf(',') > -1) {
                ret.query.operator = '&';
            } else if (str.indexOf('|') > -1) {
                ret.query.operator = '|';
            }
            ret.query.conditions = (
                ret.query.operator == '' ? [str] : str.split(ret.query.operator == '&' ? ',' : '|')
            ).map(function(condition, i) {
                var kv, ret;
                if (condition[0] == '[') {
                    // re-insert subcondition
                    ret = parseFind(subconditions[parseInt(Ox.sub(condition, 1, -1))]).query;
                } else {
                    kv = ((condition.indexOf(':') > -1 ? '' : ':') + condition).split(':');
                    ret = Ox.extend({key: kv[0]}, parseValue(kv[1]));
                }
                return ret;
            });
            // a list is selected if exactly one condition in an & query
            // has "list" as key and "" as operator
            if (ret.query.operator != '|') {
                index = oneCondition(ret.query.conditions, 'list', '');
                if (index > -1 && !ret.query.conditions[index].conditions) {
                    ret.list = ret.query.conditions[index].value;
                }
            }
            ret.groups = getGroupsData(ret.query);
            // find is populated if exactly one condition in an & query
            // has a findKey as key and "" as operator
            // (and all other conditions are either list or groups)
            // or if all conditions in an | query have the same group id as key
            if (ret.query.operator == '|') {
                ret.find = {index: -1, key: 'advanced', value: ''};
                Ox.map(pandora.user.ui.groups, function(key) {
                    if (everyCondition(ret.query.conditions, key, '=')) {
                        ret.find.key = '';
                        return false;
                    }
                });
            } else {
                // number of conditions that are not list or groups
                conditions = ret.query.conditions.length
                    - (ret.list != '')
                    - ret.groups.filter(function(group) {
                        return group.index > -1;
                    }).length;
                // indices of non-advanced find queries
                indices = Ox.map(pandora.site.findKeys, function(findKey) {
                    var key = findKey.id == 'all' ? '' : findKey.id,
                        index = oneCondition(ret.query.conditions, key, '');
                    return index > -1 ? index : null;
                });
                if (conditions > 0 || indices.length > 0) {
                    ret.find = (
                        conditions == 1 && indices.length == 1
                        && !ret.query.conditions[indices[0]].conditions
                    ) ? {
                        index: indices[0],
                        key: ret.query.conditions[indices[0]].key,
                        value: decodeURIComponent(ret.query.conditions[indices[0]].value)
                    } : {index: -1, key: 'advanced', value: ''}
                }
            }
        }
        return ret;
    }

    function oneCondition(conditions, key, operator) {
        // if exactly one condition has the given key and operator
        // (including conditions where all subconditions match)
        // returns the corresponding index, otherwise returns -1
        var indices = Ox.map(conditions, function(condition, i) {
            return (
                condition.conditions
                ? everyCondition(condition.conditions, key, operator)
                : condition.key == key && condition.operator == operator
            ) ? i : null;
        });
        return indices.length == 1 ? indices[0] : -1;
    }

    function parseValue(str) {
        var value = {
                value: decodeURI(str),
                operator: ''
            };
        if (value.value[0] == '!') {
            value.operator = '!';
            value.value = value.value.substr(1);
        }
        if ('^<>'.indexOf(value.value[0]) > -1) {
            value.operator += value.value[0];
            value.value = value.value.substr(1);
        }
        if (value.value.substr(-1) == '$') {
            value.operator += '$';
            value.value = value.value.substr(0, value.value.length - 1);
        }
        value.operator = value.operator.replace('^$', '=');
        return value;
    }

    return {

        fromString: function(str) {
            var query = Ox.unserialize(str),
                data = parseFind(query.find || '');
            Ox.Log('', Ox.repeat('-', 120));
            Ox.Log('', 'STATE', data);
            Ox.Log('', Ox.repeat('-', 120));
            pandora.UI.set({list: data.list});
            !pandora.user.ui.lists[data.list] && pandora.UI.set(
                'lists|' + data.list, pandora.site.user.ui.lists['']
            );
            pandora.user.ui.find = data.find;
            pandora.user.ui.groupsData = data.groups;
            pandora.user.ui.query = data.query;
            if ('sort' in query) {
                pandora.UI.set('lists|' + pandora.user.ui.list + '|sort', query.sort.split(',').map(function(v) {
                    var hasOperator = '+-'.indexOf(v[0]) > -1,
                        key = hasOperator ? v.substr(1) : v,
                        operator = hasOperator ? v[0]/*.replace('+', '')*/ : pandora.getSortOperator(key);
                    return {
                        key: key,
                        operator: operator
                    };
                }));
            }
            /*
            if ('view' in query) {
                pandora.UI.set(['lists', pandora.user.ui.list, 'listView'].join('|'), query.view);
            }
            */
        },

        /*
        toObject: function(groupId) {
            //Ox.Log('', 'tO', pandora.user.ui.findQuery.conditions)
            // the inner $.merge() creates a clone
            var conditions = $.merge(
                    $.merge([], pandora.user.ui.listQuery.conditions),
                    pandora.user.ui.findQuery.conditions
                ),
                operator;
            $.merge(conditions, pandora.user.queryGroups ? $.map(pandora.user.queryGroups, function(v, i) {
                if (v.id != groupId && v.query.conditions.length) {
                    return v.query.conditions.length == 1 ?
                        v.query.conditions : v.query;
                }
            }) : []);
            operator = conditions.length < 2 ? '' : ','; // fixme: should be &
            //Ox.Log('', '>>', groupId, pandora.user.ui.find, conditions);
            return {
                conditions: conditions,
                operator: operator
            };
        },
        */

        toString: function() {
            //Ox.Log('', 'tS', pandora.user.ui.find)
            if (!pandora.user.ui.item) {
                var sort = pandora.user.ui.lists[pandora.user.ui.list].sort[0],
                    key = sort.key,
                    operator = sort.operator;
                return pandora.user.ui.lists[pandora.user.ui.list].listView + '/?' + Ox.serialize({
                    find: constructFind(pandora.user.ui.query),
                    sort: (operator == pandora.getSortOperator(key) ? '' : operator) + key
                });
            } else {
                return pandora.user.ui.item + '/' + pandora.user.ui.itemView;
            }
        },

        updateGroups: function() {
            pandora.user.ui.groupsData = getGroupsData(pandora.user.ui.query);
        }

    };

})();
