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
                top: '80px',
                right: 0,
                width: '320px',
                height: '160px',
                margin: '0 auto 0 auto',
            })
            .appendTo($box),
        $logo = Ox.Element({
                element: '<img>',
                tooltip: 'Enter ' + pandora.site.site.name
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
            .on({
                click: function() {
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
            .click(function(e) {
                // fixme: why?
                e.stopPropagation();
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
                title: 'Find',
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
                    pandora.$ui.findSelect.value('*');
                    pandora.$ui.findInput.value(value);
                    that.fadeOutScreen();
                    pandora.UI.set({
                        page: '',
                        find: {
                            conditions: value === ''
                                ? []
                                : [{key: '*', value: value, operator: '='}],
                            operator: '&'
                        }
                    });
                }
            })
            .appendTo($box),
        $browseButton = Ox.Button({
                title: 'Browse',
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
                        page: pandora.user.ui.page == 'home' ? '' : pandora.user.ui.page
                    });
                    that.fadeOutScreen();
                }
            })
            .appendTo($box),
        $signupButton = Ox.Button({
                title: 'Sign Up',
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
                title: 'Sign In',
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
                title: 'Preferences',
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
                title: 'About ' + pandora.site.site.name,
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
        $lists = $('<div>')
            .attr({id: 'lists'})
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

    function showLists() {
        pandora.api.findLists({
            query: {
                conditions: [{key: 'status', value: 'featured', operator: '=='}],
                operator: '&'
            },
            keys: ['user', 'name', 'description'],
            sort: [{key: 'position', operator: '+'}]
        }, function(result) {
            var lists = result.data.items,
                counter = 0, items = 8, mouse = false, position = 0, selected = 0,
                color = Ox.Theme() == 'oxlight' ? 'rgb(32, 32, 32)'
                    : Ox.Theme() == 'oxmedium' ? 'rgb(144, 144, 144)'
                    : 'rgb(224, 224, 224)',
                $label, $icon, $text,
                $listsBox, $listsContainer, $listsContent,
                $listBox = [], $listIcon = [],
                $previousButton, $nextButton,
                $space;
            $lists.empty();
            if (lists.length) {
                $label = Ox.Label({
                        textAlign: 'center',
                        title: '<b>Featured List' + (lists.length > 1 ? 's' : '') + '</b>',
                        width: 512
                    })
                    .css({
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        margin: '0 auto 0 auto'
                    })
                    .appendTo($lists);
                $text = Ox.Label({
                        width: 386
                    })
                    .addClass('OxSelectable')
                    .css({
                        position: 'absolute',
                        left: '24px',
                        top: '24px',
                        right: 0,
                        height: '104px',
                        borderTopLeftRadius: '32px',
                        borderBottomLeftRadius: '32px',
                        padding: '8px 8px 8px 130px',
                        overflowY: 'auto',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal'
                    })
                    .html(
                        '<b>' + Ox.encodeHTMLEntities(lists[selected].name) + '</b><br><br>'
                        + lists[selected].description
                    )
                    .appendTo($lists);
                pandora.createLinks($text);
                $icon = Ox.Element({
                        element: '<img>',
                        tooltip: 'View List'
                    })
                    .attr({
                        src: '/list/' + lists[selected].user + ':'
                            + lists[selected].name + '/icon256.jpg'
                    })
                    .css({
                        position: 'absolute',
                        left: 0,
                        top: '24px',
                        right: '390px',
                        width: '122px',
                        height: '122px',
                        borderRadius: '32px',
                        margin: '0 auto 0 auto',
                        cursor: 'pointer'
                    })
                    .bindEvent({
                        anyclick: function() {
                            openList(selected);
                        }
                    })
                    .appendTo($lists);
                if (lists.length > 1) {
                    $listsBox = $('<div>')
                        .css({
                            position: 'absolute',
                            left: 0,
                            top: '150px',
                            right: 0,
                            height: '65px', // 4+57+4
                            width: '560px', // 16+8+512+8+16
                            margin: '0 auto 0 auto'
                        })
                        .appendTo($lists);
                    $listsContainer = $('<div>')
                        .css({
                            position: 'absolute',
                            left: '20px',
                            right: '20px',
                            height: '65px',
                            width: '520px',
                            overflow: 'hidden'
                        })
                        .appendTo($listsBox);
                    $listsContent = $('<div>')
                        .css({
                            position: 'absolute',
                            width: lists.length * 65 + 'px',
                            height: '65px',
                            marginLeft: lists.length < items
                                ? (items - lists.length) * 65 / 2 + 'px'
                                : 0
                        })
                        .appendTo($listsContainer);
                    if (lists.length > items) {
                        $previousButton = Ox.Button({
                                title: 'left',
                                type: 'image'
                            })
                            .addClass(position > 0 ? 'visible' : '')
                            .css({
                                position: 'absolute',
                                left: 0,
                                top: '25px',
                                opacity: 0
                            })
                            .hide()
                            .bindEvent({
                                mousedown: function() {
                                    counter = 0;
                                    scrollToPosition(position - 1, true);
                                },
                                mouserepeat: function() {
                                    // fixme: arbitrary
                                    if (counter++ % 5 == 0) {
                                        scrollToPosition(position - 1, false);
                                    }
                                }
                            })
                            .appendTo($listsBox);
                        $nextButton = Ox.Button({
                                title: 'right',
                                type: 'image'
                            })
                            .addClass(position < lists.length - 1 ? 'visible' : '')
                            .css({
                                position: 'absolute',
                                right: 0,
                                top: '25px',
                                opacity: 0
                            })
                            .hide()
                            .bindEvent({
                                mousedown: function() {
                                    counter = 0;
                                    scrollToPosition(position + 1, true);
                                },
                                mouserepeat: function() {
                                    // fixme: arbitrary
                                    if (counter++ % 5 == 0) {
                                        scrollToPosition(position + 1, false);
                                    }
                                }
                            })
                            .appendTo($listsBox);
                        $listsBox.on({
                            mouseenter: function() {
                                mouse = true;
                                $('.visible').show().stop().animate({
                                    opacity: 1
                                }, 250);
                            },
                            mouseleave: function() {
                                mouse = false;
                                $('.visible').stop().animate({
                                    opacity: 0
                                }, 250, function() {
                                    $(this).hide();
                                });
                            },
                            mousewheel: function(e, delta, deltaX, deltaY) {
                                Ox.print('mwd', deltaX);
                                // fixme: arbitrary
                                scrollToPosition(position + Math.round(deltaX * 2), true);
                            }
                        });
                    }
                    self.keydown = function(e) {
                        var focused = Ox.Focus.focused(),
                            key = Ox.KEYS[e.keyCode];
                        if (
                            focused === null
                            || !Ox.UI.elements[focused].hasClass('OxInput')
                        ) {
                            if (key == 'left' && selected > 0) {
                                selectList(selected - 1);
                            } else if (key == 'up' && selected > 0) {
                                selectList(0);
                            } else if (key == 'right' && selected < lists.length - 1) {
                                selectList(selected + 1);
                            } else if (key == 'down' && selected < lists.length - 1) {
                                selectList(lists.length - 1);
                            }
                        }
                    };
                    Ox.$document.on({keydown: self.keydown});
                    lists.forEach(function(list, i) {
                        $listBox[i] = $('<div>')
                            .css({
                                float: 'left',
                                width: '57px',
                                height: '57px',
                                padding: '2px',
                                margin: '2px',
                                borderRadius: '16px',
                                boxShadow: '0 0 2px ' + (i == selected ? color : 'transparent')
                            })
                            .appendTo($listsContent);
                        $listIcon[i] = Ox.Element({
                                element: '<img>',
                                tooltip: Ox.encodeHTMLEntities(list.name)
                            })
                            .attr({
                                src: '/list/' + list.user + ':'
                                    + list.name + '/icon256.jpg'
                            })
                            .css({
                                width: '57px',
                                height: '57px',
                                borderRadius: '16px',
                                cursor: 'pointer'
                            })
                            .bindEvent({
                                doubleclick: function() {
                                    openList(i);
                                },
                                singleclick: function() {
                                    selectList(i);
                                }
                            })
                            .appendTo($listBox[i]);
                    });
                }
                $space = $('<div>')
                    .css({
                        position: 'absolute',
                        top: lists.length == 0 ? '0px'
                            : lists.length == 1 ? '150px'
                            : '215px',
                        width: '560px',
                        height: '80px'
                    })
                    .appendTo($lists);
                $lists.animate({opacity: 1}, 250);
            }
            function openList(i) {
                that.fadeOutScreen();
                pandora.UI.set({
                    page: '',
                    item: '',
                    find: {
                        conditions: [{
                            key: 'list',
                            value: lists[i].user + ':'
                                + lists[i].name,
                            operator: '=='
                        }],
                        operator: '&'
                    }
                });
            }
            function scrollToPosition(i, animate) {
                if (i >= 0 && i <= lists.length - items && i != position) {
                    position = i;
                    $listsContent.stop().animate({
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
                        if (position == lists.length - items) {
                            $nextButton.removeClass('visible').stop().animate({
                                opacity: 0
                            }, 250, function() {
                                $nextButton.hide();
                            });
                        } else {
                            $nextButton.addClass('visible');
                        }
                        if (mouse) {
                            $listsBox.trigger('mouseenter');
                        }
                    });
                }
            }
            function selectList(i) {
                if (i >= 0 && i <= lists.length - 1 && i != selected) {
                    $listBox[selected].css({
                        boxShadow: 'none'
                    });
                    selected = i;
                    $listBox[selected].css({
                        boxShadow: '0 0 2px ' + color
                    });
                    if (selected < position) {
                        scrollToPosition(selected, true);
                    } else if (selected > position + items - 1) {
                        scrollToPosition(selected - items + 1, true);
                    }
                    $icon.attr({
                        src: '/list/' + lists[selected].user + ':'
                            + lists[selected].name + '/icon256.jpg'
                    });
                    $text.html(
                        '<b>' + Ox.encodeHTMLEntities(lists[selected].name) + '</b><br><br>'
                        + lists[selected].description
                    );
                }
            }
        });
        
    }

    that.fadeInScreen = function() {
        // $box.css({marginTop: '80px'});
        that.appendTo(Ox.UI.$body).animate({opacity: 1}, 500, function() {
            that.find('*').animate({opacity: 1}, 250, function() {
                $findInput.focusInput(true);
                showLists();
            });
        });
        return that;
    };

    that.fadeOutScreen = function() {
        $('.OxTooltip').remove();
        that.animate({opacity: 0}, 500, function() {
            that.remove();
        });
        pandora.$ui.tv && pandora.$ui.tv.unmute();
        self.keydown && Ox.$document.off({keydown: self.keydown});
        return that;
    };

    that.showScreen = function(callback) {
        that.css({opacity: 1}).appendTo(Ox.UI.$body);
        // $box.css({marginTop: '80px'});
        that.find('*').css({opacity: 1});
        $findInput.focusInput(true);
        showLists();
        /*
        $box.animate({marginTop: '80px'}, 500);
        setTimeout(function() {
            that.find('*').animate({opacity: 1}, 250, function() {
                $findInput.focusInput(true);
                showLists();
            });
        }, 250);
        */
        callback && callback();
        return that;
    };

    return that;

};
