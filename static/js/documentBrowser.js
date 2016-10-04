// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.documentBrowser = function() {
    var that;
    if (!pandora.user.ui.document) {
        that = Ox.Element().html('fixme');
    } else {
        var that = Ox.IconList({
            borderRadius: 0,
            centered: true,
            defaultRatio: 640/1024,
            draggable: true,
            id: 'list',
            item: function(data, sort, size) {
                size = size || 64;
                var sortKey = sort[0].key,
                    infoKey = sortKey == 'title' ? 'extension' : sortKey,
                    key = Ox.getObjectById(pandora.site.documentKeys, infoKey),
                    info = pandora.formatDocumentKey(key, data),
                    size = size || 128;
                return {
                    height: Math.round(data.ratio > 1 ? size / data.ratio : size),
                    id: data.id,
                    info: info,
                    title: data.title,
                    url: pandora.getMediaURL('/documents/' + data.id + '/256p.jpg?' + data.modified),
                    width: Math.round(data.ratio > 1 ? size : size * data.ratio)
                };
            },
            items: function(data, callback) {
                pandora.api.findDocuments(Ox.extend(data, {
                    query: pandora.user.ui.findDocuments
                }), callback);
                return Ox.clone(data, true);
            },
            keys: ['description', 'dimensions', 'extension', 'id', 'title', 'ratio', 'size', 'user', 'entities', 'modified'],
            max: 1,
            min: 1,
            orientation: 'horizontal',
            pageLength: 32,
            selected: [pandora.user.ui.document],
            size: 64,
            sort: getSort(),
            unique: 'id'
        })
        .addClass('OxMedia')
        .bindEvent({
            copy: function() {
                pandora.clipboard.copy(pandora.user.ui.item, 'document');
            },
            copyadd: function() {
                pandora.clipboard.add(pandora.user.ui.item, 'document');
            },
            gainfocus: function() {
                pandora.$ui.mainMenu.replaceItemMenu();
            },
            open: function() {
                that.scrollToSelection();
            },
            openpreview: function() {
                if (pandora.isVideoView()) {
                    pandora.$ui[pandora.user.ui.itemView].gainFocus().triggerEvent('key_space');
                }
            },
            select: function(data) {
                data.ids.length && pandora.UI.set({
                    'document': data.ids[0]
                });
            },
            toggle: function(data) {
                pandora.UI.set({showBrowser: !data.collapsed});
            }
        })
        .bindEventOnce({
            load: function() {
                // gain focus if we're on page load or if we've just switched
                // to an item and the not-yet-garbage-collected list still has
                // focus
                if (!Ox.Focus.focusedElement() || (
                    pandora.$ui.list && pandora.$ui.list.hasFocus()
                )) {
                    that.gainFocus();
                }
            }
        });
        that.css({overflowY: 'hidden'}); // this fixes a bug in firefox
        pandora.enableDragAndDrop(that, false);
    }
    function getSort() {
        return pandora.user.ui.collectionSort;
    }
    return that;
};

