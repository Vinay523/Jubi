'use strict';

var module = angular.module('Jubi.controllers');

module.controller('UsersController', ['$scope', '$http', '$q', '$timeout', '$modal', '$window', 'authService', 'DTOptionsBuilder', 'DTColumnBuilder', '$compile', '$filter',
    function ($scope, $http, $q, $timeout, $modal, $window, authService, DTOptionsBuilder, DTColumnBuilder, $compile, $filter) {
        $scope.isLoading = true;
        $scope.users = [];
        $scope.trash = false;
        $scope.trashCount = 0;

        $scope.programSelected = function (item, user) {
            //Check if the program was selected or deselected by checking the toggled item against the users selected programs
            var userProgram = _.findWhere(user.selectedPrograms, {id: item.id});

            $scope.userAssignInProgress = true;

            //If the program exists, it is being added, otherwise removed
            if (userProgram) {
                var programUser = _.findWhere(user.programsAvailableAtClient, {linkId: item.id});
                programUser.userId = user.id;
                $http.post(authService.apiUrl + '/users/assign-program-user', programUser)
                    .success(function () {
                        $scope.userAssignInProgress = false;
                    })
                    .error(function (err) {
                        $scope.userAssignInProgress = false;
                        $modal.open({
                            templateUrl: 'infoModal.html',
                            controller: infoModalControllerObj.infoModalController,
                            size: 'sm',
                            resolve: {
                                initData: function () {
                                    return {
                                        title: 'All Seats Taken',
                                        text: err,
                                        okLabel: 'OK'
                                    }
                                }
                            }
                        });
                        user.selectedPrograms = _.without(user.selectedPrograms, item);
                    });

            } else {
                //Remove the program assignment
                $http.post(authService.apiUrl + '/users/remove-program-user', {
                    linkId: item.id,
                    userId: user.id
                }).success(function () {
                    $scope.userAssignInProgress = false;
                }).error(function (err) {
                    $scope.userAssignInProgress = false;
                })
            }
        };

        $scope.dtInstanceCallback = function (dtInstance) {
            $scope.dtInstance = dtInstance;
        };

        $scope.initDt = function () {
            $scope.dtOptions = DTOptionsBuilder.newOptions()
                .withOption('ajax', {
                    url: authService.apiUrl + '/users/table' + ($scope.trash ? '?trash=true' : ''),
                    type: 'GET',
                    headers: {'Authorization': authService.user.authHeader.Authorization},
                    complete: function (data) {
                        $scope.users = [];
                        //This is where the row gets compiles so that any angular expressions are seen by angular
                        //using the opportunity to catch the row data (users), format, and add them to global collection
                        //this enables the html templates to fetsh the row data.
                        $scope.users = data.responseJSON.data;
                        $scope.totalNumberOfUsers = data.responseJSON.recordsTotal;
                        $scope.formatUserPrograms();
                    }
                })
                .withOption('sDom', '<"top"i>rt<"bottom"lp><"clear">')
                .withDataProp('data')
                .withOption('processing', true)
                .withOption('serverSide', true)
                .withOption('order', [[3, 'desc']])
                .withDisplayLength(25)
                .withBootstrap()
                .withLightColumnFilter({
                    0: {"type": "text"},
                    1: {"type": "text"},
                    2: {"type": "text"},
                    3: {"type": "text"}
                })
                .withOption('createdRow', createdRow)
                .withPaginationType('full_numbers');
            $scope.dtColumns = [
                DTColumnBuilder.newColumn(null).withTitle('Name')
                    .renderWith(nameHtml),
                DTColumnBuilder.newColumn('email').withTitle('Email Address'),
                DTColumnBuilder.newColumn('role').withTitle('Role'),
                DTColumnBuilder.newColumn('client').withTitle('Client'),
                DTColumnBuilder.newColumn(null).withTitle('Programs')
                    .notSortable()
                    .renderWith(actionsHtml),
                DTColumnBuilder.newColumn(null).withTitle(($scope.trash ? 'Deleted' : 'Updated'))
                    .renderWith(dateHtml)
            ];
        };

        function actionsHtml(data) {
            return '<div ng-show="getUserById(' + data.id + ').programsAvailableAtClient.length > 0" ng-dropdown-multiselect="" disable- select="userAssignInProgress" reference-obj="getUserById(' + data.id + ')" events= "{ onItemSelect: programSelected, onItemDeselect: programSelected }" checkboxes= "true" options= "getUserById(' + data.id + ').programsAvailableAtClient" selected-model="getUserById(' + data.id + ').selectedPrograms" ></div>' +
                '<button ng-show="getUserById(' + data.id + ').programsAvailableAtClient.length == 0" class="btn btn-default" disabled="true" type="button" style="min-width:100%">No Programs Available</button>';
        }

        function dateHtml(data) {
            return $filter('date')(data.updatedAt, 'M/d/yyyy @ h:mm a');
        }

        function nameHtml(data) {
            return '<div>' + data.firstName + ' ' + data.lastName + '</div>' +
                '<div class="text-xs" ng-if="!trash">' +
                '<a href="/admin/users/' + data.id + '">Edit</a><span ng-if="getUserById(' + data.id + ').id>1"> | <a href="#" ng-click="removeUser($event,getUserById(' + data.id + '),$index)">Remove</a></span>' +
                '</div>' +
                '<div class="text-xs" ng-if="trash">' +
                '<a href="#" ng-click="restoreUser($event,getUserById(' + data.id + '),$index)">Restore</a>' +
                '</div>'
        }

        $scope.getUserById = function (id) {
            return _.findWhere($scope.users, {id: id});
        };

        function createdRow(row, data, dataIndex) {
            $compile(angular.element(row).contents())($scope);
        }

        var load = function () {
            return $q(function (resolve, reject) {
                resolve();
                var url = authService.apiUrl + '/users/get-assign-programs';
                $http.get(url)
                    .success(function (response) {
                        $scope.allPrograms = response;
                        $scope.formatUserPrograms();
                    })
                    .error(reject);
            });
        };

        $scope.formatUserPrograms = function () {
            if ($scope.allPrograms) {
                _.each($scope.users, function (user) {
                    user.selectedPrograms = [];

                    if (user.clients.length > 0) {
                        user.programsAvailableAtClient = _.where($scope.allPrograms, {clientId: user.clients[0].id});
                        _.each(user.programsAvailableAtClient, function (pg) {
                            pg.label = pg.title;
                            pg.id = pg.linkId;
                        });
                        _.each(user.programUsers, function (programUser) {
                            user.selectedPrograms.push({
                                id: programUser.linkId
                            });
                        });
                    } else {
                        user.programsAvailableAtClient = [];
                    }
                })
            }
        };

        var loadDeletedCount = function () {
            return $q(function (resolve, reject) {
                $http.get(authService.apiUrl + '/users/count/deleted')
                    .success(function (result) {
                        $scope.trashCount = result.count;
                        resolve();
                    })
                    .error(reject);
            });
        };

        this.init = function (trash) {
            $scope.trash = trash;
            $scope.initDt();
            load().then(function () {
                $timeout(function () {
                    $scope.isLoading = false;
                }, 250);
            });
            if (!$scope.trash)
                loadDeletedCount();
        };

        $scope.removeUser = function (e, user, index) {
            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove User',
                            text: 'You are about to remove the user <strong>' + user.firstName + ' ' + user.lastName + '</strong>.<br><br>Are you sure?',
                            okLabel: 'OK',
                            cancelLabel: 'Cancel'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.delete(authService.apiUrl + '/users/' + user.id)
                        .success(function () {
                            $scope.users.splice(index, 1);
                            $scope.dtInstance.reloadData();
                            $scope.trashCount++;
                        });
                });
        };

        $scope.restoreUser = function (e, client, index) {
            e.preventDefault();

            $http.post(authService.apiUrl + '/users/' + client.id + '/restore')
                .success(function () {
                    $window.location = '/admin/users';
                });
        };
    }
])
;

module.controller('UserEditController', ['$scope', '$http', '$timeout', '$q', '$window', '$upload', '$modal', 'authService', 'helperService',
    function ($scope, $http, $timeout, $q, $window, $upload, $modal, authService, helperService) {

        $scope.isLoading = true;
        $scope.user = null;
        $scope.support = {
            roles: [],
            clients: []
        };

        $scope.back = function () {
            $window.history.back();
        };

        var loadRoles = function () {
            return $q(function (resolve, reject) {
                $http.get(authService.apiUrl + '/roles')
                    .success(function (roles) {
                        _.each(roles.data, function (role) {
                            if (role.id >= authService.user.roles[0].id) {
                                $scope.support.roles.push(role);
                            }
                        });

                        resolve();
                    })
                    .error(reject);
            });
        };
        var getRole = function (id) {
            for (var i = 0; i < $scope.support.roles.length; i++) {
                if ($scope.support.roles[i].id === id) return $scope.support.roles[i];
            }
            return null;
        };
        var loadClients = function () {
            return $q(function (resolve, reject) {
                $http.get(authService.apiUrl + '/clients')
                    .success(function (clients) {
                        $scope.support.clients = clients.data;
                        resolve();
                    })
                    .error(reject);
            });
        };
        var getClient = function (id) {
            for (var i = 0; i < $scope.support.clients.length; i++) {
                if ($scope.support.clients[i].id === id) return $scope.support.clients[i];
            }
            return null;
        };

        var loadSupport = function () {
            return $q.all([
                loadRoles(),
                loadClients()
            ]);
        };

        var load = function (id) {
            return $q(function (resolve, reject) {
                $scope.isLoading = true;
                $http.get(authService.apiUrl + '/users/' + id)
                    .success(function (user) {
                        $scope.user = user.data;
                        $scope.user.password = null;
                        $scope.user.password2 = null;
                        $scope.user.role = getRole($scope.user.roles[0].id);

                        if ($scope.user.clients.length > 0) {
                            $scope.user.client = getClient($scope.user.clients[0].id);
                        }
                        $scope.userOriginalEmail = angular.copy($scope.user.email);
                        $timeout(function () {
                            $scope.isLoading = false;
                            resolve();
                        }, 250);
                    })
                    .error(reject);
            });
        };


        this.init = function (id) {
            loadSupport()
                .then(function () {
                    if (id <= 0) {
                        $scope.user = {
                            id: 0,
                            firstName: null,
                            lastName: null,
                            email: null,
                            password: null,
                            password2: null,
                            title: null,
                            role: null,
                            client: null
                        };
                        return $timeout(function () {
                            $scope.isLoading = false;
                        }, 250);
                    }
                    load(id);
                });
        };

        var resetVal = function () {
            $scope.val = {
                firstName: {req: false},
                lastName: {req: false},
                password: {req: false, len: false, mat: false},
                email: {req: false, fmt: false, dup: false},
                role: {req: false},
                client: {req: false}
            };
        };
        resetVal();

        $scope.submit = function (e) {
            e.preventDefault();
            resetVal();
            var isValid = true;

            console.log($scope.user);

            if (!$scope.user.firstName) {
                $scope.val.firstName.req = true;
                isValid = false;
            }
            if (!$scope.user.lastName) {
                $scope.val.lastName.req = true;
                isValid = false;
            }
            if ($scope.user.id <= 0 || $scope.user.password) {
                if (!$scope.user.password) {
                    $scope.val.password.req = true;
                    isValid = false;
                }
                else {
                    if ($scope.user.password.length < 6) {
                        $scope.val.password.len = true;
                        isValid = false;
                    }
                    else {
                        if ($scope.user.password != $scope.user.password2) {
                            $scope.val.password.mat = true;
                            isValid = false;
                        }
                    }
                }
            }
            if (!$scope.user.email) {
                $scope.val.email.req = true;
                isValid = false;
            }
            else {
                if (!helperService.validEmail($scope.user.email)) {
                    $scope.val.email.fmt = true;
                    isValid = false;
                }
            }
            if (!$scope.user.role) {
                $scope.val.role.req = true;
                isValid = false;
            }
            if (!$scope.user.client) {
                $scope.val.client.req = true;
                isValid = false;
            }

            if (!isValid) return;

            var submitUser = function () {
                $scope.isLoading = true;
                $http.post(authService.apiUrl + '/users', $scope.user)
                    .success(function (user) {
                        $scope.back();
                    });
            };

            if (!$scope.userOriginalEmail || ($scope.user.email.trim().toUpperCase() != $scope.userOriginalEmail.trim().toUpperCase())) {
                $http.post(authService.apiUrl + '/users/check-email', {email: $scope.user.email})
                    .success(function (result) {
                        if (result != 'OK') {
                            $scope.val.email.dup = true;
                            return;
                        }
                        submitUser();
                    });
            } else {
                submitUser();
            }
        };
    }]);
