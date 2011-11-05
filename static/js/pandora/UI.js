// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

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
            item,
            list,
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

        Ox.Log('UI', 'SET', args)

        self.previousUI = Ox.clone(pandora.user.ui, true);
        self.previousUI._list = pandora.getListsState(self.previousUI.find);

        if ('find' in args) {
            // the challenge here is that find may change list,
            // and list may then change listSort and listView,
            // which we don't want to trigger, since find triggers
            // (values we put in add will be changed, but won't trigger)
            list = pandora.getListsState(args.find);
            pandora.user.ui._list = list;
            pandora.user.ui._groupsState = pandora.getGroupsState(args.find);
            pandora.user.ui._findState = pandora.getFindState(args.find);
            if (pandora.$ui.appPanel) {
                // if we're not on page load,
                // switch from item view to list view
                args['item'] = '';
            }
            add['itemFind'] = pandora.site.user.ui.itemFind;
            if (list != self.previousUI._list) {
                Ox.Log('', 'FIND HAS CHANGED LIST')
                // if find has changed list
                Ox.forEach(listSettings, function(listSetting, setting) {
                    // then for each setting that corresponds to a list setting
                    if (!pandora.user.ui.lists[list]) {
                        // either add the default setting
                        add[setting] = pandora.site.user.ui[setting];
                    } else {
                        // or the existing list setting
                        add[setting] = pandora.user.ui.lists[list][listSetting]
                    }
                });
            }
            add.itemFind = pandora.isItemFind(args.find)
                ? args.find : pandora.site.user.ui.itemFind;
        }

        // it is important to check for find first, so that if find
        // changes list, pandora.user.ui._list is correct here
        item = args['item'] || pandora.user.ui.item,
        list = pandora.user.ui._list || self.previousUI._list;

        if (!pandora.user.ui.lists[list]) {
            add['lists.' + that.encode(list)] = {};
        }
        Ox.forEach(listSettings, function(listSetting, setting) {
            // for each setting that corresponds to a list setting
            // set that list setting to
            var key = 'lists.' + that.encode(list) + '.' + listSetting;
            if (setting in args) {
                // the setting passed to UI.set
                add[key] = args[setting];
            } else if (setting in add) {
                // or the setting changed via find
                add[key] = add[setting];
            } else if (!pandora.user.ui.lists[list]) {
                // or the default setting
                add[key] = pandora.site.user.ui[setting];
            }
        });

        if (args.item) {
            // when switching to an item, update list selection
            add['listSelection'] = [args.item];
            add['lists.' + that.encode(list) + '.selection'] = [args.item];
            if (
                !args.itemView
                && ['video', 'timeline'].indexOf(pandora.user.ui.itemView) > -1
                && !pandora.user.ui.videoPoints[item]
            ) {
                // if the item view won't be changed, remains a video view,
                // and there are no video points yet, add default video points
                add['videoPoints.' + item] = {'in': 0, out: 0, position: 0};
            }
        }

        if (['video', 'timeline'].indexOf(args.itemView) > -1) {
            // when switching to a video view, add it as default video view
            args.videoView = args.itemView;
            if (!pandora.user.ui.videoPoints[item]) {
                // if there are no video points yet, add default video points
                add['videoPoints.' + item] = {'in': 0, out: 0, position: 0};
            }
        }

        [args, add].forEach(function(obj, isAdd) {
            Ox.forEach(obj, function(val, key) {
                Ox.Log('', 'key/val', key, val)
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

