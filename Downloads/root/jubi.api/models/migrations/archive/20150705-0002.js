

var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function () {
        return Q.Promise(function (resolve, reject) {
            async.series([
                    function (callback) {
                        models.Program.update({
                            sequencingTypeId: 1
                        }, {
                            where: {
                                id: {
                                    $ne: 0
                                }
                            }
                        }).then(function(){ callback(); }).catch(callback);
                    },
                    function(callback) {
                        // Fix slugs
                        var sql = 'UPDATE Programs SET slug=REPLACE(slug,\' \', \'\') WHERE slug LIKE \'% %\'';
                        models.sequelize.query(sql)
                            .then(function(){ callback(); }).catch(callback);
                    }
                ],
                function (err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });
    }
};