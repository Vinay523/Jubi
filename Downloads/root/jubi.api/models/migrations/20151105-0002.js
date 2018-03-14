var services = require('../../services');

var async = require('async');
var Q = require('q');

module.exports = {
    up: function (migration, DataTypes) {
        return Q.Promise(function (resolve, reject) {



            async.series([
                    function (callback) {
                        migration.sequelize.query('DELETE FROM Histories where id in (select * from (SELECT H.id FROM Histories H' +
                        ' LEFT OUTER JOIN Programs P ON H.programId = P.id' +
                        ' WHERE P.id IS NULL) as temp);'
                        ).then(function () {
                            callback();
                        }).catch(callback);
                    },
                    function (callback) {
                        migration.sequelize.query('ALTER TABLE `jubi`.`Histories` ' +
                        ' ADD CONSTRAINT `Histories_ibfk_2`' +
                        ' FOREIGN KEY (`programId`)' +
                        ' REFERENCES `jubi`.`Programs` (`id`)' +
                        ' ON DELETE CASCADE' +
                        ' ON UPDATE CASCADE;').then(function () {
                            callback();
                        }).catch(callback);
                    }
                ],
                function (err) {
                    if (err) return services.helpers.handleReject(err, reject);
                    resolve();
                });
        });
    },
    down: function (migration) {
        return Q.Promise(function (resolve, reject) {

        });
    }
};




