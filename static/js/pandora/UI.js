// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.UI = (function() {
    // fixme: why do we use '|', and not '.', as a separator?
    return {
        // sets pandora.user.ui.key to val
        // key foo|bar|baz sets pandora.user.ui.foo.bar.baz
        // val null removes a key
        set: function(/*{key: val} or key, val*/) {
            var obj = Ox.makeObject(arguments);
            Ox.forEach(obj, function(val, key) {
                Ox.print('key', key, 'val', val);
                var i = 0,
                    keys = key.split('|'),
                    ui = pandora.user.ui;
                while (i < keys.length - 1) {
                    ui = ui[keys[i]];
                    i++;
                }
                if (ui[keys[i]] !== val) {
                    if (val === null) {
                        delete ui[keys[i]]
                    } else {
                        ui[keys[i]] = val;
                    }
                } else {
                    delete obj[key];
                }
            });
            Ox.len(obj) && pandora.api.setUI(obj);
        }
    }
}());

