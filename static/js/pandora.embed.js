/***
    Pandora embed
***/

var pandora = new Ox.App({
    apiURL: '/api/',
    config: '/site.json',
    init: 'hello',
}).launch(function(data) {
    var d = $('<div>').html('Pan.do/ra embed')
                      .css({'position': 'absolute',
                            'padding-top': $(window).height()/4,
                            'padding-left':$(window).width()/4});
    $(document.body).append(d);
    var d = $('<div>').html('here be unicorns')
                      .css({'position': 'absolute',
                            'padding-top': $(window).height()/2,
                            'padding-left':$(window).width()/2});
    $(document.body).append(d);
});
