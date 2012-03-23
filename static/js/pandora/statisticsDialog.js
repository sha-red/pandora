// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.statisticsDialog = function() {

    var colors = {
            firstseen: [64, 192, 64],
            lastseen: [64, 64, 192],
            continent: [64, 192, 64],
            region: [64, 192, 192],
            country: [64, 64, 192],
            city: [192, 64, 64],
            system: [64, 192, 64],
            browser: [64, 64, 192],
            systemandbrowser: [64, 192, 192]
        },
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        names = {
            system: [
                'Android', 'iOS', 'Linux', 'Mac OS X', 'Windows'
            ],
            browser: [
                'Chrome Frame', 'Chrome', 'Firefox',
                'Internet Explorer', 'Opera', 'Safari'
            ]
        },
        tabs = [
            {id: 'seen', title: 'First Seen and Last Seen', selected: true},
            {id: 'locations', title: 'Locations'},
            {id: 'systems', title: 'Operating Systems and Browsers'}
        ],

        $dialog = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent({
                    click: function() {
                        $dialog.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.Element(),
            height: dialogHeight,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            removeOnClose: true,
            title: 'Statistics',
            width: dialogWidth
        });

    //Ox.getJSON('/static/json/deleteme.json', function(result) {
    pandora.api.findUsers({
        keys: ['browser', 'firstseen', 'lastseen', 'level', 'location', 'system'],
        range: [0, 1000000],
        sort: [{key: 'username', operator: '+'}]
    }, function(result) {

        var chartWidth = dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE,
            data = {},
            flagCountry = {},
            $guestsCheckbox,
            $tabPanel;

        ['all', 'registered'].forEach(function(mode) {

            data[mode] = {
                year: {},
                month: {},
                continent: {},
                region: {},
                country: {},
                city: {},
                system: {},
                browser: {},
                systemandbrowser: {},
                systemversion: {},
                browserversion: {},
                systemandbrowserversion: {}
            };

            result.data.items.forEach(function(item) {
                var city, continent, country, name = {}, region, split;
                if (mode == 'all' || item.level != 'guest') {
                    ['firstseen', 'lastseen'].forEach(function(key, i) {
                        var year = item[key].substr(0, 4) + '-' + key,
                            month = item[key].substr(0, 7) + '-' + key;
                        data[mode].year[year] = (data[mode].year[year] || 0) + 1;                
                        data[mode].month[month] = (data[mode].month[month] || 0) + 1;                
                    });
                    if (item.location) {
                        split = item.location.split(', ')
                        if (split.length == 1) {
                            country = item.location;
                        } else {
                            country = split[1];
                            city = [split[1], split[0]].join(', ');
                            data[mode].city[city] = (data[mode].city[city] || 0) + 1;
                        }
                        data[mode].country[country] = (data[mode].country[country] || 0) + 1;
                        region = Ox.getCountryByName(country).region;
                        data[mode].region[region] = (data[mode].region[region] || 0) + 1;
                        continent = Ox.getCountryByName(country).continent;
                        data[mode].continent[continent] = (data[mode].continent[continent] || 0) + 1;
                    }
                    ['system', 'browser'].forEach(function(key) {
                        var version = item[key];
                        if (version) {
                            name[key] = '';
                            Ox.forEach(names[key], function(v) {
                                if (new RegExp('^' + v).test(version)) {
                                    name[key] = v;
                                    return false;
                                }
                            });
                            if (name[key]) {
                                data[mode][key][name[key]] = (data[mode][key][name[key]] || 0) + 1; 
                                key = key + 'version';
                                data[mode][key][version] = (data[mode][key][version] || 0) + 1;
                            }/* else {
                                Ox.print("^^^^^^", version)
                            }*/
                        }
                    });
                    if (name.system && name.browser) {
                        name = name.system + ' / ' + name.browser;
                        data[mode].systemandbrowser[name] = (data[mode].systemandbrowser[name] || 0) + 1;
                    }
                }
            });

            var keys, firstKey, lastKey;
            keys = Object.keys(data[mode].month).map(function(key) {
                return key.substr(0, 7)
            }).sort();
            firstKey = keys[0].split('-').map(function(str) {
                return parseInt(str, 10);
            });
            lastKey = keys[keys.length - 1].split('-').map(function(str) {
                return parseInt(str, 10);
            });
            Ox.loop(firstKey[0], lastKey[0] + 1, function(year) {
                ['firstseen', 'lastseen'].forEach(function(key) {
                    var key = [year, key].join('-');
                    data[mode].year[key] = data[mode].year[key] || 0;
                });
                Ox.loop(
                    year == firstKey[0] ? firstKey[1] : 1,
                    year == lastKey[0] ? lastKey[1] + 1 : 13,
                    function(month) {
                        ['firstseen', 'lastseen'].forEach(function(key) {
                            var key = [year, Ox.pad(month, 2), key].join('-');
                            data[mode].month[key] = data[mode].month[key] || 0;
                        });
                    }
                );
            });

            flagCountry[mode] = {};
            ['continent', 'region'].forEach(function(key) {
                flagCountry[mode][key] = {};
                Ox.forEach(data[mode][key], function(regionValue, regionKey) {
                    var max = 0;
                    Ox.forEach(data[mode].country, function(countryValue, countryKey) {
                        if (
                            Ox.getCountryByGeoname(countryKey)[key] == regionKey
                            && countryValue > max
                        ) {
                            flagCountry[mode][key][regionKey] = countryKey;
                            max = countryValue;
                        }
                    });
                });
            });

        });

        data.all.city['Other, Other'] = 0;
        Ox.forEach(data.all.city, function(value, key) {
            if (value < 2) {
                data.all.city['Other, Other']++;
                delete data.all.city[key];
            }
        });

        $guestsCheckbox = Ox.Checkbox({
                title: 'Include Guests',
                value: false
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                change: function() {
                    $tabPanel.$element.replaceElement(1,
                        $tabPanel.options('content')($tabPanel.selected())
                    );
                }
            });

        $tabPanel = Ox.TabPanel({
            content: function(id) {
                var mode = $guestsCheckbox.options('value') ? 'all' : 'registered',
                    top = 16,
                    $content = Ox.Element()
                        .css({
                            padding: '16px',
                            overflowY: 'auto',
                            background: Ox.Theme() == 'classic'
                                ? 'rgb(240, 240, 240)'
                                : 'rgb(16, 16, 16)' 
                        });
                if (id == 'seen') {
                    ['year', 'month'].forEach(function(key) {
                        Ox.Chart({
                                color: function(key) {
                                    return colors[key.split('-').pop()];
                                },
                                data: data[mode][key],
                                formatKey: function(value) {
                                    var split = value.split('-');
                                    return (split.pop() == 'firstseen' ? 'First' : 'Last') + ': '
                                        + (key == 'year' ? '' : Ox.MONTHS[parseInt(split[1], 10) - 1])
                                        + ' ' + split[0];
                                },
                                keyAlign: 'right',
                                keyWidth: 128,
                                rows: 2,
                                sort: {key: 'key', operator: '-'},
                                title: key == 'year' ? 'Years' : 'Months',
                                width: chartWidth
                            })
                            .css({
                                position: 'absolute',
                                left: '16px',
                                top: top + 'px'
                            })
                            .appendTo($content);
                        top += Ox.len(data[mode][key]) * 16 + 32;
                    });
                } else if (id == 'locations') {
                    ['continent', 'region', 'country', 'city'].forEach(function(key) {
                        Ox.Chart({
                                color: colors[key],
                                data: data[mode][key],
                                formatKey: function(value) {
                                    var city, country, split;
                                    if (key == 'city' || key == 'country') {
                                        split = value.split(', ');
                                        city = split.length == 2 ? split[1] : ''
                                        country = split[0];
                                    } else {
                                        country = flagCountry[mode][key][value];
                                    }
                                    return $('<div>')
                                        .append(
                                            $('<div>')
                                                .css({
                                                    float: 'left',
                                                    width: '104px',
                                                    height: '14px',
                                                    marginLeft: '-4px',
                                                    marginRight: '4px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                })
                                                .html(
                                                    key == 'city' ? city
                                                    : key == 'country' ? country
                                                    : value.replace('ern A', ' A')
                                                )
                                        )
                                        .append(
                                            $('<img>')
                                                .attr({
                                                    src: Ox.getFlagByGeoname(country, 16)
                                                })
                                                .css({
                                                    float: 'left',
                                                    width: '14px',
                                                    height: '14px',
                                                    borderRadius: '4px',
                                                    margin: '0 1px 0 1px'
                                                })
                                        );
                                },
                                keyAlign: 'right',
                                keyWidth: 128,
                                sort: {key: 'value', operator: '-'},
                                title: Ox.endsWith(key, 'y')
                                    ? Ox.sub(Ox.toTitleCase(key), 0, -1) + 'ies'
                                    : Ox.toTitleCase(key) + 's',
                                width: chartWidth
                            })
                            .css({
                                position: 'absolute',
                                left: '16px',
                                top: top + 'px'
                            })
                            .appendTo($content);
                        top += Ox.len(data[mode][key]) * 16 + 32;
                    });
                } else if (id == 'systems') {
                    ['', 'version'].forEach(function(version, i) {
                        ['system', 'browser'].forEach(function(key) {
                            Ox.Chart({
                                    color: colors[key],
                                    data: data[mode][key + version],
                                    formatKey: function(value) {
                                        var index,
                                            name = value,
                                            $element = $('<div>');
                                        if (version) {
                                            Ox.forEach(names[key], function(v) {
                                                if (new RegExp('^' + v).test(value)) {
                                                    name = v;
                                                    return false;
                                                }
                                            });
                                            /*
                                            text = value.substr(name.length + 1);
                                            index = text.indexOf('(')
                                            if (index > -1) {
                                                text = Ox.sub(text, index + 1, -1);
                                            }
                                            */
                                        }
                                        $element.append(
                                            $('<div>')
                                                .css({
                                                    float: 'left',
                                                    width: '168px',
                                                    height: '14px',
                                                    marginLeft: '-4px',
                                                    marginRight: '4px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                })
                                                .html(value.replace('(Windows ', '('))
                                        ).append(
                                            $('<img>')
                                                .attr({
                                                    src: Ox.UI.PATH + 'png/' + key
                                                        + name.replace(/ /g, '') + '128.png'
                                                })
                                                .css({
                                                    float: 'left',
                                                    width: '14px',
                                                    height: '14px',
                                                    margin: '0 1px 0 1px'
                                                })
                                        );
                                        return $element;
                                    },
                                    keyWidth: 192,
                                    sort: version == ''
                                        ? {key: 'value', operator: '-'}
                                        : {key: 'key', operator: '+'},
                                    title: key == 'system'
                                        ? (version == '' ? 'Operating Systems' : 'Operating System Versions')
                                        : (version == '' ? 'Browsers' : 'Browser Versions'),
                                    width: chartWidth
                                })
                                .css({
                                    position: 'absolute',
                                    left: '16px',
                                    top: top + 'px'
                                })
                                .appendTo($content);
                            top += Ox.len(data[mode][key + version]) * 16 + 32;
                        });
                        if (i == 0) {
                            Ox.Chart({
                                color: [64, 192, 192],
                                data: data[mode].systemandbrowser,
                                formatKey: function(value) {
                                    var $element = $('<div>')
                                        .append(
                                            $('<div>')
                                                .css({
                                                    float: 'left',
                                                    width: '152px',
                                                    height: '14px',
                                                    marginLeft: '-4px',
                                                    marginRight: '4px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                })
                                                .html(value)
                                        );
                                    value.split(' / ').forEach(function(value, i) {
                                        $element.append(
                                            $('<img>')
                                                .attr({
                                                    src: Ox.UI.PATH + 'png/'
                                                        + (i == 0 ? 'system' : 'browser')
                                                        + value.replace(/ /g, '') + '128.png'
                                                })
                                                .css({
                                                    width: '14px',
                                                    height: '14px',
                                                    margin: '0 1px 0 1px'
                                                })
                                        );
                                    });
                                    return $element;
                                },
                                keyWidth: 192,
                                sort: {key: 'value', operator: '-'},
                                title: 'Operating Systems and Browsers',
                                width: chartWidth
                            })
                            .css({
                                position: 'absolute',
                                left: '16px',
                                top: top + 'px'
                            })
                            .appendTo($content);
                            top += Ox.len(data[mode].systemandbrowser) * 16 + 32;
                        }
                    });
                }
                $('<div>')
                    .css({
                        position: 'absolute',
                        top: top - 16 + 'px',
                        width: '1px',
                        height: '16px'
                    })
                    .appendTo($content);
                return $content;
            },
            tabs: tabs
        });

        $tabPanel.$element.find('.OxButtonGroup').css({width: '512px'});
        $guestsCheckbox.appendTo($tabPanel.children('.OxBar'));

        $dialog.options({content: $tabPanel});

    });

    return $dialog;

};