// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.Query = (function() {

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
                pandora.UI.set(['lists', pandora.user.ui.list, 'sort'].join('|'), $.map(query.sort.split(','), function(v, i) {
                    var hasOperator = '+-'.indexOf(v[0]) > -1,
                        key = hasOperator ? query.sort.substr(1) : query.sort,
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
