'use strict';

pandora.ui.documentPages = function(options) {

    var self = {},
        that = Ox.Element()
            .css({
                height: '192px',
                margin: '4px',
                display: 'flex'
            })
            .bindEvent({
                doubleclick: doubleclick,
                singleclick: singleclick
            });

    self.options = Ox.extend({
        id: '',
        pages: 1,
        query: null,
        ratio: 8/5
    }, options);

    self.size = 128;
    self.width = self.options.ratio > 1 ? self.size : Math.round(self.size * self.options.ratio);
    self.height = self.options.ratio > 1 ? Math.round(self.size / self.options.ratio) : self.size;

    function renderPage(page) {
        var url = `/documents/${self.options.id}/${self.size}p${page}.jpg`
        var $item = Ox.IconItem({
                imageHeight: self.height,
                imageWidth: self.width,
                id: `${self.options.id}/${page}`,
                info: '',
                title: `Page ${page}`,
                url: url
            })
            .addClass('OxInfoIcon')
            .css({
            })
            .data({
                page: page
            });
        $item.find('.OxTarget').addClass('OxSpecialTarget');
        that.append($item);
    }

    function renderPages(pages) {
        console.log('renderPages', pages, self.options.pages)
        if (pages) {
            console.log('renderPages', pages)
            pages.forEach(page => {
                renderPage(page.page)
            })
        } else {
            if (self.options.pages > 1) {
                Ox.range(Ox.min([self.options.pages, 5])).forEach(page => { renderPage(page + 2) })
            }
        }
    }
    var query
    if (self.options.query) {
        var condition = self.options.query.conditions.filter(condition => {
            return condition.key == 'fulltext'
        })
        if (condition.length) {
            query = {
                'conditions': [
                    {'key': 'document', 'operator': '==', 'value': self.options.id},
                    {'key': 'fulltext', 'operator': '=', 'value': condition[0].value}
                ]
            }
        }
    }
    if (query) {
        pandora.api.findPages({
            query: query,
            range: [0, 100],
            keys: ['page']
        }, function(result) {
            renderPages(result.data.items)
        })
    } else {
        renderPages()
    }

    function doubleclick(data) {
        var $item, $target = $(data.target), annotation, item, points, set;
        if ($target.parent().parent().is('.OxSpecialTarget')) {
            $target = $target.parent().parent();
        }
        if ($target.is('.OxSpecialTarget')) {
            $item = $target.parent().parent();
            var page = $item.data('page')
            pandora.URL.push(`/documents/${self.options.id}/${page}`);
        }
    }

    function singleclick(data) {
        // ..
    }

    return that;

};
