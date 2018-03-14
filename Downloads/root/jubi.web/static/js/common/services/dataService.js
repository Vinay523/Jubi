var dataServiceObj = {};
dataServiceObj.dataService = function ($q, $http, authService) {
    var factory = {

        clientRoles: null,
        clientRoleIds: {
            contentProvider: 1,
            contentConsumer: 2
        },
        loadClientRoles: function() {
            return $q(function(resolve, reject) {
                if (factory.clientRoles) return resolve(factory.clientRoles);

                $http.get(authService.apiUrl + '/client-roles')
                    .success(function(clientRoles) {
                        factory.clientRoles = clientRoles;
                        resolve(factory.clientRoles);
                    })
                    .error(reject);
            });
        },
        getClientRole: function(id) {
            if (!factory.clientRoles) return null;
            return _.each(factory.clientRoles, function(cr) {cr.id==id;});
        }
    };
    return factory;
};


