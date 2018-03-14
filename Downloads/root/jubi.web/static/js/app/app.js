'use strict';

var filters = angular.module('Jubi.filters', []);
var controllers = angular.module('Jubi.controllers', []);
var directives = angular.module('Jubi.directives', []);
var services = angular.module('Jubi.services', []);

services.factory(base64Obj);
services.factory(authServiceObj);

var app = angular.module('Jubi', [
    'Jubi.filters',
    'Jubi.services',
    'Jubi.directives',
    'Jubi.controllers',
    'ui.bootstrap',
    'angularSpinner',
    'dndLists',
    'duScroll',
    'ui.utils'
]);

controllers.controller('RootController', ['$scope', '$rootScope', 'authService', '$window',
    function ($scope, $rootScope, authService, $window) {
        this.init = function(clientData) {
            authService.init(clientData);
        };
    }]);

