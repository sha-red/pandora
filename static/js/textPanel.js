'use strict';

pandora.ui.textPanel = function(text, $toolbar) {
    if (Ox.isUndefined(text.text)) {
        var that = Ox.Element().append(Ox.LoadingScreen().start())
        pandora.api.getDocument({
            id: text.id,
            keys: ['text']
        }, function(result) {
            text.text = result.data.text
            if (text.text) {
                pandora.$ui.textPanel.replaceWith(pandora.$ui.textPanel = pandora.ui.textPanel(text, $toolbar))
            }
        })
        return that;
    }

    var textElement,
        textEmbed,
        embedURLs = getEmbedURLs(text.text),
        that = Ox.SplitPanel({
            elements: [
                {
                    element: textElement = pandora.ui.textHTML(text)
                },
                {
                    element: textEmbed = pandora.ui.textEmbed(),
                    collapsed: !embedURLs.length,
                    size: pandora.user.ui.embedSize,
                    resizable: true,
                    resize: [192, 256, 320, 384, 448, 512]
                }
            ],
            orientation: 'horizontal'
        }),
        selected = -1,
        selectedURL,
        $find,
        $nextButton,
        $currentButton,
        $previousButton;

    textElement.panel = that;

    if ($toolbar) {
        /*
        $find = Ox.Input({
                clear: true,
                placeholder: Ox._('Find in Texts'),
                value: pandora.user.ui.textFind,
                width: 188
            })
            .css({
                float: 'right',
            })
            .bindEvent({
                submit: function(data) {
                    Ox.print('SUBMIT', data);
                }
            })
            .appendTo($toolbar);
        */
        $nextButton = Ox.Button({
                disabled: embedURLs.length < 2,
                title: 'arrowRight',
                tooltip: Ox._('Next Reference'),
                type: 'image'
            })
            .css({
                'margin-right': (pandora.user.ui.embedSize + Ox.SCROLLBAR_SIZE) + 'px',
                float: 'right',
            })
            .bindEvent({
                click: function() {
                    that.selectEmbed(
                        selected < embedURLs.length - 1 ? selected + 1 : 0,
                        true
                    );
                }
            })
            .appendTo($toolbar);

        $currentButton = Ox.Button({
                disabled: embedURLs.length < 1,
                title: 'center',
                tooltip: Ox._('Current Reference'),
                type: 'image'
            })
            .css({
                float: 'right',
            })
            .bindEvent({
                click: scrollToSelectedEmbed
            })
            .appendTo($toolbar);

        $previousButton = Ox.Button({
                disabled: embedURLs.length < 2,
                title: 'arrowLeft',
                tooltip: Ox._('Previous Reference'),
                type: 'image'
            })
            .css({
                float: 'right',
            })
            .bindEvent({
                click: function() {
                    that.selectEmbed(
                        selected ? selected - 1 : embedURLs.length - 1,
                        true
                    );
                }
            })
            .appendTo($toolbar);
    }

    function getEmbedURLs(text) {
        var matches = text ? text.match(/<a [^<>]*?href="(.+?)".*?>/gi) : [],
            urls = [];
        if (matches) {
            matches.forEach(function(match) {
                var url = match.match(/"(.+?)"/)[1];
                if (pandora.isEmbedURL(url)) {
                    urls.push(url);
                }
            });
        }
        return urls;
    }

    function scrollToSelectedEmbed() {
        var scrollTop = Math.max(
            textElement[0].scrollTop + $('#embed' + selected).offset().top - (
                pandora.user.ui.showBrowser
                    ? pandora.$ui.documentContentPanel.options().elements[0].size
                    : 0
            ) - 48,
            0),
            position = 100 * scrollTop / Math.max(1, textElement[0].scrollHeight);
        textElement.scrollTo(position);
    }

    that.selectEmbed = function(index, scroll) {
        if (index != selected) {
            selected = index;
            selectedURL = embedURLs[selected]
            $('.OxSpecialLink').removeClass('OxActive');
            selected > -1 && $('#embed' + selected).addClass('OxActive');
            textEmbed.update(selectedURL);
            scroll && scrollToSelectedEmbed();
        }
    };

    that.scrollTextTop = function() {
        textElement && textElement.animate({scrollTop:0}, 250);
        return that;
    };

    that.update = function(text) {
        var index;
        embedURLs = getEmbedURLs(text);
        index = embedURLs.indexOf(selectedURL);
        if (embedURLs.length && (index == -1 || index >= embedURLs.length)) {
            index = 0;
        }
        selected = -1;
        that.selectEmbed(index);
        $nextButton && $nextButton.css({
            'margin-right': (pandora.user.ui.embedSize + Ox.SCROLLBAR_SIZE) + 'px',
        });
    };

    embedURLs.length && that.selectEmbed(0);
    return that;
}

pandora.ui.textHTML = function(text) {
    var height = getHeight(),
        width = getWidth(),

        that = Ox.Element()
            .css({
                'overflow-y': 'auto'
            })
            .bind({
                scroll: function(event) {
                    var position = Math.round(100 * that[0]. scrollTop / Math.max(1,
                            that[0].scrollHeight - that.height())),
                        settings, key;
                    if (pandora.user.ui.part.document) {
                        settings = pandora.user.ui.documents[pandora.user.ui.part.document] || {};
                        key = 'documents.' + pandora.user.ui.part.document;
                    } else {
                        settings = pandora.user.ui.documents[pandora.user.ui.document] || {};
                        key = 'documents.' + pandora.user.ui.document;
                    }
                    position = position - position % 10;
                    if (!scrolling && settings && (settings.name || (position != settings.position))) {
                        pandora.UI.set(key, {
                            position: position ? position : 0
                        });
                    }
                    scrolling = false;
                },
            })
            .bindEvent({
                pandora_showsidebar: function(data) {
                    that.update();
                },
            })
            .bindEvent('pandora_documents.' + pandora.user.ui.document.toLowerCase(), function(data) {
                data.value && data.value.name && scrollToPosition();
            })
            .bindEvent('pandora_texts.' + text.id.toLowerCase(), function(data) {
                data.value && data.value.name && scrollToPosition();
            }),
        scrolling = false,
        $content = Ox.Element()
            .css({margin: '16px'})
            .appendTo(that),

        $title = Ox.EditableContent({
                editable: text.title ? text.editable : false,
                placeholder: text.editable ? Ox._('Doubleclick to edit title') : Ox._('Untitled'),
                tooltip: text.editable ? pandora.getEditTooltip('title') : '',
                value: text.title || Ox._('{0} Texts', [pandora.site.site.name]),
                width: width
            })
            .css({
                //position: 'absolute',
                //width: width + 'px',
                height: '32px',
                fontSize: '18px',
            })
            .bindEvent({
                submit: function(data) {
                    if (pandora.user.ui.section == 'documents') {
                        pandora.api.editDocument({
                            id: pandora.user.ui.document,
                            title: data.value
                        }, function(result) {
                            if (result.data.name != data.value) {
                                Ox.Request.clearCache();
                                $title.options({
                                    value: result.data.title
                                })
                            }
                        });
                    } else {
                        Ox.Request.clearCache('getText');
                        pandora.api.editText({
                            id: pandora.user.ui.text,
                            name: data.value
                        }, function(result) {
                            if (result.data.id != pandora.user.ui.text) {
                                Ox.Request.clearCache();
                                pandora.renameList(pandora.user.ui.text, result.data.id, result.data.name);
                                pandora.$ui.info.updateListInfo();
                            }
                        });
                    }
                }
            })
            .appendTo($content),

        $spaceTop = Ox.Element()
            .css({height: '16px'})
            .appendTo($content),

        $text = Ox.EditableContent({
                clickLink: clickLink,
                collapseToEnd: false,
                editable: text.editable,
                format: function(text) {
                    /*
                    var $text = $('<div>').html(text),
                        $chapterElement = $text.find('[data-type="chapters"]')[0],
                        $footnoteElement = $text.find('[data-type="footnotes"]')[0],
                        $keywordElement = $text.find('[data-type="keywords"]')[0],
                        $chapters = [],
                        $footnotes = [],
                        $keywords = [],
                        footnote = 0,
                        keywords = [];
                    // chapters
                    $text.find('[data-type="chapter"]').each(function(index, element) {
                        var $element = $(element),
                            name = $element.attr('data-name') || $element.html(),
                            level;
                        Ox.loop(1, 7, function(i) {
                            if ($element.is('h' + i)) {
                                level = i;
                                return false; // break
                            }
                        });
                        if (!level) {
                            level = name.split(' ')[0].split('.').length || 1;
                        }
                    });
                    // footnotes
                    $text.find('[data-type="footnote"]').each(function(index, element) {
                        var $element = $(element),
                            value = $element.attr('data-value');
                        footnote = value ? parseInt(value) : footnote + 1;
                    });
                    // FIXME: remove footnotes, don't link to keywords inside footnotes
                    // keywords
                    $text.find('[data-type="keyword"]').each(function(index, element) {
                        var $element = $(element),
                            value = $element.attr('data-value') || element.html();
                        keywords.append(value);
                    });
                    $keywords = Ox.map(Ox.sort(Ox.unique(keywords)), function(keyword) {
                        return $('<a>').attr({href: '#'}).html(keyword);
                    });
                    text = $text.html();
                    */
                    // embeds
                    var index = 0;
                    return text.replace(
                        /<a [^<>]*?href="(.+?)".*?>/gi,
                        function() {
                            var link = arguments[0], ret, url = arguments[1];
                            if (pandora.isEmbedURL(url)) {
                                ret = '<a id="embed' + index
                                    + '" class="OxSpecialLink" href="' + url
                                    + '">'
                                index++;
                            } else {
                                ret = link;
                            }
                            return ret;
                        }
                    );
                },
                globalAttributes: ['data-name', 'data-type', 'data-value', 'lang'],
                placeholder: text.editable ? Ox._('Doubleclick to edit text') : '',
                tooltip: text.editable ? pandora.getEditTooltip('text') : '',
                type: 'textarea',
                width: width,
                value: text.text
            })
            .css({
                //position: 'absolute',
                //height: height + 'px',
                width: width + 'px',
                //marginTop: '48px',
                fontSize: '12px',
                lineHeight: '18px'
            })
            .bindEvent({
                submit: function(data) {
                    if (pandora.user.ui.section == 'documents') {
                        Ox.Request.clearCache('getDocument');
                        pandora.api.editDocument({
                            id: pandora.user.ui.document,
                            text: data.value
                        }, function(result) {
                            //fixme: just reload as it was done with textPanel
                            pandora.$ui.document = pandora.ui.document();
                        });
                    } else {
                        Ox.Request.clearCache('getText');
                        pandora.api.editText({
                            id: pandora.user.ui.text,
                            text: data.value
                        });
                        that.panel.update(data.value);
                    }
                }
            })
            .appendTo($content);

    setTimeout(scrollToPosition);

    function clickLink(e) {
        pandora.clickLink(e, that.panel.selectEmbed);
    }
    function getHeight() {
        // 24 menu + 24 toolbar + 16 statusbar + 32 title + 32 margins
        // + 1px to get rid of scrollbar
        return window.innerHeight - 128 - 1;
    }

    function getWidth() {
        return window.innerWidth
            - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
            - pandora.user.ui.embedSize - 1
            - 32 - Ox.UI.SCROLLBAR_SIZE;
    }

    function scrollTo(position) {
        scrolling = true;
        that[0].scrollTop = that[0].scrollHeight / 100 * position;
    }

    function scrollToPosition() {
        var settings = (pandora.user.ui.page == 'document' && pandora.user.ui.part.document
                ? pandora.user.ui.documents[pandora.user.ui.part.document]
                : pandora.user.ui.section == 'documents'
                ? pandora.user.ui.documents[pandora.user.ui.document]
                : {}) || {},
            position = settings.position || 0,
            element,
            scrollTop;
        if (settings.name) {
            element = that.find('*[data-name="' + settings.name + '"]');
            if (element.length) {
                scrollTop = that[0].scrollTop + element.offset().top;
                if (pandora.user.ui.page == 'document') {
                    scrollTop -= 48;
                } else {
                    scrollTop -= 80;
                    if (pandora.user.ui.showBrowser) {
                        scrollTop -= (112 + Ox.UI.SCROLLBAR_SIZE);
                    }
                }

                position = 100 * Math.max(scrollTop, 0) / that[0].scrollHeight;
            }
        }
        scrollTo(position);
    }

    that.scrollTo = scrollTo;

    that.update = function() {
        $text.options({
            width: getWidth()
        }).css({
            width: getWidth() + 'px'
        });
        scrollToPosition();
        return that;
    };
    that.bindEvent({
        mousedown: function() {
            setTimeout(function() {
                !Ox.Focus.focusedElementIsInput() && that.gainFocus();
            });
        }
    });
    return that;

};

pandora.ui.textEmbed = function(textEmbed) {

    var that = Ox.Element()
            .bindEvent({
                resizestart: function() {
                    $iframe.attr('src') && $overlay.show();
                },
                resize: function(data) {
                    pandora.user.ui.embedSize = data.size;
                    textElement.update();
                    pandora.$ui.document && pandora.$ui.document.update();
                },
                resizeend: function(data) {
                    $iframe.attr('src') && $overlay.hide();
                    // set to 0 so that UI.set registers a change of the value
                    pandora.user.ui.embedSize = 0;
                    pandora.UI.set({embedSize: data.size});
                }
            }),

        $message = $('<div>')
            .css({marginTop: '16px', textAlign: 'center'})
            .html(Ox._('No Embeds'))
            .hide()
            .appendTo(that),

        $iframe = Ox.Element('<iframe>')
            .attr({
                height: '100%',
                id: 'embed',
                frameborder: 0,
                src: '',
                width: '100%',
                allowfullscreen: true,
                mozallowfullscreen: true,
                webkitAllowFullScreen: true
            })
            .hide()
            .appendTo(that),

        $overlay = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            })
            .hide()
            .appendTo(that);

    that.update = function(url) {
        var parsed, src;
        if (url) {
            url = url.replace(/&amp;/g, '&')
                + (url.indexOf('#embed') < url.indexOf('?') ? '&' : '?')
                + 'matchRatio=true';
            src = $iframe.attr('src');
            parsed = {src: Ox.parseURL(src), url: Ox.parseURL(url)};
            if (
                src
                && parsed.url.protocol == parsed.src.protocol
                && parsed.url.hostname == parsed.src.hostname
            ) {
                $iframe.postMessage('seturl', {
                    url: parsed.url.pathname + parsed.url.search + parsed.url.hash
                });
            } else {
                $iframe.attr({src: url});
            }
            $message.hide();
            $iframe.show();
        } else {
            $iframe.hide();
            $message.show();
        }
        return that;
    };

    return that;

};
