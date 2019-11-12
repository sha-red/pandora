'use strict';


pandora.cleanupDate = function(value) {
    if (/\d{2}-\d{2}-\d{4}/.test(value)) {
        value = Ox.reverse(value.split('-')).join('-')
    }
    if (/\d{4}i\/\d{2}\/\d{d}/.test(value)) {
        value = value.split('/').join('-')
    }
    if (/\d{2}\/\d{2}\/\d{4}/.test(value)) {
        value = Ox.reverse(value.split('/')).join('-')
    }
    return value
};

