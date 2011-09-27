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
        var obj = Ox.makeObject(arguments),
            set = {},
            trigger = {};
        self.previousUI = Ox.clone(pandora.user.ui, true);
        Ox.forEach(obj, function(val, key) {
        });
        Ox.forEach(obj, function(val, key) {
            var i = 0,
                keys = key.split('.'),
                listSettings = pandora.site.listSettings,
                ui = pandora.user.ui;
            while (i < keys.length - 1) {
                ui = ui[keys[i]];
                i++;
            }
            if (!Ox.isEqual(ui[keys[i]], val)) {
                if (val === null) {
                    delete ui[keys[i]]
                } else {
                    ui[keys[i]] = val;
                }
                if (key[0] != '_') {
                    // don't save or trigger events for private keys
                    // set[key] = val;
                    set[key] = val;
                    trigger[key] = val;
                }
                if (key == 'find') {
                    // the challenge here is that find may change list,
                    // and list may then change listSort and listView,
                    // which we don't want to trigger, since find triggers
                    var list = pandora.getListsState()
                    pandora.user.ui._list = list;
                    pandora.user.ui._groupsState = pandora.getGroupsState();
                    pandora.user.ui._findState = pandora.getFindState();
                    if (list != self.previousUI.list) {
                        if (!pandora.user.ui.lists[list]) {
                            set['lists.' + that.encode(list)] = {};
                        }
                        Ox.forEach(listSettings, function(listSetting, setting) {
                            if (!pandora.user.ui.lists[list]) {
                                // add default list settings and copy to settings
                                set['lists.' + that.encode(list)][listSetting] = pandora.site.user.ui[setting];
                                set[setting] = pandora.site.user.ui[setting];
                            } else {
                                // copy list settings to setting
                                set[setting] = pandora.user.ui.lists[list][listSetting];
                            }
                        });
                    }
                } else if (Object.keys(listSettings).indexOf(key) > -1) {
                    // copy setting to list setting
                    set['lists.' + that.encode(pandora.user.ui.list) + '.' + listSettings[key]] = val;
                } else if (
                    key == 'itemView'
                    && ['video', 'timeline'].indexOf(val) > -1
                    && !pandora.user.ui.videoPoints[pandora.user.ui.item]
                ) {
                    // add default videoPoints
                    set['videoPoints.' + pandora.user.ui.item] = {'in': 0, out: 0, position: 0};
                }
            }
        });
        Ox.forEach(trigger, function(val, key) {
            Ox.Event.trigger(key, val);
        });
        // fixme: swap later, once the backend accepts dots
        // Ox.len(set) && pandora.api.setUI(set);
        if (Ox.len(set)) {
            var set_ = {};
            Ox.forEach(set, function(val, key) {
                set_[key.replace(/\./g, '|')] = val;
            });
            pandora.api.setUI(set_);
        }
    };

    return that;

}());

