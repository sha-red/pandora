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
                top: '40px',
                right: 0,
                bottom: 0,
                width: '320px',
                margin: '0 auto 0 auto',
                MozTransform: 'scaleY(-1)',
                OTransform: 'scaleY(-1)',
                WebkitTransform: 'scaleY(-1)'
            })
            .appendTo($box),

        $reflectionGradient = $('<div>')
            .addClass('OxReflection')
            .css({
                position: 'absolute',
                left: 0,
                top: '40px',
                right: 0,
                width: '320px',
                height: '40px',
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
                margin: '0 auto 0 auto',
                cursor: 'pointer'
            })
            .bindEvent({
                anyclick: function() {
                    $browseButton.triggerEvent('click');
                }
            })
            .appendTo($box),

        $line = Ox.Element('<img>')
            .css({
                position: 'absolute',
                left: 0,
                top: '62px',
                right: 0,
                width: '160px',
                height: '20px',
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .one({
                load: function() {
                    $line.animate({opacity: 1}, 250, function() {
                        $line
                            .options({
                                tooltip: function() {
                                    return Ox._('Visit {0}', ['Pad.ma']);
                                }
                            })
                            .bindEvent({
                                anyclick: function() {
                                    window.open('/url=https://pad.ma', '_blank');
                                }
                            });
                    });
                }
            })
            .attr({src: '/static/png/line.indiancinema.png'})
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

        $signupButton = Ox.Button({
                title: Ox._('Sign Up'),
                width: 122
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '144px',
                right: '390px',
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
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
                position: 'absolute',
                left: 0,
                top: '144px',
                right: '130px',
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
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
                position: 'absolute',
                left: 0,
                top: '144px',
                right: '260px',
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
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
                position: 'absolute',
                left: '260px',
                top: '144px',
                right: 0,
                bottom: 0,
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.UI.set({page: 'about'});
                    that.fadeOutScreen();
                }
            })
            .appendTo($box),

        $features = $('<div>')
            .attr({id: 'features'})
            .css({
                position: 'absolute',
                left: 0,
                top: '184px',
                right: 0,
                bottom: 0,
                width: '560px',
                margin: '0 auto 0 auto',
                opacity: 0
            })
            .appendTo($box);

    if (pandora.user.level == 'guest') {
        $signupButton.appendTo($box);
        $signinButton.appendTo($box);
    } else {
        $preferencesButton.appendTo($box);
    }

    function showFeatures() {
        var $space,
            featured = {},
            find = {
                query: {
                    conditions: [{key: 'status', value: 'featured', operator: '=='}],
                    operator: '&'
                },
                keys: ['description', 'modified', 'name', 'user'],
                sort: [{key: 'position', operator: '+'}]
            },
            items, lists, edits, texts;
        pandora.api.getHomeItems({active: true}, function(result) {
            items = result.data.items;
            lists = 1;
            edits = 1;
            texts = 1;
            show();
        });
        function show() {
            var counter = 0, max = 8, mouse = false, position = 0, selected = 0,
                color = Ox.Theme() == 'oxlight' ? 'rgb(0, 0, 0)'
                    : Ox.Theme() == 'oxmedium' ? 'rgb(0, 0, 0)'
                    : 'rgb(255, 255, 255)',
                $label, $texts,
                $featuresBox, $featuresContainer, $featuresContent,
                $featureBox = [], $featureIcon = [],
                $previousButton, $nextButton;
            if (items.length) {
                $features.empty();
                $texts = Ox.Element().appendTo($features);
                var top = 24;
                items.forEach(function(item) {
                    var $text, $icon;
                    $icon = Ox.Element({
                            element: '<img>',
                            tooltip: getTooltip(item)
                        })
                        .attr({
                            src: item.image
                        })
                        .css({
                            left: 0,
                            right: '390px',
                            width: '122px',
                            height: '122px',
                            borderRadius: '32px',
                            marginRight: '8px',
                            cursor: 'pointer',
                            float: 'left'
                        })
                        .bindEvent({
                            anyclick: function() {
                                openItem(item);
                            }
                        });
                    $text = Ox.Label({
                            //width: 386 + 122
                        })
                        .addClass('OxSelectable')
                        .css({
                            //position: 'absolute',
                            left: '24px',
                            //top: top + 'px',
                            right: 0,
                            height: 'auto',
                            padding: '8px 8px 8px 8px',
                            borderRadius: '32px',
                            marginBottom: '16px',
                            overflowY: 'auto',
                            lineHeight: '14px',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'normal'
                        })
                        .append($icon)
                        .append(
                            Ox.Element().css({
                                //padding: '8px',
                            }).html(getHTML(item))

                        )
                        .appendTo($texts);
                    pandora.createLinks($text);
                    top += 130;
                });
                $features.animate({opacity: 1}, 250);
            }

            function getHTML(item) {
                return '<b>' + Ox.encodeHTMLEntities(item.title) + '</b><br><br>' + item.text;
            }

            function getTooltip(item) {
                return Ox._('View {0}', [Ox._(Ox.toTitleCase(item.title))])
            }

            function openItem(item) {
                that.fadeOutScreen();
                if (item.type == 'custom') {
                    pandora.URL.push(item.link);
                } else {
                    pandora.UI.set(Ox.extend({

                        section: item.type == 'list' ? 'items' : item.type + 's',
                        page: ''
                    }, item.type == 'list' ? {
                        find: {
                            conditions: [{
                                key: 'list',
                                value: item.contentid,
                                operator: '=='
                            }],
                            operator: '&'
                        }
                    } : item.type == 'collection' ? {
                        findDocuments: {
                            conditions: [{
                                key: 'collection',
                                value: item.contentid,
                                operator: '=='
                            }],
                            operator: '&'
                        }
                    } : item.type == 'edit' ? {
                        edit: item.contentid
                    } : {
                    }));
                }
            }

            function scrollToPosition(i, animate) {
                if (i >= 0 && i <= items.length - max && i != position) {
                    position = i;
                    $featuresContent.stop().animate({
                        left: (position * -65) + 'px'
                    }, animate ? 250 : 0, function() {
                        if (position == 0) {
                            $previousButton.removeClass('visible').stop().animate({
                                opacity: 0
                            }, 250, function() {
                                $previousButton.hide();
                            });
                        } else {
                            $previousButton.addClass('visible');
                        }
                        if (position == items.length - max) {
                            $nextButton.removeClass('visible').stop().animate({
                                opacity: 0
                            }, 250, function() {
                                $nextButton.hide();
                            });
                        } else {
                            $nextButton.addClass('visible');
                        }
                        if (mouse) {
                            $featuresBox.trigger('mouseenter');
                        }
                    });
                }
            }
        }
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
        $box.css({top: window.innerHeight / 2 - 40 + 'px'});
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
