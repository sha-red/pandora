// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.UI = (function() {

    var self = {}, that = {};

    self.previousUI = {};

    that.bind = function() {
        Ox.Event.bind.apply(null, arguments);
    };

    that.encode = function(val) {
        return val.replace(/\./g, '\\.');
    };

    that.getPrevious = function(key) {
        return !key ? self.previousUI : self.previousUI[key];
    };

    // sets pandora.user.ui.key to val
    // key foo.bar.baz sets pandora.user.ui.foo.bar.baz
    // val null removes a key
    that.set = function(/*{key: val} or key, val*/) {
        var add = {},
            args = Ox.makeObject(arguments),
            listSettings = pandora.site.listSettings,
            set = {},
            trigger = {};
        Ox.print('UI SET', args)
        self.previousUI = Ox.clone(pandora.user.ui, true);
        Ox.forEach(args, function(val, key) {
            if (key == 'find') {
                // the challenge here is that find may change list,
                // and list may then change listSort and listView,
                // which we don't want to trigger, since find triggers
                var list = pandora.getListsState(val);
                add['item'] = '';
                pandora.user.ui._list = list;
                pandora.user.ui._groupsState = pandora.getGroupsState(val);
                pandora.user.ui._findState = pandora.getFindState(val);
                if (list != self.previousUI._list) {
                    if (!pandora.user.ui.lists[list]) {
                        add['lists.' + list] = {};
                    }
                    Ox.forEach(listSettings, function(listSetting, setting) {
                        if (!pandora.user.ui.lists[list]) {
                            // add default list setting and copy to settings
                            add['lists.' + list][listSetting] = pandora.site.user.ui[setting];
                            add[setting] = pandora.site.user.ui[setting];
                        } else {
                            // copy lists setting to settings
                            add[setting] = pandora.user.ui.lists[list][listSetting]
                        }
                    });
                }
            } else if (Object.keys(listSettings).indexOf(key) > -1) {
                // copy setting to list setting
                add['lists.' + that.encode(pandora.user.ui._list || '') + '.' + listSettings[key]] = val;
            } else if (key == 'item' && val) {
                // when switching to an item, update list selection
                add['listSelection'] = [val];
                add['lists.' + that.encode(pandora.user.ui._list || '') + '.selection'] = [val];
            } else if (
                key == 'itemView'
                && ['video', 'timeline'].indexOf(val) > -1
                && !pandora.user.ui.videoPoints[pandora.user.ui.item]
            ) {
                // add default videoPoints
                add['videoPoints.' + pandora.user.ui.item] = {'in': 0, out: 0, position: 0};
            }
        });
        [args, add].forEach(function(obj, isAdd) {
            Ox.forEach(obj, function(val, key) {
                var keys = key.replace(/([^\\])\./g, '$1\n').split('\n'),
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
                    // don't save or trigger events for private keys
                    //if (key[0] != '_') {
                    //}
                    set[key] = val;
                    if (!isAdd) {
                        trigger[key] = val;
                    }
                }
            });
        });
        Ox.len(set) && pandora.api.setUI(set);
        Ox.forEach(trigger, function(val, key) {
            // fixme: send previousVal as second parameter
            Ox.Event.trigger(key, val);
        });

        Ox.forEach(trigger, function(val, key) {
            Ox.forEach(pandora.$ui, function(element) {
                // fixme: send previousVal as second parameter
                element.ox && element.triggerEvent('pandora_' + key.toLowerCase(), {
                    value: val,
                    previousValue: self.previousUI[key]
                });
            });
        });
    };

    return that;

}());

