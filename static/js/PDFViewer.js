'use strict';

/*@
Ox.PDFViewer <f> PDF Viewer
    options <o> Options
        center <[n]|s|'auto'> Center ([x, y] or 'auto')
        height <n|384> Viewer height in px
        maxZoom <n|16> Maximum zoom (minimum zoom is 'fit')
        pdfjsURL <s|'/static/pdf.js/'> URL to pdf.js
        url <s|''> PDF URL
        width <n|512> Viewer width in px
        zoom <n|s|'fit'> Zoom (number or 'fit' or 'fill')
    self <o> Shared private variable
    ([options[, self]]) -> <o:OxElement> PDF Viewer
        center <!> Center changed
            center <[n]|s> Center
        zoom <!> Zoom changed
            zoom <n|s> Zoom
        page <!> Page changed
            page <n|s> Page
@*/
Ox.PDFViewer = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            center: 'auto',
            height: 384,
            pdfjsURL: '/static/pdf.js/',
            page: 1,
            maxZoom: 16,
            url: '',
            width: 512,
            zoom: 'fit'
        })
        .options(options || {})
        .update({
            center: function() {
                setCenterAndZoom();
            },
            page: updatePage,
            // allow for setting height and width at the same time
            height: updateSize,
            url: function() {
                self.$iframe.postMessage('pdf', {pdf: self.options.url});
            },
            width: updateSize,
            zoom: function() {
                setCenterAndZoom();
            }
        })
        .addClass('OxPDFViewer')
        .on({
        })
        .bindEvent({
        });

    self.$iframe = Ox.Element('<iframe>')
            .attr({
                frameborder: 0,
                height: self.options.height + 'px',
                src: self.options.pdfjsURL + '?file=' + self.options.url,
                width: self.options.width + 'px'
            })
            .onMessage(function(event, data) {
                that.triggerEvent(event, data);
            })
            .appendTo(that);

    updateSize();

    function setCenterAndZoom() {
    }

    function updatePage() {
        self.$iframe.postMessage('page', {page: self.options.page});
    }

    function updateSize() {
        console.log('updateSize', self.options.width, self.options.height);
        that.css({
            height: self.options.height + 'px',
            width: self.options.width + 'px',
        });
        self.$iframe.css({
            height: self.options.height + 'px',
            width: self.options.width + 'px',
        });
    }

    /*@
    postMessage <f> postMessage
        (event, data) -> <o>  post message to pdf.js
    @*/
    that.postMessage = function(event, data) {
        self.$iframe.postMessage(event, data);
    }

    return that;
};
