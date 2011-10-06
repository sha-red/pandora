// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.siteDialog = function(section) {

    var tabs = [
        {id: 'about', title: 'About'},
        {id: 'news', title: 'News'},
        {id: 'tour', title: 'Take a Tour'},
        {id: 'faq', title: 'Frequently Asked Questions'},
        {id: 'tos', title: 'Terms of Service'},
        {id: 'contact', title: 'Contact'},
        {id: 'software', title: 'Software'}
    ];
    Ox.getObjectById(tabs, section).selected = true;
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                var content = Ox.Element().css({padding: '16px', overflowY: 'auto'});
                if (id == 'contact') {
                    content.append(pandora.ui.contactForm());
                } else {
                    pandora.api.getPage({name:id}, function(result) {
                        content.html(result.data.body);
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
                                            id == 'software' ? 'pandora' : 'logo'
                                        ) + '256.png'})
                                        .css({width: '256px'})
                                ),
                            size: 272
                        },
                        {
                            element: content
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
                //fixme: this should be using URL.push / UI.set
                //but that currenlty causes another dialog to be opened
                history.pushState({}, '', '/' + data.selected);
            }
        });
    var $dialog = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'close',
                title: 'Close'
            }).bindEvent({
                click: function() {
                    $dialog.close();
                    //fixme: this should be using URL.push / UI.set
                    //but that currenlty causes a reload
                    history.pushState({}, '', '/');
                }
            })
        ],
        //closeButton: true,
        content: $tabPanel,
        height: Math.round((window.innerHeight - 24) * 0.75),
        //maximizeButton: true,
        minHeight: 256,
        minWidth: 640,
        title: 'About',
        width: Math.round(window.innerWidth * 0.75),
    });

    return $dialog;
  
};
