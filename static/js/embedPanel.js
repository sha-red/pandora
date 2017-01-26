'use strict';

// FIXME: rename to embedView

pandora.ui.embedPanel = function() {

    var that,
        ui = pandora.user.ui,
        view = !ui.item ? ui.listView : ui.itemView;

    if (!ui.page) {
        if (ui.section == 'items') {
            if (!ui.item) {
                if (view == 'grid') {
                    that = pandora.ui.embedGrid();
                } else if (view == 'clip') {
                    that = pandora.ui.embedError(true);
                } else if (Ox.contains(['map', 'calendar'], view)) {
                    that = pandora.ui.embedNavigation(view);
                }
            } else {
                if (view == 'info') {
                    that = pandora.ui.embedInfo();
                } else if (Ox.contains(['player', 'editor'], view)) {
                    that = pandora.ui.embedPlayer();
                } else if (view == 'timeline') {
                    that = pandora.ui.embedTimeline();
                } else if (view == 'clips') {
                    that = pandora.ui.embedError(true);
                } else if (Ox.contains(['map', 'calendar'], view)) {
                    that = pandora.ui.embedNavigation(view);
                }
            }
        } else if (ui.section == 'edits') {
            // FIXME: this is non-standard, see above!
            that = pandora.ui.editPanel(true);
        } else {
            that = pandora.ui.embedError(true)
        }
    } else if (ui.page == 'documents' && ui.document) {
        that = pandora.ui.embedError(true);
    }
    if (!that) {
        that = pandora.ui.embedError();
    }

    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && Ox.$body.css({opacity: 0});
        that.appendTo(Ox.$body);
        animate && Ox.$body.animate({opacity: 1}, 1000);
        return that;
    };

    // only add reloadPanel if not defined by embed element
    that.reloadPanel = that.reloadPanel || function(data) {
        if (Ox.isUndefined(data) || data.value != data.previousValue) {
            pandora.$ui.embedPanel.replaceWith(pandora.$ui.embedPanel = pandora.ui.embedPanel());
            return pandora.$ui.embedPanel;
        }
        return that;
    };

    that.bindEvent({
        pandora_find: that.reloadPanel,
        pandora_item: that.reloadPanel,
        pandora_itemview: that.reloadPanel,
        pandora_listview: that.reloadPanel,
        pandora_videopoints: that.reloadPanel,
        pandora_hash: that.reloadPanel
    });

    return that;

};
