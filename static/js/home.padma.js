// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.home = function() {

    var self = {},

        that = $('<div>')
            .addClass('OxScreen')
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0,
                overflowY: 'auto',
                zIndex: 1001
            }),

        $box = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: '80px',
                right: 0,
                width: '560px',
                margin: '0 auto 0 auto'
            })
            .appendTo(that),

        $reflectionImage = $('<img>')
            .attr({src: '/static/png/logo.png'})
            .css({
                position: 'absolute',
                left: 0,
                top: '80px',
                right: 0,
                bottom: 0,
                width: '320px',
                height: 'auto',
                margin: '0 auto 0 auto',
                MozTransform: 'scaleY(-1)',
                MsTransform: 'scaleY(-1)',
                OTransform: 'scaleY(-1)',
                WebkitTransform: 'scaleY(-1)'
            })
            .appendTo($box),

        $reflectionGradient = $('<div>')
            .addClass('OxReflection')
            .css({
                position: 'absolute',
                left: 0,
                top: '80px',
                right: 0,
                width: '320px',
                height: '160px',
                margin: '0 auto 0 auto',
            })
            .appendTo($box),

        $logo = Ox.Element({
                element: '<img>',
                tooltip: function() {
                    return Ox._('Enter {0}', [pandora.site.site.name]);
                }
            })
            .attr({
                id: 'logo',
                src: '/static/png/logo.png'
            })
            .css({
                position: 'absolute',
                left: 0,
                right: 0,
                width: '320px',
                height: 'auto',
                margin: '0 auto 0 auto',
                cursor: 'pointer'
            })
            .bindEvent({
                anyclick: function() {
                    $browseButton.triggerEvent('click');
                }
            })
            .appendTo($box),

        $findInput = Ox.Input({
                width: 252
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '104px',
                right: '260px',
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .on({
                click: function(e) {
                    // fixme: why?
                    e.stopPropagation();
                }
            })
            .bindEvent({
                submit: function(data) {
                    if (data.value) {
                        $findButton.triggerEvent('click');
                    } else {
                        $browseButton.triggerEvent('click');
                    }
                }
            })
            .appendTo($box),

        $findButton = Ox.Button({
                title: Ox._('Find'),
                width: 122
            })
            .css({
                position: 'absolute',
                left: '130px',
                top: '104px',
                right: 0,
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    var folder = pandora.getListData().folder,
                        value = $findInput.value();
                    folder && pandora.$ui.folderList[folder].options({selected: []});
                    that.fadeOutScreen();
                    pandora.UI.set({
                        page: '',
                        find: {
                            conditions: value === ''
                                ? []
                                : [{key: '*', value: value, operator: '='}],
                            operator: '&'
                        },
                        section: 'items'
                    });
                    pandora.$ui.findSelect && pandora.$ui.findSelect.value('*');
                    pandora.$ui.findInput && pandora.$ui.findInput.value(value);
                }
            })
            .appendTo($box),

        $browseButton = Ox.Button({
                title: Ox._('Browse'),
                width: 122
            })
            .css({
                position: 'absolute',
                left: '390px',
                top: '104px',
                right: 0,
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({
                        page: pandora.user.ui.page == 'home' ? '' : pandora.user.ui.page,
                        section: 'items'
                    });
                    that.fadeOutScreen();
                }
            })
            .appendTo($box),

        $footer = Ox.Element().css({
            clear: 'both',
            height: '64px',
            paddingTop: '12px'
        }),

        $signupButton = Ox.Button({
                title: Ox._('Sign Up'),
                width: 122
            })
            .css({
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'signup'});
                    that.fadeOutScreen();
                }
            }),

        $signinButton = Ox.Button({
                title: Ox._('Sign In'),
                width: 122
            })
            .css({
                marginLeft: '8px',
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page :'signin'});
                    that.fadeOutScreen();
                }
            }),

        $preferencesButton = Ox.Button({
                title: Ox._('Preferences'),
                width: 252
            })
            .css({
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'preferences'});
                    that.fadeOutScreen();
                }
            }),

        $aboutButton = Ox.Button({
                title: Ox._('About {0}', [pandora.site.site.name]),
                width: 252
            })
            .css({
                marginLeft: '8px'
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'about'});
                    that.fadeOutScreen();
                }
            }),

        $features = $('<div>')
            .attr({id: 'lists'})
            .css({
                position: 'absolute',
                left: 0,
                top: '152px',
                right: 0,
                bottom: 0,
                width: '512px',
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .appendTo($box);

    if (pandora.user.level == 'guest') {
        $signupButton.appendTo($footer);
        $signinButton.appendTo($footer);
    } else {
        $preferencesButton.appendTo($footer);
    }
    $aboutButton.appendTo($footer);

    function showFeatures() {
        pandora.api.getHomeItems({active: true}, function(result) {
            var items = result.data.items.filter(pandora.isCompleteHomeItem),
                $texts;
            $features.empty();
            if (items.length) {
                $texts = Ox.Element().appendTo($features);
                items.forEach(function(item) {
                    var $item = pandora.renderHomeItem({
                        data: item
                    }).appendTo($texts);
                });
            } else {
                $features.css({
                    top: '132px'
                });
            }
            $features.append($footer);
            $features.animate({opacity: 1}, 250);
        });
    }

    that.fadeInScreen = function() {
        that.appendTo(Ox.$body).animate({opacity: 1}, 500, function() {
            that.find('*').animate({opacity: 1}, 250, function() {
                $findInput.focusInput(true);
                showFeatures();
            });
        });
        return that;
    };

    that.fadeOutScreen = function() {
        $('.OxTooltip').remove();
        that.animate({opacity: 0}, 500, function() {
            that.remove();
        });
        pandora.$ui.tv && pandora.$ui.tv.unmute().find('.OxControls.OxVolume').hide();
        self.keydown && Ox.$document.off({keydown: self.keydown});
        return that;
    };

    that.showScreen = function(callback) {
        var $elements = that.find('*'), count = 0;
        $box.css({top: window.innerHeight / 2 - 80 + 'px'});
        that.css({opacity: 1}).appendTo(Ox.$body);
        $findInput.focusInput(true);
        $box.animate({top: '80px'}, 500, function() {
            $elements.animate({opacity: 1}, 250, function() {
                if (++count == $elements.length) {
                    showFeatures();
                    callback && callback();
                }
            });
        });
        return that;
    };

    return that;

};
