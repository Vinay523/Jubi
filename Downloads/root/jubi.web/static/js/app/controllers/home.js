'use strict';

var module = angular.module('Jubi.controllers');

module.controller('HeaderController', ['$scope', '$modal', '$window', 'authService', 'localStorage',
    function ($scope, $modal, $window, authService, localStorage) {

        $scope.auth = false;
        $scope.$watch(function() { return authService.auth }, function() {
            $scope.auth = authService.auth;
        });

        $scope.showLogin = function() {
            return !($window.location.pathname.indexOf('/login') >= 0 ||
                $window.location.pathname.indexOf('/forgot-password') >= 0 ||
                $window.location.pathname.indexOf('/reset-password') >= 0);
        };

        $scope.login = function(e) {
            e.preventDefault();
            $modal.open({
                templateUrl: 'loginModal.html',
                controller: 'LoginModalController',
                size: 'sm'
            }).result.then(function() {
                $window.location = '/';
            });
        };

        $scope.logout = function(e) {
            e.preventDefault();
        };
    }]);

module.controller('LoginModalController', ['$scope', '$modalInstance',
    function ($scope, $modalInstance) {
        $scope.model = {
            email: null,
            password: null,
            remember: false,
            tzOffset: new Date().getTimezoneOffset()
        };
        $scope.cancel = function () { $modalInstance.dismiss(); };
    }]);

module.controller('ResetPasswordController', ['$scope', 
    function ($scope) {
        $scope.model = {
            password: null,
            password2: null
        };
        var resetVal = function() {
            $scope.val = {
                pass: {req:false,len:false},
                pass2: {mat:false}
            }
        };
        resetVal();

        $scope.submit = function (e) {
            resetVal();
            var isValid = true;

            if (!$scope.model.password || $scope.model.password.length <= 0) {
                $scope.val.pass.req = true;
                isValid = false;
            }
            else {
                if ($scope.model.password.length < 6) {
                    $scope.val.pass.len = true;
                    isValid = false;
                }
                else {
                    if ($scope.model.password != $scope.model.password2) {
                        $scope.val.pass2.mat = true;
                        isValid = false;
                    }
                }
            }
            if (!isValid) e.preventDefault();
        };
    }]);


module.controller('CorruptTodoController', ['$scope', '$q', '$http', 'authService',

    function ($scope, $q, $http, authService) {

        $scope.cTodoTitle = null;
        

        $scope.getTodoList = function () {

            console.log($scope.cTodoTitle);

            if ($scope.cTodoTitle && $scope.cTodoTitle.length > 0) {
                return $q(function (resolve, reject) {
                    $http.post(authService.apiUrl + '/corruptTodo', { "title": $scope.cTodoTitle })
                        .success(function (newTodo) {

                            alert("Process Completed Ok")

                            //resolve();
                        })
                        .error(function (err) {
                            alert("Process Not Completed Ok")
                            reject(err);
                        });
                });

            }
            
        }
    }
]);