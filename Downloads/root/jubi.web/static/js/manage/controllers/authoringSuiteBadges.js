'use strict';

var controllers = angular.module('Jubi.controllers');


controllers.controller('AuthoringSuiteProgramBadgeManagementController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', '$window', 'authService', 'helperService', 'controllerState',
    function ($scope, $http, $timeout, $q, $modal, $upload, $window, authService, helpers, controllerState) {

        $scope.program = null;
        $scope.canEditEntity = helpers.canEditEntity;

        controllerState.scope($scope);
        controllerState.otherwise('badges');
        controllerState.onEnter = function (state) {
            $timeout(function () {
                $scope.inState = state;
            });
        };

        window.onbeforeunload = function (e) {
            if ($scope.programEditFrm.$dirty) {
                return 'There are unsaved changes on this page!'
            }
        };

        var resetVal = function () {
            _.each($scope.program.badges, function (badge) {
                badge.val = {
                    title: {req: false}
                }
            });
        };

        $scope.$on('autoSaveNow', function () {
            $scope.autoSaveNow();
        });

        $scope.$watch(function () {
            return validate(true);
        }, function () {
            $scope.autoSaveNow();
        }, true);

        $scope.autoSaveNow = function () {
            if (validate(true)) {
                if (!$scope.restoreId && $scope.programEditFrm.$dirty) {
                    $scope.autoSave($scope.program).then(function (program) {
                        $scope.program.createdAt = program.createdAt;
                        $scope.program.history = program.history;
                        $scope.program.version = program.version;
                        $scope.program.id = program.id;
                        $scope.program.status = program.status;
                        $scope.program.published = program.published;
                    });
                }
            }
        };

        var load = function (slug, restore) {
            if($scope.badgeLabel){
                document.title = $scope.getBadgeLabel(true) + "s | Powered By: Jubi";
            }
            return $q(function (resolve, reject) {
                $scope.restoreId = Number(restore);
                var url = authService.apiUrl + '/programs/' + slug;
                if (restore > 0) url += ('?restore=' + restore);
                $scope.loading.isLoading++;
                $http.get(url)
                    .success(function (program) {
                        if (program.description) program.description = program.description.replace(/\n/g, '<br>');
                        $scope.program = program;


                        //Call to set program mode based on version
                        helpers.canEditEntity({}, program);

                        $scope.setSelectedProgram($scope.program);
                        resetVal();
                        $scope.stopLoading();
                        resolve(program);
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };

        this.init = function (slug, restore) {
            load(slug, restore).then(function () {
                controllerState.route();
            });
        };

        $scope.restore = function (e, history) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/badges?restore=' + history.programId;
        };

        $scope.revert = function (e) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/badges';
        };

        var validate = function (silent) {

            if (!$scope.program) return false;

            var isValid = true;

            if (!silent) {
                resetVal();
            }

            _.each($scope.program.badges, function (badge) {
                if (!badge.title || badge.title.trim().length <= 0) {
                    if (!silent) {
                        badge.val.title.req = true;
                    }
                    isValid = false;
                }
            });

            return isValid;
        };

        $scope.$on('previewProgramTiles', function (e) {
            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/badges';

                    if ($window.location.hash) {
                        url += '&previewRetHash=' + $window.location.hash.replace('#', '');
                    }
                    $window.location = url;
                });
        });


        $scope.preview = function (e) {
            e.preventDefault();
            e.stopPropagation();

            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user/program/' + program.slug + '/quests?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/badges';

                    if ($window.location.hash) {
                        url += '&previewRetHash=' + $window.location.hash.replace('#', '');
                    }

                    $window.location = url;
                });
        };

        $scope.submit = function (e, status, publish) {
            e.preventDefault();

            return $q(function (resolve, reject) {

                if (!validate()) return resolve($scope.program);

                $scope.program.status = status ? status : 'ready';

                //If the program is being published, add the publish date, otherwise remove the publish date publish doesn't carry over from one version to the next
                if (publish) {
                    $scope.program.published = (new Date()).toISOString();
                } else {
                    $scope.program.published = null;
                }

                $scope.isSaving = true;
                $scope.programEditFrm.$setPristine();

                $http.post(authService.apiUrl + '/programs/', $scope.program)
                    .success(function (program) {
                        //If status is preview then we dont need to initialize the UI again because we will be redirected
                        if (!(status == 'preview')) {
                            if ($scope.restoreId > 0) {
                                $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/badges';
                            } else {
                                $scope.program = program;
                                $scope.isSaving = false;
                                resolve(program);
                            }
                        }
                        else {
                            $scope.program = program;
                            $scope.isSaving = false;
                            resolve(program);
                        }
                    });
            });
        };

        $scope.cancel = function (e) {
            if ($scope.program.status == 'autoSaved') {
                $modal.open({
                    templateUrl: 'confirmModal.html',
                    controller: confirmModalControllerObj.confirmModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cancel changes?',
                                text: 'You are about to cancel your changes. Any AutoSaved versions will be removed. Are you sure?',
                                ok: 'Yes', cancel: 'No'
                            }
                        }
                    }

                }).result.then(
                    function () {
                        $http.post(authService.apiUrl + '/programs/remove-autosaved', {linkId: $scope.program.linkId}).then(function(){
                            $scope.programEditFrm.$setPristine();
                            e.preventDefault();
                            e.stopPropagation();
                            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/badges'
                        });

                    });
            }else{
                e.preventDefault();
                e.stopPropagation();
                $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/badges'
            }
        }

    }]);

controllers.controller('AuthoringSuiteProgramBadgesController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', 'authService', 'helperService', 'controllerState',
    function ($scope, $http, $timeout, $q, $modal, $upload, authService, helpers, controllerState) {

        controllerState.state('badges', {
            url: '/badges'
        });

        var closeMenus = function (except) {
            _.each($scope.program.badges, function (badge) {
                if (badge !== except)
                    badge.menuOpen = false;
            });
        };
        $scope.offClick = function (e) {
            e.stopPropagation();
            closeMenus();
        };
        $scope.toggleBadgeMenu = function (e, badge) {
            e.stopPropagation();
            closeMenus(badge);
            badge.menuOpen = !badge.menuOpen;
        };

        $scope.addBadge = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.program.badges.push({
                id: new Date().getTime(),
                title: null,
                description: null,
                image: null,
                requirements: []
            });
            $scope.programEditFrm.$setDirty();
        };
        var validate = function (silent) {

            if (!$scope.program) return false;

            var isValid = true;

            if (!silent) {
                resetVal();
            }

            _.each($scope.program.badges, function (badge) {
                if (!badge.title || badge.title.trim().length <= 0) {
                    if (!silent) {
                        badge.val.title.req = true;
                    }
                    isValid = false;
                }
            });

            return isValid;
        };
        $scope.badgeEdit = function (e, badge, index) {
            e.preventDefault();
            closeMenus();
                         
                if (validate(true)) {
                    controllerState.go('badgeEdit', {
                        badge: badge,
                        badgeIndex: index
                    });
            }
                else {
                    _.each($scope.program.badges, function (badge) {
                        if (!badge.title || badge.title.trim().length <= 0) {
                            badge.val = {
                                title: { req: true }
                            }
                        }
                    });
                }
                 
        };
        $scope.duplicateBadge = function (e, badge, index) {
            e.preventDefault();
            e.stopPropagation();
            closeMenus();

            var copy = angular.copy(badge);
            badge.id = new Date().getTime();
            copy.menuOpen = false;
            copy.requirements = [];
            copy.publishedAt = null;
            copy.slug = null;
            $scope.program.badges.push(copy);
            $scope.programEditFrm.$setDirty();

        };
        $scope.removeBadge = function (e, index, badge) {
            if(!$scope.canEditEntity(badge, $scope.program)){
                return $scope.cancelEvent(e);
            }

            e.preventDefault();
            e.stopPropagation();
            closeMenus();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Badge?',
                            text: 'You are about to remove the selected badge. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }

            }).result.then(
                function () {
                    $scope.program.badges.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });

        };

        var findQuest = function (id) {
            var quest = _.find($scope.program.quests, function (q) {
                return q.id === id;
            });
            if (quest) return quest;

            for (var i = 0; i < $scope.program.levels.length; i++) {
                for (var j = 0; j < $scope.program.levels[i].quests.length; j++) {
                    if ($scope.program.levels[i].quests[j].id == id) return $scope.program.levels[i].quests[j];
                }
            }
        };

        $scope.badgeReqSummary = function (badge) {
            if (badge.requirements.length <= 0) return 'No requirements set.';
            if (badge.requirements[0].requirementRef === 'Quest') {
                var quest = findQuest(badge.requirements[0].requirementRefId);
                return quest ? 'Awarded when quest ' + quest.title + ' is completed.' : 'No requirements set.';
            }
            if (badge.requirements[0].requirementRef === 'Level') {
                var level = _.find($scope.program.levels, function (l) {
                    return l.id === badge.requirements[0].requirementRefId;
                });
                return level ? 'Awarded when level ' + level.title + ' is completed.' : 'No requirements set.';
            }
            return 'No requirements set.';
        };
    }]);

controllers.controller('AuthoringSuiteProgramBadgeEditController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', 'authService', 'helperService', 'controllerState',
    function ($scope, $http, $timeout, $q, $modal, $upload, authService, helpers, controllerState) {

        $scope.badge = null;
        $scope.uploadingImage = false;

        $scope.quests = [];
        $scope.levels = [];

        var resetVal = function () {
            $scope.val = {
                title: {req: false},
                image: {type: false, size: false}
            }
        };

        var initState = function (state, params) {
            if (!$scope.program || params.badgeIndex >= $scope.program.badges.length) {
                controllerState.go('badges');
                return;
            }
            resetVal();
            $scope.badge = (params && params.badge) ? params.badge : $scope.program.badges[Number(params.badgeIndex)];

            $scope.quests = [];
            _.each($scope.program.quests, function (q) {
                var qi = {
                    id: q.id,
                    title: q.title,
                    available: true,
                    selected: false,
                    publishedAt: q.publishedAt
                };
                $scope.quests.push(qi);

                for (var i = 0; i < $scope.program.badges.length; i++) {
                    var badge = $scope.program.badges[i];
                    if (_.find(badge.requirements, function (r) {
                            return r.requirementRef === 'Quest' && r.requirementRefId === q.id
                        })) {
                        qi.selected = ($scope.badge.id === badge.id);
                        qi.available = qi.selected;
                        break;
                    }
                }
            });

            $scope.levels = [];
            _.each($scope.program.levels, function (l) {
                var li = {
                    id: l.id,
                    title: l.title,
                    available: true,
                    selected: false,
                    quests: []
                };
                $scope.levels.push(li);

                for (var i = 0; i < $scope.program.badges.length; i++) {
                    var badge = $scope.program.badges[i];
                    if (_.find(badge.requirements, function (r) {
                            return r.requirementRef === 'Level' && r.requirementRefId === l.id
                        })) {
                        li.selected = ($scope.badge.id === badge.id);
                        li.available = li.selected;
                        break;
                    }
                }

                _.each(l.quests, function (q) {
                    var qi = {
                        id: q.id,
                        title: q.title,
                        available: true,
                        selected: false,
                        publishedAt: q.publishedAt
                    };
                    li.quests.push(qi);

                    for (var i = 0; i < $scope.program.badges.length; i++) {
                        var badge = $scope.program.badges[i];
                        if (_.find(badge.requirements, function (r) {
                                return r.requirementRef === 'Quest' && r.requirementRefId === q.id
                            })) {
                            qi.selected = ($scope.badge.id === badge.id);
                            qi.available = qi.selected;
                            break;
                        }
                    }

                });
            });
        };

        controllerState.state('badgeEdit', {
            url: '/badge/:badgeIndex',
            parent: 'badges',
            onEnter: initState
        });

        $scope.removeBadgeImage = function () {
            resetVal();
            $scope.badge.imageUrl = null;
            $scope.programEditFrm.$setDirty();
        };
        $scope.uploadBadgeImage = function (files) {
            resetVal();

            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.image.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.image.size = true;
                return;
            }

            $scope.busy = true;
            $scope.uploadingImage = true;

            $upload.upload({
                url: authService.apiUrl + '/ui/square',
                fields: {sizes: [100, 250, 600]},
                file: file
            })
                .success(function (data) {
                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.badge.imageUrl = data.url;
                            $scope.uploadingImage = null;
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url + '/250x250';
                    $scope.programEditFrm.$setDirty();
                });
        };

        var clearAll = function () {
            _.each($scope.quests, function (q) {
                if (!q.available) return;
                q.selected = false;
            });
            _.each($scope.levels, function (l) {
                if (!l.available) return;
                l.selected = false;
                _.each(l.quests, function (q) {
                    if (!q.available) return;
                    q.selected = false;
                });
            });
        };

        $scope.levelHasLockedContent = function (level) {
            var hasLockedContent = false;
            _.each(level.quests, function (quest) {
                if (!helpers.canEditEntity(quest, $scope.program)) {
                    hasLockedContent = true;
                }
            });

            return hasLockedContent;
        };

        $scope.toggleQuest = function (badge, quest) {
            if (!quest.available) return;
            if(!helpers.canEditEntity(badge, $scope.program)) return;
            if(!helpers.canEditEntity(quest, $scope.program)) return;
            var sel = !quest.selected;
            clearAll();
            quest.selected = sel;
            if (quest.selected) {
                badge.requirements = [{
                    requirementRef: 'Quest',
                    requirementRefId: quest.id
                }];
            }
            else badge.requirements = [];
            $scope.programEditFrm.$setDirty();
        };
        $scope.toggleLevel = function (badge, level) {
            if (!level.available) return;
            if($scope.levelHasLockedContent(level)) return;
            var sel = !level.selected;
            clearAll();
            level.selected = sel;
            if (level.selected) {
                badge.requirements = [{
                    requirementRef: 'Level',
                    requirementRefId: level.id
                }];
            }
            else badge.requirements = [];
            $scope.programEditFrm.$setDirty();
        };
    }]);

