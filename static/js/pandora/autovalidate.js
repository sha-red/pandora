// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.autovalidateCode = function(value, blur, callback) {
    value = $.map(value.toUpperCase().split(''), function(v) {
        return /[0-9A-Z]/(v) ? v : null;
    }).join('');
    callback(value);
};

pandora.autovalidateEmail = function(value, blur, callback) {
    value = $.map(value.toLowerCase().split(''), function(v, i) {
        return /[0-9a-z\.\+\-_@]/(v) ? v : null;
    }).join('');
    callback(value);
};

pandora.autovalidateListname = function(value, blur, callback) {
    var length = value.length;
    value = $.map(value.split(''), function(v, i) {
        if (new RegExp('[0-9' + Ox.regexp.letters + '\\(\\)' + ((i == 0 || (i == length - 1 && blur)) ? '' : ' \-') + ']', 'i').test(v)) {
            return v;
        } else {
            return null;
        }
    }).join('');
    $.each(['  ', ' -', '- ', '--', '\\(\\(', '\\)\\(', '\\)\\)'], function(i, v) {
        //Ox.print(v, v[0], v[0] == '\\')
        while (value.indexOf(v) > -1) {
            value = value.replace(new RegExp(v, 'g'), v[0] + (v[0] == '\\' ? v[1] : ''));
        }
    })
    callback(value);
};

pandora.autovalidateUsername = function(value, blur, callback) {
    var length = value.length;
    value = $.map(value.toLowerCase().split(''), function(v, i) {
        if (new RegExp('[0-9a-z' + ((i == 0 || (i == length - 1 && blur)) ? '' : '\-_') + ']').test(v)) {
            return v;
        } else {
            return null;
        }
    }).join('');
    $.each(['--', '-_', '_-', '__'], function(i, v) {
        while (value.indexOf(v) > -1) {
            value = value.replace(new RegExp(v, 'g'), v[0]);
        }
    })
    callback(value);
};

pandora.validateUser = function(key, existing) {
    existing = existing || false;
    var string = key == 'username' ? 'username' : 'e-mail address';
    return function(value, callback) {
        var valid = key == 'username' ? !!value.length : Ox.isValidEmail(value);
        valid ? pandora.api.findUser({
            key: key,
            value: value,
            operator: '='
        }, function(result) {
            var valid = existing == !!result.data.users.length;
            //Ox.print(existing, result.data.users)
            callback({
                message: existing ?
                    'Unknown ' + string :
                    string[0].toUpperCase() + string.substr(1) + ' already exists',
                valid: valid
            });
        }) : callback({
            message: (!value.length ? 'Missing' : 'Invalid') + ' ' + string,
            valid: false
        });
    };
};

