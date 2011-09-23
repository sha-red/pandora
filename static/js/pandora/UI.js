// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.UI = (function() {
    // fixme: "|" as separator doesn't buy us much, use "."
    var self = {}, that = {};
    self.previousUI = {};
    // sets pandora.user.ui.key to val
    // key foo|bar|baz sets pandora.user.ui.foo.bar.baz
    // (we have to use '|' as a separator since list names may contain '.')
    // val null removes a key
    that.getPrevious = function(key) {
        return !key ? self.previousUI : self.previousUI[key];
    };
    that.set = function(/*{key: val} or key, val*/) {
        var obj = Ox.makeObject(arguments),
            set = {};
        self.previousUI = Ox.clone(pandora.user.ui, true);
        Ox.forEach(obj, function(val, key) {
            var listSettings = pandora.site.listSettings
            if (key == 'list' && !pandora.user.ui.lists[val]) {
                // add default list settings
                obj['lists|' + val] = {};
                Ox.forEach(listSettings, function(listSetting, setting) {
                    obj['lists|' + val][listSetting] = pandora.site.user.ui[setting];
                });
            } else if (Object.keys(listSettings).indexOf(key) > -1) {
                // add list setting
                obj['lists|' + pandora.user.ui.list + '|' + listSettings[key]] = val;
            } else if (
                key == 'itemView'
                && ['video', 'timeline'].indexOf(val) > -1
                && !pandora.user.ui.videoPoints[pandora.user.ui.item]
            ) {
                // add default videoPoints
                obj['videoPoints|' + pandora.user.ui.item] = {'in': 0, out: 0, position: 0};
            }
        });
        Ox.forEach(obj, function(val, key) {
            var i = 0,
                keys = key.split('|'),
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
                set[key] = val;
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

