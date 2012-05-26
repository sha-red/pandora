'use strict';

pandora.ui.news = function(width, height) {

    var that = Ox.Element(),
        $left = $('<div>')
            .css({position: 'absolute', width: width - 512})
            .appendTo(that),
        $right = $('<div>')
            .css({position: 'absolute', top: '16px', right: '16px', width: '192px'})
            .appendTo(that),
        color = Ox.Theme() == 'classic'
            ? 'rgb(32, 32, 32)' : 'rgb(224, 224, 224)',        
        isEditable = pandora.site.capabilities.canEditSitePages[pandora.user.level],
        items = [],
        selected,
        $text;

    pandora.api.getNews({}, function(result) {
        items = result.data.items;
        if(items.length) {
            selected = items[0].id;
            renderItem();
            renderList();
        } else if (isEditable) {
            addItem();
        }
    });

    function addItem() {
        pandora.api.addNews({
            title: 'Untitled',
            date: Ox.formatDate(new Date(), '%Y-%m-%d'),
            text: ''
        }, function(result) {
            items.splice(0, 0, result.data);
            selected = result.data.id;
            renderItem();
            renderList();
        });
    }

    function editItem(key, value) {
        var data = {id: selected},
            index = Ox.getIndexById(items, selected);
        data[key] = value;
        pandora.api.editNews(data, function(result) {
            Ox.print('DATA:::', result.data);
            items[index] = result.data;
            Ox.print('ITEMS:::', items);
            ['title', 'date'].indexOf(key) > -1 && renderList();
        });
    }

    function removeItem() {
        var index = Ox.getIndexById(items, selected);
        items.splice(index, 1);
        pandora.api.removeNews({id: selected}, function(result) {
            // ...
        });
        selected = items[0].id;
        renderItem();
        renderList();
    }

    function renderItem() {
        $left.empty();
        var $title, $date,
            index = Ox.getIndexById(items, selected);
        $title = Ox.Editable({
                editable: isEditable,
                tooltip: isEditable ? 'Doubleclick to edit' : '',
                value: items[index].title
            })
            .css({
                display: 'inline-block',
                fontWeight: 'bold',
                fontSize: '16px',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
            .bindEvent({
                submit: function(data) {
                    editItem('title', data.value);
                }
            })
            .appendTo($left);
        $('<div>').css({height: '2px'}).appendTo($left);
        $date = Ox.Editable({
                editable: isEditable,
                format: function(value) {
                    return Ox.formatDate(value, '%B %e, %Y');
                },
                tooltip: isEditable ? 'Doubleclick to edit' : '',
                value: items[index].date
            })
            .css({
                display: 'inline-block',
                fontSize: '9px',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
            .bindEvent({
                submit: function(data) {
                    editItem('date', data.value);
                }
            })
            .appendTo($left);
        $('<div>').css({height: '8px'}).appendTo($left);
        $text = Ox.Editable({
                clickLink: pandora.clickLink,
                editable: isEditable,
                maxHeight: height - 96,
                placeholder: 'No text',
                tooltip: isEditable ? 'Doubleclick to edit' : '',
                type: 'textarea',
                value: items[index].text,
                width: width - 512
            })
            .css({
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
            .bindEvent({
                submit: function(data) {
                    editItem('text', data.value);
                }
            })
            .appendTo($left);
    }

    function renderList() {
        $right.empty();
        if (isEditable) {
            $('<div>')
                .css({height: '16px', marginBottom: '8px'})
                .append(
                    Ox.Button({
                            title: 'Add',
                            width: 92
                        })
                        .css({float: 'left', margin: '0 4px 0 0'})
                        .bindEvent({
                            click: addItem
                        })
                )
                .append(
                    Ox.Button({
                            title: 'Remove',
                            width: 92
                        })
                        .css({float: 'left', margin: '0 0 0 4px'})
                        .bindEvent({
                            click: removeItem
                        })
                )
                .appendTo($right);
        }
        items.sort(function(a, b) {
            return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
        }).forEach(function(item, i) {
            Ox.Element()
                .addClass('item')
                .css({
                    width: '172px',
                    padding: '4px 8px 5px 8px',
                    borderRadius: '8px',
                    margin: '2px',
                    boxShadow: item.id == selected ? '0 0 2px ' + color : '',
                    cursor: 'pointer'
                })
                .html(
                    '<span style="font-size: 14px; font-weight: bold">' + item.title + '</span>'
                    + '<br><span style="font-size: 9px">'
                    + Ox.formatDate(item.date, '%B %e, %Y')
                    + '</span>'
                )
                .bindEvent({
                    anyclick: function() {
                        selected = item.id;
                        $('.item').css({boxShadow: 'none'});
                        this.css({boxShadow: '0 0 2px ' + color});
                        renderItem();
                    }
                })
                .appendTo($right);
        });
    }

    that.resize = function(data) {
        width = data.width;
        height = data.height;
        $left.css({width: width - 512});
        $text.css({width: width - 512});
    };

    return that;

};
