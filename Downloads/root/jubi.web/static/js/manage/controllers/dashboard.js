'use strict';

var module = angular.module('Jubi.controllers');

module.controller('DashboardController', ['$scope', '$timeout',
    function ($scope) {
		
        $scope.stopLoading();
    }]);

