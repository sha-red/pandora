// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.siteDialog = function(section) {

    var tabs = Ox.merge(
        Ox.clone(pandora.site.sitePages),
        [{id: 'software', title: 'Software'}]
    );
    //Ox.getObjectById(tabs, section).selected = true;
    tabs[Ox.getPositionById(tabs, section)].selected = true;
    //Ox.print('SITE DIALOG', section, Ox.getObjectById(tabs, section), Ox.getObjectById(tabs, section).selected)
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                var $content = Ox.Element().css({padding: '16px', overflowY: 'auto'});
                if (id == 'software') {
                    Ox.Element()
                        .html(
                            '<h1><b>Pan.do/ra</b></h1>'
                            + '<sub>open media archive</sub>'
                            + '<p><b>' + pandora.site.site.name + '</b> is based on <b>Pan.do/ra</b>, '
                            + 'a free open source framework for media archives.</p>'
                            + '<b>Pan.do/ra</b> includes <b>OxJS</b>, a new JavaScript library for web applications.</p>'
                            + '<p><b>Pan.do/ra</b> and <b>OxJS</b> will be released in 2012. More soon...</p>'
                        )
                        .appendTo($content);
                } else if (id == 'contact') {
                    pandora.$ui.contactForm = pandora.ui.contactForm().appendTo($content);
                } else {
                    pandora.api.getPage({name: id}, function(result) {
                        var $column, risk;
                        Ox.Editable({
                                clickLink: pandora.clickLink,
                                editable: pandora.site.capabilities.canEditSitePages[pandora.user.level],
                                tooltip: 'Doubleclick to edit',
                                type: 'textarea',
                                value: result.data.body
                            })
                            .css(id == 'rights' ? {
                                // this will get applied twice,
                                // total is 144px
                                marginRight: '72px'
                            } : {
                                width: '100%'
                            })
                            .bindEvent({
                                submit: function(data) {
                                    Ox.Request.clearCache('getPage');
                                    pandora.api.editPage({
                                        name: id,
                                        body: data.value
                                    });
                                }
                            })
                            .appendTo($content);
                        if (id == 'rights') {
                            $column = $('<div>')
                                .css({position: 'absolute', top: '16px', right: '16px', width: '128px'})
                                .appendTo($content);
                            $('<img>')
                                .attr({src: '/static/png/rights.png'})
                                .css({width: '128px', height: '128px', marginBottom: '8px'})
                                .appendTo($column);
                            risk = ['Unknown', 'Severe', 'High', 'Significant', 'General', 'Low'];
                            Ox.merge(
                                ['Unknown'],
                                pandora.site.rightsLevels.map(function(rightsLevel) {
                                    return rightsLevel.name;
                                }).reverse()
                            ).forEach(function(name, i) {
                                Ox.Theme.formatColor(330 + 30 * i, 'gradient')
                                    .css({
                                        padding: '4px',
                                        marginTop: '8px',
                                    })
                                    .html(
                                        '<b>' + name + '</b><br/><div style="padding-top: 2px; font-size: 9px; opacity: 0.75">'
                                        + risk[i] + ' Risk'
                                        + (i % 3 == 0 ? '<br/> of ' : ' of<br/>')
                                        + 'Legal Action</div>'
                                    )
                                    .appendTo($column);
                            })
                            pandora.site.rightsLevels.forEach(function(rightsLevel) {
                            });
                        }                        
                    });
                }
                return Ox.SplitPanel({
                    elements: [
                        {
                            element: Ox.Element()
                                .css({padding: '16px'})
                                .append(
                                    $('<img>')
                                        .attr({src: '/static/png/' + (
                                            id == 'software' ? 'pandora/icon' : 'logo'
                                        ) + '256.png'})
                                        .css({width: '256px'})
                                ),
                            size: 272
                        },
                        {
                            element: $content
                        }
                    ],
                    orientation: 'horizontal'
                });
            },
            tabs: tabs
        })
        .bindEvent({
            change: function(data) {
                $dialog.options({
                    title: Ox.getObjectById(tabs, data.selected).title
                });
                //pandora.URL.replace('/' + data.selected);
                //fixme: this should be using URL.push / UI.set
                //but that currenlty causes another dialog to be opened
                history.pushState({/*page: data.selected*/}, '', '/' + data.selected);
            }
        });
    var $dialog = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent({
                    click: function() {
                        $dialog.close().remove();
                        pandora.URL.update();
                    }
                })
            ],
            //closeButton: true,
            content: $tabPanel,
            height: Math.round((window.innerHeight - 24) * 0.75),
            //maximizeButton: true,
            minHeight: 256,
            minWidth: 688, // 16 + 256 + 16 + 384 + 16
            title: 'About',
            width: Math.round(window.innerWidth * 0.75),
        })
        .bindEvent({
            resize: function(data) {
                if ($tabPanel.selected() == 'contact') {
                    pandora.$ui.contactForm.resize();
                }
            }
        });

    $dialog.select = function(id) {
        $tabPanel.select(id);
        return $dialog;
    };

    return $dialog;

};
