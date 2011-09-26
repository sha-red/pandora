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
            set = {};
        self.previousUI = Ox.clone(pandora.user.ui, true);
        Ox.forEach(obj, function(val, key) {
            var listSettings = pandora.site.listSettings
            if (key == 'list') {
                if (!pandora.user.ui.lists[val]) {
                    obj['lists.' + that.encode(val)] = {};
                }
                Ox.forEach(listSettings, function(listSetting, setting) {
                    if (!pandora.user.ui.lists[val]) {
                        // add default list settings and copy to settings
                        obj['lists.' + that.encode(val)][listSetting] = pandora.site.user.ui[setting];
                        obj[setting] = pandora.site.user.ui[setting];
                    } else {
                        // copy list settings to setting
                        obj[setting] = pandora.user.ui.lists[val][listSetting];
                    }
                });
                Ox.forEach()
            } else if (Object.keys(listSettings).indexOf(key) > -1) {
                // add list setting
                obj['lists.' + that.encode(pandora.user.ui.list) + '.' + listSettings[key]] = val;
            } else if (
                key == 'itemView'
                && ['video', 'timeline'].indexOf(val) > -1
                && !pandora.user.ui.videoPoints[pandora.user.ui.item]
            ) {
                // add default videoPoints
                obj['videoPoints.' + pandora.user.ui.item] = {'in': 0, out: 0, position: 0};
            }
        });
        Ox.forEach(obj, function(val, key) {
            var i = 0,
                keys = key.split('.'),
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
                    // don't send private keys
                    // set[key] = val;
                    // fixme: remove later
                    set[key.replace(/\./g, '|')] = val;
                }
            }
        });
        if (Ox.len(set)) {
            Ox.forEach(set, function(val, key) {
                Ox.Event.trigger(key, val);
            });
            pandora.api.setUI(set);
        }
    };
    return that;
}());

