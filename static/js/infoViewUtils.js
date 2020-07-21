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

pandora.renderRightsLevel = function(that, $rightsLevel, data, isMixed, isMultiple, canEdit) {
    var rightsLevels = pandora.site.rightsLevels.map(function(rightsLevel) {
                return rightsLevel.name;
            }).concat(isMultiple ? ['Mixed'] : []),
        rightsLevel = isMixed.rightslevel ? rightsLevels.length - 1 : data.rightslevel,
        $capabilities,
        $rightsLevelElement = getRightsLevelElement(rightsLevel),
        $rightsLevelSelect;
    $rightsLevel.empty();
    if (canEdit) {
        $rightsLevelSelect = Ox.Select({
                items: pandora.site.rightsLevels.map(function(rightsLevel, i) {
                    return {id: i, title: Ox._(rightsLevel.name)};
                }).concat(isMultiple ? [
                    {id: rightsLevels.length - 1, title: Ox._('Mixed'), disabled: true}
                ] : []),
                width: 128,
                value: rightsLevel
            })
            .addClass('OxColor OxColorGradient')
            .css({
                marginBottom: '4px',
                background: $rightsLevelElement.css('background')
            })
            .data({OxColor: $rightsLevelElement.data('OxColor')})
            .bindEvent({
                change: function(event) {
                    var rightsLevel = event.value;
                    $rightsLevelElement = getRightsLevelElement(rightsLevel);
                    $rightsLevelSelect
                        .css({background: $rightsLevelElement.css('background')})
                        .data({OxColor: $rightsLevelElement.data('OxColor')})
                    if (rightsLevel < pandora.site.rightsLevels.length) {
                        renderCapabilities(rightsLevel);
                        var edit = {
                            id: isMultiple ? ui.listSelection : data.id,
                            rightslevel: rightsLevel
                        };
                        pandora.api.edit(edit, function(result) {
                            that.triggerEvent('change', Ox.extend({}, 'rightslevel', rightsLevel));
                        });
                    }
                }
            })
            .appendTo($rightsLevel);
    } else {
        $rightsLevelElement
            .css({
                marginBottom: '4px'
            })
            .appendTo($rightsLevel);
    }
    $capabilities = $('<div>').appendTo($rightsLevel);
    !isMixed.rightslevel && renderCapabilities(data.rightslevel);


    function getRightsLevelElement(rightsLevel) {
        return Ox.Theme.formatColorLevel(rightsLevel, rightsLevels)
    }

    function renderCapabilities(rightsLevel) {
        var capabilities = [].concat(
                canEdit ? [{name: 'canSeeItem', symbol: 'Find'}] : [],
                [
                    {name: 'canPlayClips', symbol: 'PlayInToOut'},
                    {name: 'canPlayVideo', symbol: 'Play'},
                    {name: 'canDownloadVideo', symbol: 'Download'}
                ]
            ),
            userLevels = canEdit ? pandora.site.userLevels : [pandora.user.level];
        $capabilities.empty();
        userLevels.forEach(function(userLevel, i) {
            var $element,
                $line = $('<div>')
                    .css({
                        height: '16px',
                        marginBottom: '4px'
                    })
                    .appendTo($capabilities);
            if (canEdit) {
                $element = Ox.Theme.formatColorLevel(i, userLevels.map(function(userLevel) {
                    return Ox.toTitleCase(userLevel);
                }), [0, 240]);
                Ox.Label({
                        textAlign: 'center',
                        title: Ox._(Ox.toTitleCase(userLevel)),
                        width: 60
                    })
                    .addClass('OxColor OxColorGradient')
                    .css({
                        float: 'left',
                        height: '12px',
                        paddingTop: '2px',
                        background: $element.css('background'),
                        fontSize: '8px',
                        color: $element.css('color')
                    })
                    .data({OxColor: $element.data('OxColor')})
                    .appendTo($line);
            }
            capabilities.forEach(function(capability) {
                var hasCapability = pandora.hasCapability(capability.name, userLevel) >= rightsLevel,
                    $element = Ox.Theme.formatColorLevel(hasCapability, ['', '']);
                Ox.Button({
                        tooltip: Ox._('{0} '
                            + (hasCapability ? 'can' : 'can\'t') + ' '
                            + Ox.toSlashes(capability.name)
                                .split('/').slice(1).join(' ')
                                .toLowerCase()
                                .replace('see item', 'see the item')
                                .replace('play video', 'play the full video')
                                .replace('download video', 'download the video'),
                            [canEdit ? Ox._(Ox.toTitleCase(userLevel)) : Ox._('You')]),
                        title: capability.symbol,
                        type: 'image'
                    })
                    .addClass('OxColor OxColorGradient')
                    .css({background: $element.css('background')})
                    .css('margin' + (canEdit ? 'Left' : 'Right'), '4px')
                    .data({OxColor: $element.data('OxColor')})
                    .appendTo($line);
            });
            if (!canEdit) {
                Ox.Button({
                    title: Ox._('Help'),
                    tooltip: Ox._('About Rights'),
                    type: 'image'
                })
                .css({marginLeft: '52px'})
                .bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'rights'});
                    }
                })
                .appendTo($line);
            }
        });
    }

}

