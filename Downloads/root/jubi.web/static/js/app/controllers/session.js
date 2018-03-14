'use strict';

var module = angular.module('Jubi.controllers');

module.controller('SessionLoginController', ['$scope',
    function ($scope) {

        $scope.model = {
            email: null,
            password: null,
            remember: false,
            tzOffset: new Date().getTimezoneOffset()
        };
    }]);

module.controller('ForgotPasswordController', ['$scope', '$http', '$window', 'authService',
    function ($scope, $http, $window, authService) {
        $scope.isSuccess = false;
        $scope.errormsg = null;
        $scope.forgotPassword = function () {
            if ($scope.emailAddress !== "" && $scope.emailAddress !== undefined) {
                $http.post(authService.apiUrl + '/password-Reset', {email: $scope.emailAddress})
                    .success(function () {
                        $scope.isSuccess = true;
                        $scope.errormsg = null;
                    })
                    .error(function (err) {
                        $scope.errormsg = "Email Id not found.";
                    });
            }
            else {
                $scope.errormsg = "Invalid email Address.";
                $scope.isValidEmail = true;
            }
        };

        $scope.clearError = function () {
            $scope.errormsg = null;
        };

        $scope.redirectToHome = function () {
            $window.location.href = '/';
        };
    }]);


module.controller('PasswordResetController', ['$scope', '$http', '$modal', '$location', '$window', 'authService',
    function ($scope, $http, $modal, $location, $window, authService) {

        $scope.isFailed = false;
        $scope.isValidKey = false;
        $scope.isPass = false;
        $scope.message = "";

        var token = $window.location.href.substring($window.location.href.lastIndexOf('=') + 1)

        $scope.passwordReset = function () {

            if ($scope.newPassword !== undefined && $scope.newPassword !== "" && $scope.confirmPassword !== "" && $scope.confirmPassword !== undefined) {
                if ($scope.newPassword === $scope.confirmPassword) {
                    var userData = {
                        token: token,
                        password: $scope.newPassword
                    }
                    $http.post(authService.apiUrl + '/change-password' + "/userData", userData)
                        .success(function () {
                            $scope.isPass = true;
                            $scope.isFailed = false;
                            $scope.message = "Password reset successful !";
                        })
                        .error(function (err) {
                            $scope.isPass = false;
                            $scope.isFailed = true;
                            $scope.message = err;
                            $scope.isValidKey = true;
                        });
                }
                else {
                    $scope.isFailed = true;
                    $scope.message = "Password and Confirm password do not match !";
                }
            }
            else {
                $scope.isFailed = true;
                $scope.message = "Password and Confirm password cannot be blank !";
            }
        };

        $http.post(authService.apiUrl + '/password-reset' + "/token", {token: token})
            .success(function (result) {
                if (result == "Invalid key") {
                    $scope.isValidKey = true;
                    $scope.Message = "The reset has expired or is not valid !";
                }
            })
            .error(function (err) {
                $scope.isPass = false;
                $scope.isFailed = true;
                $scope.Message = err;
                $scope.isValidKey = true;
            });
    }]); 	
