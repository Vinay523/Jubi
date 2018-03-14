'use strict';

var module = angular.module('Jubi.controllers');

module.controller('ProfileController', ['$scope', '$http', '$upload', '$modal', '$timeout', 'authService', 'helperService', '$window',
    function ($scope, $http, $upload, $modal, $timeout, authService, helpers, $window) {

        $scope.busy = false;
        $scope.save = {
            active: false,
            status: null,
            fade: false
        };
        $scope.originalPendingEmail = angular.copy(authService.user.pendingEmail);
        $scope.avatarLoading = false;
        $scope.model = {
            email: authService.user.email,
            pendingEmail: authService.user.pendingEmail,
            password: null,
            password2: null,
            firstName: authService.user.firstName,
            lastName: authService.user.lastName,
            title: authService.user.title,
            avatarUrl: authService.user.avatarUrl,
            why: authService.user.why,
            destination: authService.user.destination
        };
        var resetVal = function () {
            $scope.val = {
                pendingEmail: {fmt: false, dup: false},
                pass: {len: false, match: false},
                firstName: {req: false},
                lastName: {req: false},
                avatar: {type: false, size: false}
            }
        };
        resetVal();

        $scope.uploadAvatar = function (files) {
            if (!files || files.length <= 0) return;
            var file = files[0];

            resetVal();

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.val.avatar.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.val.avatar.size = true;
                return;
            }

            $scope.busy = true;
            $scope.avatarLoading = true;

            $upload.upload({
                url: authService.apiUrl + '/ui/square',
                fields: {sizes: [100, 250, 600]},
                file: file
            })
                .success(function (data) {

                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.model.avatarUrl = data.url;
                            $scope.avatarLoading = false;
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url + '/100x100';
                });
        };

        $scope.removeAvatar = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.model.avatarUrl = null;
        };
   $scope.redirectToUser = function (url, refresh) {
                if (refresh || $scope.$$phase) {
                    $window.location.href = url;
                } else {
                    $location.path(url);
                    $scope.$apply();
                }
        }
   $scope.redirectBack = function () {
     $window.history.back();  
   }
        $scope.submit = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.busy = true;

            var isValid = true;
            var passChanged = false;
            var emailChanged = false;
            resetVal();

            if ($scope.model.pendingEmail && !helpers.validEmail($scope.model.pendingEmail)) {
                $scope.val.pendingEmail.fmt = true;
                isValid = false;
            }
            if ($scope.model.password && $scope.model.password.length > 0) {
                if ($scope.model.password.length < 6) {
                    $scope.val.pass.len = true;
                    isValid = false;
                }
                else {
                    if ($scope.model.password !== $scope.model.password2) {
                        $scope.val.pass.match = true;
                        isValid = false;
                    }
                }
                passChanged = true;
            }
            if (!$scope.model.firstName || $scope.model.firstName.trim().length <= 0) {
                $scope.val.firstName.req = true;
                isValid = false;
            }
            if (!$scope.model.lastName || $scope.model.lastName.trim().length <= 0) {
                $scope.val.lastName.req = true;
                isValid = false;
            }

            if (!isValid) {
                $scope.busy = false;
                return;
            }
         
            var saveUser = function () {
                $scope.save.active = true;
                $scope.save.status = null;
                $scope.save.fade = false;

                $http.put(authService.apiUrl + '/users/' + authService.user.id, $scope.model)
                    .success(function () {
                        if (passChanged) {
                            $http.post('/login-reset', {
                                email: $scope.model.email,
                                password: $scope.model.password,
                                tzOffset: new Date().getTimezoneOffset()
                            }).success(function (result) {
                                    authService.init(result);
                                    $scope.save.active = false;
                                    $scope.save.status = 'ok';
                                    $timeout(function () {
                                        $scope.save.fade = true;
                                    }, 4000);
                                    $scope.busy = false;
                                });
                        }
                        else {
                            // Update the auth service
                            authService.user.firstName = $scope.model.firstName;
                            authService.user.lastName = $scope.model.lastName;
                            authService.user.title = $scope.model.title;
                            authService.user.avatarUrl = $scope.model.avatarUrl;
                            $scope.originalPendingEmail = $scope.model.pendingEmail;
                            $scope.save.active = false;
                            $scope.save.status = 'ok';
                            $timeout(function () {
                                $scope.save.fade = true;
                            }, 4000);

                            $scope.busy = false;
                        }
                    });
            };

            // Was email changed?
            if (!$scope.model.pendingEmail) return saveUser();

            // Check for duplicate email
            $http.post(authService.apiUrl + '/users/check-email', {email: $scope.model.pendingEmail})
                .success(function (result) {
                    if (result != 'OK') {
                        if (result == 'OWN') {
                            $scope.val.pendingEmail.own = true;
                        } else {
                            $scope.val.pendingEmail.dup = true;

                        }
                        $scope.busy = false;
                        return;
                    }
                    emailChanged = true;
                    saveUser();
                });
        };

        $scope.cancelPendingEmailUpdate = function () {
            // Check for duplicate email
            $http.post(authService.apiUrl + '/users/cancel-email-update')
                .success(function (result) {
                    $scope.model.pendingEmail = null;
                    $scope.originalPendingEmail = null;
                });
        };
    }]);

module.controller('NetworkProfileController', ['$scope', '$http', '$upload', '$modal', '$timeout', 'authService', 'helperService', '$window',
    function ($scope, $http, $upload, $modal, $timeout, authService, helpers, $window) {
        this.init = function (userId, slug, ret) {
            $scope.slug = slug;
            $scope.ret = ret;
            $scope.userId = userId;
        };

        $scope.isLoading  = true;

        var load = function(){
            $http.get(authService.apiUrl + '/program/' + $scope.program.id + '/networkUser/' + $scope.userId)
                .success(function (result) {
                    $scope.isLoading = false;
                    $scope.user = result;
                });
        };

        $scope.$watch(function () {
            return $scope.program;
        }, function () {
            if (!$scope.program) return;
            load();
        });

        $scope.backToNetwork = function () {
            $window.location = '/user/program/' + $scope.slug + '/network';
        };
        $scope.backToLeaderboard = function () {
            $window.location = '/user/program/' + $scope.slug + '/leaderboard';
        };
        $scope.redirectBack = function () {
            $window.history.back();
        }
    }]);
 