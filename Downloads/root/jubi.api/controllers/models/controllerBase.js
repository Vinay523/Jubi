var models = require('../../models');

/**
 GET /<items>/ : return the items list
 GET /<items>/:id : return the item identified by the given :id
 POST /<items>/ : create a new item corresponding to the JSON object given in the body req
 PUT /<items>/:id : update the item with values of the JSON object given in the body req
 DELETE /<items>/:id : delete the item with the given id
 */

function ControllerBase(model){
    this.context = model;
}

ControllerBase.prototype.context = null;

ControllerBase.prototype.retrieveAll = function (req, res) {
    var self = this;

    var opts = {};
    if (req.query.trash) {
        opts = {
            where: {
                deletedAt: {
                    $ne: null
                }
            },
            paranoid: false
        }
    }
    else {
        opts = {
            where: req.query
        }
    }

    self.context.findAndCountAll(opts)
        .then(function(result) {
            if (result == null) return res.sendSuccess({count: 0, data: null});
            res.sendSuccess({count: result.count, data: result.rows});
        })
        .catch(function(err) { res.sendError(err); });
};

ControllerBase.prototype.retrieve = function (req, res) {
    var self = this;
    var id = req.params.id;

    self.context.find({
        where: {id: id}
    })
        .then(function(result) {
            if (result == null) return res.json({count: 0, data: null});
            res.sendSuccess({count: 1, data: result});
        })
        .catch(function(err) { res.sendError(err); });

};

ControllerBase.prototype.retrieveDeletedCount = function (req, res) {
    var self = this;

    self.context.count({
        where: {
            deletedAt: {
                $ne: null
            }
        },
        paranoid: false
    })
        .then(function(count) { res.sendSuccess({count: count}); })
        .catch(function(err) { res.sendError(err); });

};

ControllerBase.prototype.restore = function (req, res) {
    var self = this;

    models.sequelize.transaction().then(function(t) {
        // Restore the item
        self.context.restore({
            where: {id: req.params.id},
            transaction: t
        })
            .then(function() {
                t.commit().then(function() { res.status(200).end('OK'); });
            })
            .catch(function(error) {
                t.rollback().then(function() { res.sendError(error); });
            });
    });

};

ControllerBase.prototype.create = function (req, res) {
    var self = this;
    models.sequelize.transaction().then(function(t) {
        self.context.create(req.body, {transaction:t})
            .then(function(item) {
                t.commit().then(function() { res.status(201).sendSuccess({id: item.id}); });
            })
            .catch(function(err) {
                t.rollback().then(function() { res.sendError(err); });
            });
    });

};

ControllerBase.prototype.update = function (req, res) {
    var self = this;
    self.context.find({
        where: {id: req.params.id}
    })
        .then(function(result) {
            if (result == null) return res.status(404).end('Not Found');

            // Get the req data.
            var data = req.body;

            models.sequelize.transaction().then(function(t) {
                // Save the data.
                result.updateAttributes(data, {transaction:t})
                    .then(function() {
                        t.commit().then(function() { res.status(200).end('OK'); });
                    })
                    .catch(function(error) {
                        t.rollback().then(function() { res.sendError(error); });
                    });
            });
        });
};

ControllerBase.prototype.deleteItem = function (req, res) {
    var self = this;
    self.context.find({
        where: {id: req.params.id}
    })
        .then(function(result) {
            if (result == null) return res.status(404).end('Not Found');

            models.sequelize.transaction().then(function(t) {
                // Delete the data.
                result.destroy({transaction: t})
                    .then(function() {
                        t.commit().then(function() { res.status(200).end('OK'); });
                    })
                    .catch(function(error) {
                        t.rollback().then(function() { res.sendError(error); });
                    });
            });
        })
        .catch(function(error) { res.sendError(error); });
};

ControllerBase.prototype.resequence = function (req, res) {
    var self = this;
    var ids = req.body.ids;

    // Exit if an Array was not provided.
    if (!Array.isArray(ids))
        res.status(403).end('Invalid data');

    // Loop through the Array and update each row.
    for (var i=0, len=ids.length; i < len; i++) {

        self.context.update(
            {sequence: i + 1},
            {id: ids[i]}
        ).catch(function(error) { res.sendError(error); });
    }

    res.status(200).end('OK');
};

ControllerBase.prototype.action = function (method_name) {
    return this[method_name].bind(this);
};

module.exports = ControllerBase;