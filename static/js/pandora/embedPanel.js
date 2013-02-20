pandora.ui.embedPanel = function() {

    var that, $errorBox, $errorLogo, $errorText;

    if (pandora.user.ui.item) {

        that = Ox.Element().html('OK');

    } else {

        that = Ox.Element()
            .addClass('OxScreen')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            });

        $errorBox = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: '96px',
                height: '96px',
                padding: '16px',
                margin: 'auto'
            })
            .appendTo(that);

        $errorLogo = $('<img>')
            .css({width: '96px', opacity: 0})
            .one({
                load: function() {
                    $errorLogo.animate({opacity: 1}, 250);
                }
            })
            .attr({src: '/static/png/logo.png'})
            .appendTo($errorBox);

        $errorText = $('<div>')
            .css({marginTop: '4px', fontSize: '9px', textAlign: 'center'})
            .html('This view cannot<br>be embedded.')
            .appendTo($errorBox);

    }

    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    };

    return that;

};