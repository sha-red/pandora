// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.UI = (function() {
    return {
        set: function(/*{key: val} or key, val*/) {
            var obj = Ox.makeObject(arguments);
            $.each(obj, function(key, val) {
                Ox.print('key', key, 'val', val);
                var i = 0,
                    keys = key.split('|'),
                    old = pandora.user.ui;
                while (i < keys.length - 1) {
                    old = old[keys[i]];
                    i++;
                }
                if (old[keys[i]] !== val) {
                    old[keys[i]] = val;
                } else {
                    delete obj[key];
                }
            });
            Ox.len(obj) && pandora.api.setUI(obj);
        }
    }
}());

