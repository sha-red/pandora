'use strict';

pandora.ui.loadingIcon = function() {

    var self = {},
        that = Ox.LoadingIcon({
            tooltip: 'Reload Application'
        }, self)
        .attr({
            src: Ox.UI.getImageURL('symbolRedo')
        })
        .css(getCSS('stop'))
        .bindEvent({
            anyclick: function() {
                pandora.$ui.appPanel.reload();
            }
        });

    that.superStart = that.start;
    that.superStop = that.stop;

    that.start = function() {
        if (!self.loadingInterval) {
            that.css(getCSS('start'))
                .attr({
                    src: Ox.UI.getImageURL('symbolLoading')
                });
            that.superStart();
        }
    };

    that.stop = function() {
        if (self.loadingInterval) {
            that.superStop(function() {
                if (!self.loadingInterval) {
                    that.css(getCSS('stop'))
                        .attr({
                            src: Ox.UI.getImageURL('symbolRedo')
                        });
                }
            });
        }
    };

    that.update = function(requests) {
        that[requests ? 'start' : 'stop']();
    };

    function getCSS(action) {
        return action == 'start' ? {
            width: '16px',
            height: '16px',
            margin: 0,
            opacity: 0
        } : {
            width: '10px',
            height: '10px',
            margin: '3px',
            opacity: 1
        };
    }

    return that;

};
