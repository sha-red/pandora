// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.Query = (function() {

    function parseFind2(str) {
        // takes a string, returns useful information about the application's state
        Ox.print('parseFind2', str)
        str = str || '';
        var conditions,
            ret = {
                find: {key: '', value: ''},
                groups: [],
                lists: [],
                query: {conditions: [], operator: ''}
            },
            subconditions = str.match(/\[.*?\]/g) || [];
        // replace subconditions with placeholder,
        // so we can later split by main operator
        subconditions.forEach(function(subcondition, i) {
            subconditions[i] = subcondition.substr(1, subcondition.length - 2);
            str = str.replace(subconditions[i], i);
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
                ret = parseFind2(subconditions[parseInt(condition.substr(1, condition.length - 2))]).query;
            } else {
                kv = ((condition.indexOf(':') > -1 ? '' : ':') + condition).split(':');
                ret = Ox.extend({key: kv[0]}, parseValue(kv[1]));
            }
            return ret;
        });
        // lists are selected if exactly one condition in an & query
        // or every condition in an | query
        // has "list" as key and "" as operator
        ret.lists = ret.query.operator == '|'
            ? everyCondition(ret.query.conditions, 'list', '')
            : oneCondition(ret.query.conditions, 'list', '');
        // find is populated if exactly one condition in an & query
        // has a findKey as key and "" as operator
        if (ret.query.operator == '|') {
            ret.find = {key: 'advanced', value: ''};
        } else {
            var conditions = Ox.map(pandora.site.findKeys, function(findKey) {
                var values = oneCondition(ret.query.conditions, findKey.id, '');
                return values.length ? {key: findKey.id, values: values[0]} : null;
            });
            ret.find = conditions.length == 0 ? {key: '', value: ''}
                : conditions.length == 1 && conditions[0].values.length == 1
                ? {key: conditions[0].key, value: conditions[0].values[0]}
                : {key: 'advanced', value: ''}
        }
        // a group is selected if exactly one condition in an & query
        // or every condition in an | query
        // has the group id as key and "=" as operator
        ret.groups = pandora.user.ui.groups.map(function(key) {
            var selected = ret.query.operator == '|'
                    ? everyCondition(ret.query.conditions, key, '=')
                    : oneCondition(ret.query.conditions, key, '='),
                query = ret.query;
            if (selected.length) {
                query = {
                    conditions: Ox.map(ret.query.conditions, function(condition) {
                        var ret;
                        if (condition.conditions) {
                            ret = condition.conditions[0].key != key ? condition : null; // fixme: correct? see below...
                        } else {
                            ret = condition.key != key ? condition : null;
                        }
                        return ret; 
                    }),
                    operator: ''
                };
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
            return {
                query: query,
                selected: selected
            };
        });
        function oneCondition(conditions, key, operator) {
            // if exactly one condition has the given key and operator
            // (including conditions where all subconditions match)
            // returns the corresponding value(s), otherwise returns []
            var values = Ox.map(conditions, function(condition) {
                var ret, same;
                if (condition.conditions) {
                    var every = everyCondition(condition.conditions, key, operator); // fixme: what if [key|key],[key|other]?
                    ret = every.length ? every : null;
                } else {
                    ret = condition.key == key && condition.operator == operator ? [condition.value] : null
                }
                return ret;
            });
            return values.length == 1 ? values[0] : [];
        }
        function everyCondition(conditions, key, operator) {
            // if every condition has the given key and operator
            // (excluding conditions where all subconditions match)
            // returns the corresponding value(s), otherwise returns []
            var values = Ox.map(conditions, function(condition) {
                return condition.key == key && condition.operator == operator ? condition.value : null
            });
            return values.length == conditions.length ? values : [];
        }
        return ret;
    }

    function constructFind(query) {
        //Ox.print('cF', query)
        return /*encodeURI(*/$.map(query.conditions, function(v, i) {
            if (!Ox.isUndefined(v.conditions)) {
                return '[' + constructFind(v) + ']';
            } else {
                return v.value !== '' ? v.key + (v.key ? ':' : '') + constructValue(v.value, v.operator) : null;
            }
        }).join(query.operator)/*)*/;
    }

    function constructValue(value, operator) {
        operator = operator.replace('=', '^$');
        if (operator.indexOf('$') > -1) {
            value = operator.substr(0, operator.length - 1) + value + '$';
        } else {
            value = operator + value;
        }
        return value;
    }

    function mergeFind() {
    }

    function parseFind(str) {
        str = str || '';
        var find = {
                conditions: [],
                operator: ''
            },
            subconditions = str.match(/\[.*?\]/g) || [];
        $.each(subconditions, function(i, v) {
            subconditions[i] = v.substr(1, v.length - 2);
            str = str.replace(v, '[' + i + ']');
        });
        if (str.indexOf(',') > -1) {
            find.operator = '&';
        } else if (str.indexOf('|') > -1) {
            find.operator = '|';
        }
        //Ox.print('pF', str, find.operator)
        find.conditions = $.map(find.operator === '' ? [str] : str.split(find.operator == '&' ? ',' : '|'), function(v, i) {
            //Ox.print('v', v)
            var ret, kv;
            if (v[0] == '[') {
                //Ox.print('recursion', subconditions)
                ret = parseFind(subconditions[parseInt(v.substr(1, v.length - 2))]);
            } else {
                kv = ((v.indexOf(':') > - 1 ? '' : ':') + v).split(':');
                if (kv[0] == 'list') { // fixme: this is just a hack
                    pandora.user.ui.listQuery = {conditions: [$.extend({
                        key: kv[0]
                    }, parseValue(kv[1]))], operator: ''};
                } else {
                    ret = $.extend({
                        key: kv[0]
                    }, parseValue(kv[1]));
                }
            }
            return ret;
        });
        return find;
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
            var list = '',
                query = Ox.unserialize(str.substr(1)),
                sort = [];
            if ('find' in query) {
                Ox.print(Ox.repeat('-', 80));
                Ox.print('parseFind2', parseFind2(query.find));
                Ox.print(Ox.repeat('-', 80));
                pandora.user.ui.listQuery = {conditions: [], operator: ''}; // fixme: hackish
                pandora.user.ui.findQuery = parseFind(query.find);
                if (pandora.user.ui.listQuery.conditions.length) {
                    list = pandora.user.ui.listQuery.conditions[0].value;
                    !pandora.user.ui.lists[list] && pandora.UI.set(
                        ['lists', list].join('|'), pandora.site.user.ui.lists['']
                    );
                }
                pandora.UI.set({list: list});
                //Ox.print('user.ui.findQuery', pandora.user.ui.findQuery)
            }
            if ('sort' in query) {
                sort = query.sort.split(',');
                pandora.UI.set(['lists', pandora.user.ui.list, 'sort'].join('|'), query.sort.split(',').map(function(v) {
                    var hasOperator = '+-'.indexOf(v[0]) > -1,
                        key = hasOperator ? v.substr(1) : v,
                        operator = hasOperator ? v[0]/*.replace('+', '')*/ : pandora.getSortOperator(key);
                    return {
                        key: key,
                        operator: operator
                    };
                }));
            }
            if ('view' in query) {
                pandora.UI.set(['lists', pandora.user.ui.list, 'listView'].join('|'), query.view);
            }
        },

        toObject: function(groupId) {
            //Ox.print('tO', pandora.user.ui.findQuery.conditions)
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
            //Ox.print('>>', groupId, pandora.user.ui.find, conditions);
            return {
                conditions: conditions,
                operator: operator
            };
        },

        toString: function() {
            //Ox.print('tS', pandora.user.ui.find)
            var sort = pandora.user.ui.lists[pandora.user.ui.list].sort[0],
                key = sort.key,
                operator = sort.operator;
            return '?' + Ox.serialize({
                find: constructFind(pandora.Query.toObject()),
                sort: (operator == pandora.getSortOperator(key) ? '' : operator) + key,
                view: pandora.user.ui.lists[pandora.user.ui.list].listView
            });
        }

    };

})();
