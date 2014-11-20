// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.deleteEntityDialog = function(entities, callback) {

    var string = Ox._(entities.length == 1 ? 'Entity' : 'Entities'),
        that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: Ox._('Keep {0}', [string])
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: Ox._('Delete {0}', [string])
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api.removeEntity({
                            ids: entities.map(function(file) {
                                return file.id;
                            })
                        }, callback);
                    }
                })
            ],
            content: entities.length == 1
                ? Ox._('Are you sure you want to delete the entity "{0}"?', [entities[0].name])
                : Ox._('Are you sure you want to delete {0} entities?', [entities.length]),
            keys: {enter: 'delete', escape: 'keep'},
            title: entities.length == 1
                ? Ox._('Delete {0}', [string])
                : Ox._('Delete {0} Entities', [entities.length])
        });

    return that;

};
