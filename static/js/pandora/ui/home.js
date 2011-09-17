// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.home = function() {

    // fixme: if a list was selected previously, it will steal focus from the input element

    var that = $('<div>')
            .attr({id: 'home'})
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'rgb(32, 32, 32)',
                opacity: 0,
                zIndex: 1000
            }),
        $reflectionImage = $('<img>')
            .attr({src: '/static/png/logo256.png'})
            .css({
                position: 'absolute',
                left: 0,
                top: '160px',
                right: 0,
                bottom: 0,
                width: '320px',
                margin: 'auto',
                opacity: 0,
                MozTransform: 'scaleY(-1)',
                WebkitTransform: 'scaleY(-1)'
            })
            .appendTo(that),
        $reflectionGradient = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: '160px',
                right: 0,
                bottom: 0,
                width: '320px',
                height: '160px',
                margin: 'auto',
            })
            .css({
                backgroundImage: '-moz-linear-gradient(top, rgba(32, 32, 32, 0.8), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))'
            })
            .css({
                backgroundImage: '-webkit-linear-gradient(top, rgba(32, 32, 32, 0.8), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))'
            })
            .appendTo(that),
        $logo = $('<img>')
            .attr({
                id: 'logo',
                src: '/static/png/logo256.png'
            })
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: '160px',
                width: window.innerWidth + 'px',
                margin: 'auto',
                cursor: 'pointer'
            })
            .bind({
                click: function() {
                    pandora.URL.pushPrevious();
                    that.fadeOutScreen();
                }
            })
            .appendTo(that),
        $findInput = Ox.Input({
                width: 156
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '48px',
                right: '164px',
                bottom: 0,
                margin: 'auto',
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
            .appendTo(that),
        $findButton = Ox.Button({
                title: 'Find',
                width: 74
            })
            .css({
                position: 'absolute',
                left: '82px',
                top: '48px',
                right: 0,
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    if (pandora.user.ui.list) {
                        Ox.forEach(pandora.$ui.folderList, function($list) {
                            $list.options({selected: []});
                        });
                    }
                    pandora.URL.set('/?find=' + $findInput.value());
                    that.fadeOutScreen();
                }
            })
            .appendTo(that),
        $browseButton = Ox.Button({
                title: 'Browse',
                width: 74
            })
            .css({
                position: 'absolute',
                left: '246px',
                top: '48px',
                right: 0,
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.URL.pushPrevious();
                    that.fadeOutScreen();
                }
            })
            .appendTo(that),
        $signupButton = Ox.Button({
                title: 'Sign Up',
                width: 74
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '112px',
                right: '246px',
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.URL.set('/signup');
                    that.fadeOutScreen();
                }
            }),    
        $signinButton = Ox.Button({
                title: 'Sign In',
                width: 74
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '112px',
                right: '82px',
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.URL.set('/signin');
                    that.fadeOutScreen();
                }
            }),    
        $preferencesButton = Ox.Button({
                title: 'Preferences',
                width: 156
            })
            .css({
                position: 'absolute',
                left: 0,
                top: '112px',
                right: '164px',
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.URL.set('/preferences');
                    that.fadeOutScreen();
                }
            }),    
        $aboutButton = Ox.Button({
                title: 'About ' + pandora.site.site.name,
                width: 156
            })
            .css({
                position: 'absolute',
                left: '164px',
                top: '112px',
                right: 0,
                bottom: 0,
                margin: 'auto',
                opacity: 0
            })
            .bindEvent({
                click: function() {
                    pandora.URL.set('/about');
                    that.fadeOutScreen();
                }
            })
            .appendTo(that),
        $text = $('<div>')
            .html('A Movie Database. \u2620 2007-2011 0x2620. All Open Source.')
            .css({
                position: 'absolute',
                left: 0,
                top: '176px',
                right: 0,
                bottom: 0,
                width: '360px',
                height: '16px',
                margin: 'auto',
                opacity: 0,
                textAlign: 'center'                               
            })
            .appendTo(that);

    if (pandora.user.level == 'guest') {
        $signupButton.appendTo(that);
        $signinButton.appendTo(that);
    } else {
        $preferencesButton.appendTo(that);
    }

    that.fadeInScreen = function() {
        Ox.print('FADE IN SCREEN')
        that.appendTo(Ox.UI.$body).animate({opacity: 1}, 500, function() {
            that.find(':not(#logo)').animate({opacity: 1}, 250, function() {
                $findInput.focusInput();
            });
        });
        $logo.animate({width: '320px'}, 500);
        return that;
    };

    that.fadeOutScreen = function() {
        that.find(':not(#logo)').hide();
        $logo.animate({width: window.innerWidth + 'px'}, 500);
        that.animate({opacity: 0}, 500, function() {
            that.remove();
        });
        return that;
    };

    that.hideScreen = function() {
        that.hide().remove();
        that.find(':not(#logo)').css({opacity: 0});
        $logo.css({width: window.innerWidth + 'px'});
        return that;
    };

    that.showScreen = function() {
        Ox.print('SHOW SCREEN')
        $logo.css({width: '320px'});
        that.find(':not(#logo)').css({opacity: 1});
        that.css({opacity: 1}).appendTo(Ox.UI.$body);
        $findInput.focusInput();
        return that;
    };

    return that;
  
};