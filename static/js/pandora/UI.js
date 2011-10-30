// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.UI = (function() {

    var self = {}, that = {};

    self.previousUI = {};

    that.encode = function(val) {
        return val.replace(/\./g, '\\.');
    };

    that.getPrevious = function(key) {
        // fixme: probably unneeded by now
        return !key ? self.previousUI : self.previousUI[key];
    };

    that.reset = function() {
        pandora.user.ui = pandora.site.user.ui;
        pandora.user.ui._list = pandora.getListsState(pandora.user.ui.find);
        pandora.user.ui._groupsState = pandora.getGroupsState(pandora.user.ui.find);
        pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
    };

    // sets pandora.user.ui.key to val
    // key foo.bar.baz sets pandora.user.ui.foo.bar.baz
    // val null removes a key
    that.set = function(/* {key: val}[, flag] or key, val[, flag] */) {
        var add = {},
            args,
            doNotTriggerEvents,
            listSettings = pandora.site.listSettings,
            set = {},
            trigger = {};
        if (Ox.isObject(arguments[0])) {
            args = arguments[0];
            triggerEvents = Ox.isUndefined(arguments[1]) ? true : arguments[1];
        } else {
            args = Ox.makeObject([arguments[0], arguments[1]]);
            triggerEvents = Ox.isUndefined(arguments[2]) ? true : arguments[1];
        }
        Ox.print('UI SET', args)
        self.previousUI = Ox.clone(pandora.user.ui, true);
        self.previousUI._list = pandora.getListsState(self.previousUI.find);
        if ('find' in args) {
            // the challenge here is that find may change list,
            // and list may then change listSort and listView,
            // which we don't want to trigger, since find triggers
            // (values we put in add will be changed, but won't trigger)
            var list = pandora.getListsState(args.find);
            pandora.user.ui._list = list;
            pandora.user.ui._groupsState = pandora.getGroupsState(args.find);
            pandora.user.ui._findState = pandora.getFindState(args.find);
            if (pandora.$ui.appPanel) {
                // if we're not on page load,
                // switch from item view to list view
                args['item'] = '';
            }
            add['itemFind'] = pandora.site.user.ui.itemFind;
            if (!pandora.user.ui.lists[list]) {
                add['lists.' + that.encode(list)] = {};
            }
            if (list != self.previousUI._list) {
                Ox.print('FIND HAS CHANGED LIST')
                if (!pandora.user.ui.lists[list]) {
                    add['lists.' + that.encode(list)] = {};
                }
                Ox.forEach(listSettings, function(listSetting, setting) {
                    if (!pandora.user.ui.lists[list]) {
                        // add default list setting and copy to settings
                        add[
                            'lists.' + that.encode(list) + '.' + listSetting
                        ] = pandora.site.user.ui[setting];
                        add[setting] = pandora.site.user.ui[setting];
                    } else {
                        // copy lists setting to settings
                        add[setting] = pandora.user.ui.lists[list][listSetting]
                    }
                });
            }
            add.itemFind = pandora.isItemFind(args.find)
                ? args.find : pandora.site.user.ui.itemFind;
        }
        // it is important to check for find first, so that if find
        // changes list, pandora.user.ui._list is correct here
        var item = args['item'] || pandora.user.ui.item,
            list = pandora.user.ui._list || '';
        if (!pandora.user.ui.lists[list]) {
            add['lists.' + that.encode(list)] = {};
        }
        Ox.forEach(args, function(val, key) {
            if (Object.keys(listSettings).indexOf(key) > -1) {
                // if applicable, copy setting to list setting
                add['lists.' + that.encode(list) + '.' + listSettings[key]] = val;
            }
            if (key == 'item' && val) {
                // when switching to an item, update list selection
                add['listSelection'] = [val];
                if (!pandora.user.ui.lists[list]) {
                    add['lists.' + that.encode(list)] = {};
                }
                add['lists.' + that.encode(list) + '.selection'] = [val];
            }
            if (!args['videoPoints.' + item] && ((
                key == 'item'
                && ['video', 'timeline'].indexOf(pandora.user.ui.itemView) > -1
                && !pandora.user.ui.videoPoints[val]
                ) || (
                key == 'itemView'
                && ['video', 'timeline'].indexOf(val) > -1
                && !pandora.user.ui.videoPoints[item]
            ))) {
                // when switching to a video view, add default videoPoints
                add['videoPoints.' + item] = {'in': 0, out: 0, position: 0};
            }
            if (key == 'itemView' && ['video', 'timeline'].indexOf(val) > -1) {
                // when switching to a video view, add it as default video view
                add.videoView = val;
            }
        });
        [args, add].forEach(function(obj, isAdd) {
            Ox.forEach(obj, function(val, key) {
                Ox.print('key/val', key, val)
                // make sure to not split at escaped dots ('\.')
                var keys = key.replace(/\\\./g, '\n').split('.').map(function(key) {
                        return key.replace(/\n/g, '.')
                    }),
                    ui = pandora.user.ui;
                while (keys.length > 1) {
                    ui = ui[keys.shift()];
                }
                if (!Ox.isEqual(ui[keys[0]], val)) {
                    if (val === null) {
                        delete ui[keys[0]]
                    } else {
                        ui[keys[0]] = val;
                    }
                    set[key] = val;
                    if (!isAdd) {
                        trigger[key] = val;
                    }
                }
            });
        });
        Ox.len(set) && pandora.api.setUI(set);
        triggerEvents && Ox.forEach(trigger, function(val, key) {
            Ox.forEach(pandora.$ui, function(element) {
                element.ox && element.triggerEvent('pandora_' + key.toLowerCase(), {
                    value: val,
                    previousValue: self.previousUI[key]
                });
            });
        });

        pandora.URL.update(Object.keys(
            !pandora.$ui.appPanel ? args : trigger
        ));
    };

    return that;

}());

