'use strict';

var module = angular.module('Jubi.controllers');

module.controller('ClientsController', ['$scope', '$http', '$q', '$timeout', '$modal', '$window', 'authService', 'DTOptionsBuilder', 'DTColumnDefBuilder',
    function ($scope, $http, $q, $timeout, $modal, $window, authService, DTOptionsBuilder, DTColumnDefBuilder) {
        $scope.isLoading = true;
        $scope.clients = [];
        $scope.loggedInClientId = authService.user.clients[0].id;
        $scope.trash = false;
        $scope.trashCount = 0;
        $scope.allowCreateClient = authService.user.clients[0].allowCreateClient;

        $scope.dtOptions = DTOptionsBuilder
            .newOptions()
            .withDisplayLength(25)
            .withOption('order', [[3, 'desc']])
            .withBootstrap();

        $.fn.dataTableExt.oSort['nullable-asc'] = function (a, b) {
            if (a == '-')
                return 1;
            else if (b == '-')
                return -1;
            else {
                var ia = new Date(a);
                var ib = new Date(b);
                return (ia < ib) ? -1 : ((ia > ib) ? 1 : 0);
            }
        };

        $.fn.dataTableExt.oSort['nullable-desc'] = function (a, b) {
            if (a == '-')
                return 1;
            else if (b == '-')
                return -1;
            else {
                var ia = new Date(a);
                var ib = new Date(b);
                return (ia > ib) ? -1 : ((ia < ib) ? 1 : 0);
            }
        };

        $scope.dtColumnDefs = [
            DTColumnDefBuilder.newColumnDef(0),
            DTColumnDefBuilder.newColumnDef(1),
            DTColumnDefBuilder.newColumnDef(2),
            DTColumnDefBuilder.newColumnDef(3),
            DTColumnDefBuilder.newColumnDef(4).withOption('type', 'nullable')
        ];

        $scope.isSystemAdmin = authService.canSystemAdmin();
        if($scope.isSystemAdmin){
            $scope.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(5));
        }

        var load = function () {
            return $q(function (resolve, reject) {
                var url = authService.apiUrl + '/clients';
                if ($scope.trash) url += '?trash=true';
                $http.get(url)
                    .success(function (clients) {
                        $scope.clients = clients.data;
                        _.each($scope.clients, function (client) {
                            var roleNames = _.map(client.roles, function (r) {
                                return r.name;
                            });
                            client.roleNames = roleNames.join('<br>');
                        });
                        resolve();
                    })
                    .error(reject);
            });
        };
        var loadDeletedCount = function () {
            return $q(function (resolve, reject) {
                $http.get(authService.apiUrl + '/clients/count/deleted')
                    .success(function (result) {
                        $scope.trashCount = result.count;
                        resolve();
                    })
                    .error(reject);
            });
        };

        this.init = function (trash) {
            $scope.trash = trash;

            load().then(function () {
                $timeout(function () {
                    $scope.isLoading = false;
                }, 250);
            });
            if (!$scope.trash)
                loadDeletedCount();
        };

        $scope.removeClient = function (e, client, index) {
            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Client',
                            text: 'You are about to remove the client <strong>' + client.name + '</strong>.<br><br>Are you sure?',
                            okLabel: 'OK',
                            cancelLabel: 'Cancel'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.delete(authService.apiUrl + '/clients/' + client.id)
                        .success(function () {
                            $scope.clients.splice(index, 1);
                        });
                });
        };

        $scope.restoreClient = function (e, client, index) {
            e.preventDefault();

            $http.post(authService.apiUrl + '/clients/' + client.id + '/restore')
                .success(function () {
                    $window.location = '/admin/clients';
                }).catch(function (err) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot restore client!',
                                text: err.data,
                                okLabel: 'OK'
                            }
                        }
                    }
                });
            });
        };
    }]);

module.controller('ClientEditController', ['$scope', '$http', '$timeout', '$q', '$window', '$upload', '$modal', 'authService', 'dataService', 'DTOptionsBuilder', '$compile', 'DTColumnBuilder', '$filter', 'helperService', '$rootScope',
    function ($scope, $http, $timeout, $q, $window, $upload, $modal, authService, dataService, DTOptionsBuilder, $compile, DTColumnBuilder, $filter, helpers, $rootScope) {

        $scope.isLoading = true;
        $scope.client = null;
        $scope.users = [];
        $scope.programsAvailableAtClient = [];
        $scope.selectedProgramsForBulkAssign = [];
        $scope.ui = {};
        if(authService.canSystemAdmin()) {
            $scope.ui.isSystemAdmin = true
        }

        var orgSlug = null;

        $scope.dtOptions = DTOptionsBuilder
            .newOptions()
            .withDisplayLength(25)
            .withOption('order', [[0, 'asc']])
            .withBootstrap();

        $scope.manageProgramLicenses = function (id) {
            $window.location = $scope.client.id + '/programs/' + id + '/licenses';
        };

        $scope.dtInstanceCallback = function (dtInstance) {
            $scope.dtInstance = dtInstance;
        };

        $scope.formatUserPrograms = function () {
            _.each($scope.users, function (user) {
                user.selectedPrograms = [];
                if (user.clients.length > 0) {
                    _.each(user.programUsers, function (programUser) {
                        user.selectedPrograms.push({
                            id: programUser.linkId
                        });
                    });
                }
            })
        };

        $scope.initDt = function () {
            $scope.dtOptions = DTOptionsBuilder.newOptions()
                .withOption('ajax', {
                    url: authService.apiUrl + '/client/users/table?clientId=' + $scope.client.id,
                    type: 'GET',
                    headers: {'Authorization': authService.user.authHeader.Authorization},
                    complete: function (data) {
                        $scope.users = data.responseJSON.data;
                        $scope.selectedUserIds = _.pluck($scope.users, 'id');
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
            return '<button class="btn btn-default" disabled="true" type="button" style="min-width:100%" ng-show="programsAvailableAtClient.length==0">No Programs Available</button>' +
                '<div ng-dropdown-multiselect="" ng-show="programsAvailableAtClient.length>0"  disable-select="userAssignInProgress" reference-obj="getUserById(' + data.id + ')" events="{ onItemSelect: programSelected, onItemDeselect: programSelected }" checkboxes="true" options="programsAvailableAtClient" selected-model="getUserById(' + data.id + ').selectedPrograms"></div>';
        }

        function dateHtml(data) {
            return $filter('date')(data.updatedAt, 'M/d/yyyy @ h:mm a');
        }

        function nameHtml(data) {
            return '<div>' + data.firstName + ' ' + data.lastName + '</div>' +
                '<div class="text-xs" ng-if="!trash">' +
                '<a href="/admin/users/' + data.id + '">Edit</a><span ng-if="getUserById(' + data.id + ').id>1"> | <a href="#" ng-click="removeUser($event,getUserById(' + data.id + '),$index)">Remove From Client</a></span>' +
                '</div>';
        }

        $scope.getUserById = function (id) {
            return _.findWhere($scope.users, {id: id});
        };

        function createdRow(row, data, dataIndex) {
            $compile(angular.element(row).contents())($scope);
        }


        var load = function (id) {
            return $q(function (resolve, reject) {
                $scope.isLoading = true;

                $http.get(authService.apiUrl + '/clients/' + id)
                    .success(function (response) {
                        $scope.client = response.data;

                        orgSlug = $scope.client.slug;
                        $scope.client.contentProvider = _.find($scope.client.roles, function (r) {
                            return r.id == dataService.clientRoleIds.contentProvider;
                        }) ? true : false;
                        $scope.client.contentConsumer = _.find($scope.client.roles, function (r) {
                            return r.id == dataService.clientRoleIds.contentConsumer;
                        }) ? true : false;


                        $scope.initDt();
                        $scope.isLoading = false;
                        resolve();

                        $q.all([
                            $http.get(authService.apiUrl + '/clients/' + id + '/programs'),
                            $http.get(authService.apiUrl + '/clients/' + id + '/get-client-assign-programs'),
                            dataService.loadClientRoles()
                        ]).then(function (results) {
                            $scope.programs = $.map(_.groupBy(results[0].data, 'linkId'), function (value) {
                                return [value];
                            });
                            $scope.programsAvailableAtClient = results[1].data;
                            $scope.programsGroups = angular.copy(_.groupBy(results[0].data, 'linkId'));
                            _.each($scope.programsAvailableAtClient, function (pg) {
                                pg.label = pg.title;
                                pg.id = pg.linkId;
                            });

                            $scope.selectedUserIds = _.pluck($scope.users, 'id');

                            $scope.formatUserPrograms();
                        })
                    });
            });
        };


        $scope.programSelected = function (item, user) {
            //Check if the program was selected or deselected by checking the toggled item against the users selected programs
            var userProgram = _.findWhere(user.selectedPrograms, {id: item.id});

            $scope.userAssignInProgress = true;

            //If the program exists, it is being added, otherwise removed
            if (userProgram) {
                var programUser = _.findWhere($scope.programsAvailableAtClient, {linkId: item.id});
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

        $scope.assignBulkSelection = function () {
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Are you sure?',
                            text: 'You are about to assign the selection program to all users included in the filtered results, are you sure?',
                            okLabel: 'OK',
                            cancelLabel: 'Cancel'
                        }
                    }
                }
            }).result.then(
                function () {
                    var programs = [];
                    _.each($scope.selectedProgramsForBulkAssign, function (obj) {
                        var program = {
                            linkId: obj.id
                        };

                        var foundProgram = _.findWhere($scope.programsAvailableAtClient, {linkId: obj.id});
                        programs.push({
                            contentProviderId: foundProgram.contentProviderId,
                            linkId: foundProgram.linkId,
                            id: foundProgram.id,
                            clientId: foundProgram.clientId
                        });
                    });

                    var model = {
                        users: $scope.selectedUserIds,
                        programs: programs
                    };

                    $scope.showLoadingOverlay = true;
                    $scope.userAssignInProgress = true;
                    $http.post(authService.apiUrl + '/client/users/bulk-assign-program-users', model)
                        .success(function () {
                            $window.location.reload();
                        }).error(function (err) {
                        $scope.userAssignInProgress = false;
                        $scope.showLoadingOverlay = false;
                        $modal.open({
                            templateUrl: 'infoModal.html',
                            controller: infoModalControllerObj.infoModalController,
                            size: 'sm',
                            resolve: {
                                initData: function () {
                                    return {
                                        title: 'Not enough seats',
                                        text: err,
                                        okLabel: 'OK'
                                    }
                                }
                            }
                        });
                    });
                });

        };


        $scope.unassignBulkSelection = function () {
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Are you sure?',
                            text: 'You are about to unassign the selection program from all users included in the filtered results, are you sure?',
                            okLabel: 'OK',
                            cancelLabel: 'Cancel'
                        }
                    }
                }
            }).result.then(
                function () {
                    var programs = [];
                    _.each($scope.selectedProgramsForBulkAssign, function (obj) {
                        var program = {
                            linkId: obj.id
                        };

                        var foundProgram = _.findWhere($scope.programsAvailableAtClient, {linkId: obj.id});
                        programs.push({
                            contentProviderId: foundProgram.contentProviderId,
                            linkId: foundProgram.linkId,
                            id: foundProgram.id,
                            clientId: foundProgram.clientId
                        });
                    });

                    var model = {
                        users: $scope.selectedUserIds,
                        programs: programs
                    };
                    $scope.userAssignInProgress = true;
                    $scope.showLoadingOverlay = true;
                    $http.post(authService.apiUrl + '/client/users/bulk-unassign-program-users', model)
                        .success(function () {
                            $window.location.reload();
                        }).error(function (err) {
                        $scope.userAssignInProgress = false;
                        $scope.showLoadingOverlay = false;
                        $modal.open({
                            templateUrl: 'infoModal.html',
                            controller: infoModalControllerObj.infoModalController,
                            size: 'sm',
                            resolve: {
                                initData: function () {
                                    return {
                                        title: 'Not enough seats',
                                        text: err,
                                        okLabel: 'OK'
                                    }
                                }
                            }
                        });
                    });
                });
        };

        this.init = function (id) {
            if (id <= 0) {
                $scope.client = {
                    name: null,
                    slug: null,
                    contentProvider: false,
                    contentConsumer: true,
                    seats: authService.user.clients[0].trialClientSeats
                };
                return $timeout(function () {
                    $scope.isLoading = false;
                }, 250);
            }
            load(id)
        };

        $scope.resetBranding = function(){
            $scope.client.logoImageUrl = null;
            $scope.client.logoAlignment = null;
            $scope.client.headerColor = null;
            $scope.client.headerFontColor = null;
            $scope.client.backgroundColor = null;
            $scope.client.backgroundFontColor = null;
            $scope.client.buddyLabel = null;
            $scope.client.badgeLabel = null;
        };

        var resetVal = function () {
            $scope.val = {
                name: {req: false},
                slug: {req: false, len: false},
                import: {type: false},
                logo: {type:null, size: null},
                login: {type:null, size: null},
                buddyLabel: {
                    size: false
                },
                badgeLabel: {
                    size: false
                }
            };
        };
        resetVal();

        var checkSlug = function () {
            return $q(function (resolve, reject) {
                $http.post(authService.apiUrl + '/clients/check-slug', {
                        slug: $scope.client.slug
                    })
                    .success(function (result) {
                        $scope.client.slug = result.slug;
                        orgSlug = $scope.client.slug;
                        resolve();
                    })
                    .error(reject);
            });
        };

        var nameTimeoutId = 0;
        var timeCheckSlug = function () {
            clearTimeout(nameTimeoutId);
            nameTimeoutId = setTimeout(function () {
                checkSlug();
            }, 750);
        };

        $scope.nameKey = function () {
            if (orgSlug) return;

            $scope.client.slug = $scope.client.name.toLowerCase()
                .replace(/\s/g, '')
                .replace(/[^0-9a-z]/g, '');
            timeCheckSlug();
        };
        $scope.slugChange = function () {
            if (!$scope.client.slug || orgSlug === $scope.client.slug) return;
            timeCheckSlug();
        };


        $scope.submit = function (e) {
            e.preventDefault();
            resetVal();
            var isValid = true;

            if (!$scope.client.name) {
                $scope.val.name.req = true;
                isValid = false;
            }
            if (!$scope.client.slug) {
                $scope.val.slug.req = true;
                isValid = false;
            }
            else if ($scope.client.slug.length < 3) {
                $scope.val.slug.len = true;
                isValid = false;
            }
            else if ($scope.client.slug !== orgSlug) {
                checkSlug();
            }
            if($scope.client.buddyLabel && $scope.client.buddyLabel.length > 15){
                $scope.val.buddyLabel.size = true;
                isValid = false;
            }
            if($scope.client.badgeLabel && $scope.client.badgeLabel.length > 15){
                $scope.val.badgeLabel.size = true;
                isValid = false;
            }

            if (!isValid){
                $rootScope.scrollToError();
                return;
            }

            $scope.isLoading = true;
            if ($scope.client.id > 0) {
                $http.put(authService.apiUrl + '/clients/' + $scope.client.id, $scope.client)
                    .success(function () {
                        $window.location = '/admin/clients/' + $scope.client.id;
                    })
                    .error(function (err) {
                        if (err.type == 'seatsValidation') {
                            $scope.showSeatsValidationNotification(err.message);
                        }
                        $scope.isLoading = false;
                    });
            }
            else {
                $http.post(authService.apiUrl + '/clients', $scope.client)
                    .success(function (client) {
                        $window.location = '/admin/clients/' + client.id;
                    })
                    .error(function (err) {
                        if (err.type == 'seatsValidation') {
                            $scope.showSeatsValidationNotification(err.message);
                        }
                        $scope.isLoading = false;
                    });
            }

        };

        $scope.showSeatsValidationNotification = function (msg) {
            $modal.open({
                templateUrl: 'infoModal.html',
                controller: infoModalControllerObj.infoModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Cannot lower client\'s allotted seats',
                            text: msg,
                            okLabel: 'OK'
                        }
                    }
                }
            });
        };

        $scope.importUsers = function (files) {
            resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            var r = /(\.csv)$/;
            if (!r.test(file.name.toLowerCase())) {
                $scope.val.import.type = true;
                return;
            }

            $scope.busy = true;
            $scope.showLoadingOverlay = true;
            $upload.upload({
                    url: authService.apiUrl + '/clients/' + $scope.client.id + '/users/import',
                    file: file
                })
                .success(function (result) {
                    $scope.showLoadingOverlay = false;
                    var reload = function () {
                        if (result.status !== 'ok' || result.imported <= 0) return;
                        $('#usersDataTable').DataTable().ajax.reload();
                    };

                    $modal.open({
                        templateUrl: 'importStatus.html',
                        controller: 'ClientImportStatusController',
                        size: 'lg',
                        resolve: {
                            result: function () {
                                return result
                            }
                        }
                    }).result.then(reload, reload)
                }).error(function (err) {
                $scope.showLoadingOverlay = false;
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Error during bulk upload, operation aborted!',
                                text: err,
                                okLabel: 'OK'
                            }
                        }
                    }
                });
            });

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
                            title: 'Remove User from Client',
                            text: 'You are about to remove the user <strong>' + user.firstName + ' ' + user.lastName + '</strong> from the client <strong>' + $scope.client.name + '</strong>.<br><br>Are you sure?',
                            okLabel: 'OK',
                            cancelLabel: 'Cancel'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.delete(authService.apiUrl + '/clients/' + $scope.client.id + '/users/' + user.id)
                        .success(function () {
                            $scope.users.splice(index, 1);
                            $scope.dtInstance.reloadData();
                        });
                });

        };

        $scope.uploadLogoImage = function (files) {
            if (!files || files.length <= 0) return;
            var file = files[0];

            resetVal();

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.val.logo.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.val.logo.size = true;
                return;
            }

            $scope.busy = true;
            $scope.logoLoading = true;

            $upload.upload({
                url: authService.apiUrl + '/ui',
                fields: {sizes: [100, 250, 600]},
                file: file
            })
                .success(function (data) {
                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.client.logoImageUrl = data.url;
                            $scope.logoLoading = false;
                            $scope.client.logoAlignment = 'left';
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url;
                });
        };

        $scope.removeLogoImage = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.client.logoImageUrl = null;
        };

        $scope.uploadLoginImage = function (files) {
            if (!files || files.length <= 0) return;
            var file = files[0];

            resetVal();

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.val.login.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.val.login.size = true;
                return;
            }

            $scope.busy = true;
            $scope.loginImageLoading = true;

            $upload.upload({
                    url: authService.apiUrl + '/ui',
                    fields: {sizes: [100, 250, 600]},
                    file: file
                })
                .success(function (data) {
                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.client.loginImageUrl = data.url;
                            $scope.loginImageLoading = false;
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url;
                });
        };

        $scope.removeLoginImage = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.client.loginImageUrl = null;
        };
    }]);


module.controller('ClientImportStatusController', ['$scope', '$modalInstance', 'result',
    function ($scope, $modalInstance, result) {
        $scope.result = result;
        $scope.ok = function () {
            $modalInstance.dismiss();
        };
    }]);
