'use strict';

var module = angular.module('Jubi.controllers');

module.controller('UserGroupsController', ['$scope', 'helperService', 'authService', '$upload', '$timeout', '$modal', '$q', '$http', '$rootScope',
    function ($scope, helpers, authService, $upload, $timeout, $modal, $q, $http, $rootScope) {

        $scope.validate = function () {
            $scope.resetVal();
            var hasError = false;
            if (!$scope.model.name) {
                $scope.ui.val.name.req = true;
                hasError = true;
            }
            if ($scope.model.name && $scope.model.name.length > 25) {
                $scope.ui.val.name.length = true;
                hasError = true;
            }
            return !hasError;
        };

        $scope.valTemplate = {
            name: {
                req: false,
                dup: false,
                length: false
            }
        };

        $scope.ui = {};

        $scope.model = {
            name: null,
            networkUsers: $scope.usersPendingGroupCreation,
            linkId: $scope.program.linkId
        };

        $scope.cancelCreateUserGroup = function () {
            $rootScope.closeCreateUserGroupModal();
        };

        $scope.submitGroup = function (e) {
            if($scope.validate()) {
                $scope.submitted = true;
                return $q(function (resolve, reject) {
                    $http.post(authService.apiUrl + '/program-user-group/create/', $scope.model)
                        .success(function (group) {
                            resolve();
                            $rootScope.$emit('userGroupAdded', group);
                            $rootScope.closeCreateUserGroupModal();
                        })
                        .error(function (err) {
                            reject(err);
                            $scope.err = err;
                            $scope.submitted = false;
                            if (err.indexOf('Cannot have duplicate group names') != -1) {
                                $scope.ui.val.name.dup = true;
                            }
                        });
                });
            }
        };


        $scope.resetVal = function () {
            $scope.ui.val = angular.copy($scope.valTemplate);
        };

        $scope.resetVal();
    }]);





