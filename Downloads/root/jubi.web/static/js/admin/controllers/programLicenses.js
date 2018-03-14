module.controller('ProgramLicensesController', ['$scope', '$http', '$timeout', '$q', '$window', '$upload', '$modal', 'authService', 'dataService', 'DTOptionsBuilder',
    function ($scope, $http, $timeout, $q, $window, $upload, $modal, authService, dataService, DTOptionsBuilder) {

        $scope.isLoading = true;
        $scope.clientId = null;
        $scope.programId = null;
        $scope.licenses = [];
        $scope.contentConsumers = null;
        $scope.isSaving = false;
        $scope.isLoading = false;
        $scope.isSystemAdmin = authService.canSystemAdmin();

        $scope.licenseProgram = function (license) {
            license.isSaving = true;
            return $q(function (resolve, reject) {
                $http.post(authService.apiUrl + '/programs/license-to-client', {
                    programId: $scope.programId,
                    license: license
                }).success(function (result) {
                    license.isSaving = false;
                    license.id = result.licenseId;
                    resolve();
                }).error(function (err) {
                    $scope.licenses = _.without($scope.licenses, license);
                    $modal.open({
                        templateUrl: 'infoModal.html',
                        controller: infoModalControllerObj.infoModalController,
                        size: 'sm',
                        resolve: {
                            initData: function () {
                                return {
                                    title: 'Error adding license',
                                    text: err,
                                    okLabel: 'OK'
                                }
                            }
                        }
                    })
                });
            });
        };

        $scope.back = function () {
            $window.history.back();
        };

        $scope.showSeatsValidationNotification = function (msg) {
            $modal.open({
                templateUrl: 'infoModal.html',
                controller: infoModalControllerObj.infoModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Cannot lower license seat allotment',
                            text: msg,
                            okLabel: 'OK'
                        }
                    }
                }
            });
        };

        var load = function (id) {
            $scope.isLoading = true;
            return $q.all([
                $http.get(authService.apiUrl + '/clients/' + $scope.clientId + '/programs/' + $scope.programId + '/licenses/'),
                $http.get(authService.apiUrl + '/clients/content-consumers'),
                $http.get(authService.apiUrl + '/clients/' + $scope.clientId)
            ])
        };

        $scope.toggleMenu = function (e, license) {
            license.menuOpen = !license.menuOpen;
        };

        $scope.licenseValTemplate = {
            seats: {
                req: false
            },
            client: {
                req: false
            }
        };

        $scope.finishInit = function (results) {
            $scope.licenses = results[0].data.licenses;
            $scope.client = results[2].data.data;

            angular.forEach($scope.licenses, function (license) {
                license.val = angular.copy($scope.licenseValTemplate)
            });

            $scope.program = results[0].data.program;
            $scope.version = results[0].data.version;
            $scope.requiredClients = results[0].data.clients;
            $scope.contentConsumers = results[1].data;

            var currentClientFromList = _.findWhere($scope.contentConsumers, {id: $scope.clientId});
            if (currentClientFromList) {
                $scope.contentConsumers = _.without($scope.contentConsumers, currentClientFromList);
            }

            _.each($scope.requiredClients, function (client) {
                if (!_.findWhere($scope.contentConsumers, {id: client.id})) {
                    var licensesForThisClient = _.filter($scope.licenses, function (license) {
                        return license.clientId == client.id
                    });
                    _.each(licensesForThisClient, function (license) {
                        license.readOnly = true;
                    })
                }
            });

            $scope.isLoading = false;
        };

        this.init = function (programId, clientId) {
            $scope.programId = programId;
            $scope.clientId = clientId;
            load().then($scope.finishInit);
        };

        var resetVal = function () {
            $scope.val = {
                name: {req: false},
                slug: {req: false, len: false},
                import: {type: false}
            };
        };

        $scope.addLicense = function () {
            var newLicense = {
                seats: $scope.client.trialLicenseSeats,
                type: 'readOnly',
                clientId: null
            };

            $scope.licenses.push(newLicense);
        };

        $scope.saveLicense = function (e, license) {
            var hasError = false;
            license.val = angular.copy($scope.licenseValTemplate);

            if (!license.seats) {
                license.val.seats.req = true;
                hasError = true;
            }
            if (!license.clientId) {
                license.val.client.req = true;
                hasError = true;
            }

            if (!hasError) {
                if (license.id != null) {
                    license.isSaving = true;
                    return $q(function (resolve, reject) {
                        $http.post(authService.apiUrl + '/programs/update-license', license)
                            .success(function () {
                                license.isSaving = false;
                                resolve();
                            }).error(function (err) {
                            if (err.type = 'seatsValidation') {
                                $scope.showSeatsValidationNotification(err.message);
                            }
                            license.isSaving = false;
                        });
                    });
                } else {
                    return $scope.licenseProgram(license);
                }
            }
        };

        $scope.removeLicense = function (e, license) {
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove License?',
                            text: 'You are about remove a license program. All program data will be deleted from the Content Consumer. Are you sure?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }

            }).result.then(
                function () {
                    if (license.id != null) {
                        license.isSaving = true;
                        return $q(function (resolve, reject) {
                            $http.post(authService.apiUrl + '/programs/remove-license', {programLicenseId: license.id})
                                .success(function () {
                                    license.isSaving = false;
                                    $scope.licenses = _.without($scope.licenses, license);
                                    resolve();
                                }).error(reject);
                        });
                    } else {
                        $scope.licenses = _.without($scope.licenses, license);
                    }

                });
        };

    }]);
