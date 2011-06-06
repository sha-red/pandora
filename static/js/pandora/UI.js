// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.UI = (function() {
    return {
        set: function(obj) {
            if (arguments.length == 2) {
                // translate (key, value) to {key: value}
                var obj_ = {};
                obj_[arguments[0]] = arguments[1];
                obj = obj_;
            }
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
            //alert('set ' + JSON.stringify(obj))
        }
    }
}());

