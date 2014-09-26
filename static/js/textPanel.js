'use strict';

pandora.ui.textPanel = function() {

    var that = Ox.SplitPanel({
            elements: [
                {element: Ox.Element(), size: 24},
                {element: Ox.Element()},
                {element: Ox.Element(), size: 16}
            ],
            orientation: 'vertical'
        }),
        embedURLs,
        selected = -1,
        selectedURL;

    pandora.api.getText({id: pandora.user.ui.text}, function(result) {

        var text = result.data;
        embedURLs = text.type == 'html'
            ? getEmbedURLs(text.text)
            : [];

        var $toolbar = Ox.Bar({size: 24}),

            $editMenu, $uploadButton,

            $find = Ox.Input({
                    clear: true,
                    placeholder: Ox._('Find in Texts'),
                    value: pandora.user.ui.textFind,
                    width: 188
                })
                .css({
                    float: 'right',
                    margin: '4px 4px 4px 2px'
                })
                .bindEvent({
                    submit: function(data) {
                        Ox.print('SUBMIT', data);
                    }
                })
                .appendTo($toolbar),

            $nextButton = Ox.Button({
                    disabled: embedURLs.length < 2,
                    title: 'arrowRight',
                    tooltip: Ox._('Next Reference'),
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .bindEvent({
                    click: function() {
                        that.selectEmbed(
                            selected < embedURLs.length - 1 ? selected + 1 : 0,
                            true
                        );
                    }
                })
                .appendTo($toolbar),

            $currentButton = Ox.Button({
                    disabled: embedURLs.length < 1,
                    title: 'center',
                    tooltip: Ox._('Current Reference'),
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .bindEvent({
                    click: scrollToSelectedEmbed
                })
                .appendTo($toolbar),

            $previousButton = Ox.Button({
                    disabled: embedURLs.length < 2,
                    title: 'arrowLeft',
                    tooltip: Ox._('Previous Reference'),
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .bindEvent({
                    click: function() {
                        that.selectEmbed(
                            selected ? selected - 1 : embedURLs.length - 1,
                            true
                        );
                    }
                })
                .appendTo($toolbar),

            $statusbar = Ox.Bar({size: 16}),

            $panel = Ox.SplitPanel({
                elements: [
                    {
                        element: pandora.$ui.text = text.type == 'html'
                            ? pandora.ui.textHTML(text)
                            : pandora.ui.textPDF(text)
                    },
                    {
                        element: pandora.$ui.textEmbed = pandora.ui.textEmbed(),
                        // fixme: at some point pdf will also have a sidebar
                        size: text.type == 'html' ? pandora.user.ui.embedSize : 0,
                        resizable: text.type == 'html',
                        resize: [192, 256, 320, 384, 448, 512]
                    }
                ],
                orientation: 'horizontal'
            });

        if (text.editable) {
            if (text.type == 'html') {
                $editMenu = Ox.MenuButton({
                        items: [
                            {id: 'insertHTML', title: Ox._('Insert HTML...')},
                            {id: 'insertEmbed', title: Ox._('Insert Embed...')}
                        ],
                        title: 'edit',
                        tooltip: Ox._('Editing Options'),
                        type: 'image'
                    })
                    .css({
                        float: 'left',
                        margin: '4px 2px 4px 4px'
                    })
                    .bindEvent({
                        click: function(data) {
                            if (data.id == 'insertEmbed') {
                                pandora.$ui.insertEmbedDialog = pandora.ui.insertEmbedDialog(function() {
                                    // ...
                                }).open();
                            }
                        }
                    })
                    .appendTo($toolbar);
            } else {
                $uploadButton = Ox.FileButton({
                        image: 'upload',
                        tooltip: Ox._('Upload PDF'),
                        type: 'image'
                    })
                    .css({
                        float: 'left',
                        margin: '4px 2px 4px 4px'
                    })
                    .bindEvent({
                        click: function(data) {
                            if (data.files.length) {
                                pandora.$ui.uploadPDFDialog = pandora.ui.uploadPDFDialog({
                                    file: data.files[0],
                                    id: pandora.user.ui.text
                                }).open();
                            }
                        }
                    })
                    .appendTo($toolbar);
            }
        }

        that.replaceElement(0, $toolbar);
        that.replaceElement(1, $panel);
        that.replaceElement(2, $statusbar);

        embedURLs.length && that.selectEmbed(0);
    });

    function getEmbedURLs(text) {
        var matches = text.match(/<a [^<>]*?href="(.+?)".*?>/gi),
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
        var scrollTop = Math.max(pandora.$ui.text[0].scrollTop + $('#embed' + selected).offset().top - 48, 0),
            position = 100 * scrollTop / Math.max(1,
                    pandora.$ui.text[0].scrollHeight);
        pandora.$ui.text.scrollTo(position);
    }

    that.selectEmbed = function(index, scroll) {
        if (index != selected) {
            selected = index;
            selectedURL = embedURLs[selected]
            $('.OxSpecialLink').removeClass('OxActive');
            selected > -1 && $('#embed' + selected).addClass('OxActive');
            pandora.$ui.textEmbed.update(selectedURL);
            scroll && scrollToSelectedEmbed();
        }
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
    };

    return that;

};

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
                        settings = pandora.user.ui.texts[pandora.user.ui.text];
                    position = position - position % 10;
                    if (!scrolling && settings && (settings.name || (position != settings.position))) {
                        pandora.UI.set('texts.' + pandora.UI.encode(pandora.user.ui.text), {
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
            .bindEvent('pandora_texts.' + text.id.toLowerCase(), function(data) {
                data.value && data.value.name && scrollToPosition();
            }),
        scrolling = false,
        $content = Ox.Element()
            .css({margin: '16px'})
            .appendTo(that),

        $title = Ox.EditableContent({
                editable: text.name ? text.editable : false,
                placeholder: text.editable ? Ox._('Doubleclick to edit title') : Ox._('Untitled'),
                tooltip: text.editable ? pandora.getEditTooltip('title') : '',
                value: text.name || Ox._('{0} Texts', [pandora.site.site.name]),
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
            })
            .appendTo($content),

        $spaceTop = Ox.Element()
            .css({height: '16px'})
            .appendTo($content),

        $text = Ox.EditableContent({
                clickLink: pandora.clickLink,
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
                    Ox.Request.clearCache('getText');
                    pandora.api.editText({
                        id: pandora.user.ui.text,
                        text: data.value
                    });
                    pandora.$ui.textPanel.update(data.value);
                }
            })
            .appendTo($content);

    setTimeout(scrollToPosition);

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
        var settings = pandora.user.ui.texts[pandora.user.ui.text] || {},
            position = settings.position || 0,
            element,
            scrollTop;
        if (settings.name) {
            element = that.find('*[data-name="' + settings.name + '"]');
            if (element.length) {
                scrollTop = Math.max(that[0].scrollTop + element.offset().top - 48, 0);
                position = 100 * scrollTop / that[0].scrollHeight;
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

    return that;

};

pandora.ui.textPDF = function(text) {

    var that = Ox.Element(),
        $iframe,
        page = pandora.user.ui.texts[pandora.user.ui.text].position || 1,
        url = '/texts/' + pandora.user.ui.text + '/text.pdf.html#page=' + page;
    if (text.uploaded) {
        $iframe = Ox.Element('<iframe>')
            .attr({
                frameborder: 0,
                height: '100%',
                src: url,
                width: '100%'
            })
            .bindMessage({
                edit: function(data) {
                    pandora.ui.insertEmbedDialog(data.src, function(url) {
                        data.src = url;
                        var embed = text.embeds.filter(function(embed) {
                            return embed.id == data.id
                                && embed.type == data.type
                                && embed.page == data.page;
                        })[0];
                        if (embed) {
                            embed.src = url;
                        } else {
                            text.embeds.push(data);
                            //fixme sort embeds by page/id
                        }
                        pandora.api.editText({
                            id: text.id,
                            embeds: text.embeds
                        }, function(result) {
                            $iframe.postMessage('update', data);
                        });
                    }).open();
                },
                page: function(data) {
                    pandora.UI.set('texts.' + pandora.UI.encode(pandora.user.ui.text), {
                        'position': data.page
                    });
                }
            })
            .appendTo(that);
        that.setPage = function(page) {
            $iframe && $iframe.postMessage('page', {page: page});
        }
    } else {
        that.html('Please upload PDF');
    }

    return that;

};

pandora.ui.textEmbed = function() {

    var that = Ox.Element()
            .bindEvent({
                resizestart: function() {
                    $iframe.attr('src') && $overlay.show();
                },
                resize: function(data) {
                    pandora.user.ui.embedSize = data.size;
                    pandora.$ui.text.update();
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
