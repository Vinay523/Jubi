'use strict';

var controllers = angular.module('Jubi.controllers');


controllers.controller('AuthoringSuiteProgramTodoManagementController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', '$window', 'authService', 'helperService', 'controllerState',
    function ($scope, $http, $timeout, $q, $modal, $upload, $window, authService, helpers, controllerState) {

        $scope.program = null;
        $scope.todos = null;
        $scope.canEditEntity = helpers.canEditEntity;
        $scope.canEditTodoEntity = function(todo, program){
            if(todo && _.filter(todo.requirements, function(r){return r.id}).length == 0) {
                return true;
            }else{
                return $scope.canEditEntity(todo, program);
            }
        };

        controllerState.scope($scope);
        controllerState.otherwise('todos');
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

        $scope.revert = function (e) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/todos';
        };


        var toWorkTodos = function (todos) {
            $scope.todos = [];
            _.each(todos, function (todo) {
                var newTodo = {
                    id: todo.id,
                    publishedAt: todo.publishedAt,
                    title: todo.title,
                    instructions: todo.instructions,
                    validate: todo.validate,
                    verificationInstructions: todo.verificationInstructions,
                    points: todo.points ? todo.points.toString() : null,
                    due: {
                        byUser: todo.dueByUser,
                        byAuthor: (!todo.dueByUser && todo.dueDate) ? true : false,
                        date: todo.dueDate,
                        open: false
                    },
                    resource: {
                        url: todo.resourceUrl,
                        name: todo.resourceName,
                        description: todo.resourceDescription,
                        uploading: false
                    },
                    requirements: angular.copy(todo.requirements),
                    expanded: false,
                    val: {
                        title: {req: false},
                        resource: {type: false, size: false}
                    },
                    verifications: []
                };
                _.each(todo.challenges, function (challenge) {
                    if (challenge.title == 'Todo Verification') {
                        var newVerification = {
                            custom: true,
                            challenge: {
                                type: 'general',
                                title: challenge.title,
                                instructions: null,
                                finishText: null,
                                notes: null,
                                canUploadContent: true,
                                sequence: null,
                                points: null,
                                todoId: todo.id,
                                questions: [{
                                    question: challenge.questions[0].question
                                }]
                            }
                        };

                        newTodo.verifications.push(newVerification);
                    } else {
                        newTodo.allowUserMediaUpload = true;
                    }
                });
                $scope.todos.push(newTodo);
            });
        };
        var toProgramTodos = function (todos) {
            var programTodos = [];
            _.each(todos, function (todo) {
                var newTodo = {
                    id: todo.id,
                    title: todo.title,
                    instructions: todo.instructions,
                    points: todo.points,
                    publishedAt: todo.publishedAt,
                    validate: todo.validate,
                    verificationInstructions: todo.verificationInstructions,
                    dueByUser: todo.due.byUser,
                    dueDate: (todo.due.byAuthor && todo.due.date) ? todo.due.date : null,
                    resourceUrl: todo.resource.url,
                    resourceName: todo.resource.name,
                    resourceDescription: todo.resource.description,
                    requirements: angular.copy(todo.requirements)
                };

                newTodo.challenges = [];
                _.each(todo.verifications, function (verification) {
                    if (verification.challenge) {
                        newTodo.challenges.push(verification.challenge);
                    }
                });

                if (todo.allowUserMediaUpload) {
                    newTodo.challenges.push($scope.mediaChallengeTemplate);
                }
                newTodo.challenges.push($scope.feedbackChallengeTemplate);

                programTodos.push(newTodo);
            });
            $scope.program.todos = programTodos;
        };

        $scope.mediaChallengeTemplate = {
            type: 'general',
            title: 'Todo Media Upload',
            instructions: null,
            finishText: null,
            notes: null,
            canUploadContent: true,
            sequence: null,
            points: null,
            todoId: null
        };

        $scope.feedbackChallengeTemplate = {
            type: 'general',
            title: 'Todo Feedback',
            instructions: null,
            finishText: null,
            notes: null,
            canUploadContent: true,
            sequence: null,
            points: null,
            todoId: null
        };

        var load = function (slug, restore) {
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

                        $scope.predefinedVerificationQuestions = $scope.program.todoVerificationQuestionTemplates;
                        $scope.predefinedVerificationQuestions.push({
                            id: 'custom',
                            value: 'Custom'
                        });
                        $scope.setSelectedProgram($scope.program);
                        toWorkTodos($scope.program.todos);
                        $scope.resetVal();
                        $scope.stopLoading();
                        resolve(program);
                    })
                    .error(function (err) {
                        reject(err);
                    });
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
                    toProgramTodos($scope.todos);
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


        this.init = function (slug, restore) {
            load(slug, restore).then(function () {
                controllerState.route();
            });
        };

        $scope.restore = function (e, history) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/todos?restore=' + history.programId;
        };

        $scope.closeMenus = function (except) {
            _.each($scope.todos, function (todo) {
                if (todo !== except)
                    todo.menuOpen = false;
            });
        };

        $scope.offClick = function (e) {
            e.stopPropagation();
            $scope.closeMenus();
        };

        $scope.resetVal = function () {
            _.each($scope.todos, function (todo) {
                todo.val = {
                    title: {req: false},
                    points: {fmt: false},
                    dueDate: {req: false},
                    resource: {type: false, size: false}
                };
            });
        };


        var validate = function (silent) {

            var isValid = true;
            if (!silent) {
                $scope.resetVal();
            }

            _.each($scope.todos, function (todo) {
                if (!todo.title || todo.title.trim().length <= 0) {
                    if (!silent) {
                        todo.val.title.req = true;
                        todo.expanded = true;
                    }
                    isValid = false;
                }
                if (todo.points && todo.points.trim().length > 0) {
                    if (!helpers.validInteger(todo.points)) {
                        if (!silent) {
                            todo.val.points.fmt = true;
                            todo.expanded = true;
                        }
                        isValid = false;
                    }
                    else {
                        var i = parseInt(todo.points);
                        if (i < 1 || i > 1000) {
                            if (!silent) {
                                todo.val.points.range = true;
                                todo.expanded = true;
                            }
                            isValid = false;
                        }
                    }
                }
                if (todo.due.byAuthor && !todo.due.date) {
                    if (!silent) {
                        todo.val.dueDate.req = true;
                        todo.expanded = true;
                    }
                    isValid = false;
                }
            });

            return isValid;
        };


        $scope.$on('previewProgramTiles', function (e) {
            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user?preview=true'
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/todos';

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
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/todos';

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

                toProgramTodos($scope.todos);

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
                                toWorkTodos($scope.program.todos);
                                $scope.resetVal();
                                $scope.isSaving = false;
                                resolve(program);
                            }
                        }
                        else {
                            $scope.program = program;
                            toWorkTodos($scope.program.todos);
                            $scope.resetVal();
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
                        $http.post(authService.apiUrl + '/programs/remove-autosaved', {linkId: $scope.program.linkId}).then(function () {
                            $scope.programEditFrm.$setPristine();
                            e.preventDefault();
                            e.stopPropagation();
                            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/todos'
                        });
                    });
            } else {
                e.preventDefault();
                e.stopPropagation();
                $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/todos'
            }
        }
    }
]);

controllers.controller('AuthoringSuiteProgramTodosController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', 'authService', 'helperService', 'controllerState',
    function ($scope, $http, $timeout, $q, $modal, $upload, authService, helpers, controllerState) {

        controllerState.state('todos', {
            url: '/todos'
        });

        $scope.toggleMenu = function (e, todo) {
            e.stopPropagation();
            $scope.closeMenus(todo);
            todo.menuOpen = !todo.menuOpen;
        };
        $scope.toggleTodo = function (e, todo) {
            e.stopPropagation();
            $scope.closeMenus();
            todo.expanded = !todo.expanded;
        };

        $scope.addTodo = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.todos.push({
                id: new Date().getTime(),
                title: null,
                instructions: null,
                points: null,
                due: {
                    byUser: true,
                    byAuthor: false,
                    date: null,
                    open: false
                },
                resource: {
                    url: null,
                    name: null,
                    description: null,
                    uploading: false
                },
                requirements: [],
                expanded: true,
                val: {
                    title: {req: false},
                    resource: {type: false, size: false}
                },
                verifications: []
            });
            $scope.programEditFrm.$setDirty();
        };
        $scope.todoEdit = function (e, todo, index) {
            e.preventDefault();
            $scope.closeMenus();
            controllerState.go('todoEdit', {
                todo: todo,
                todoIndex: index
            });
        };
        $scope.duplicateTodo = function (e, todo, index) {
            e.preventDefault();
            e.stopPropagation();
            $scope.closeMenus();

            var copy = angular.copy(todo);
            copy.id = new Date().getTime();
            copy.menuOpen = false;
            copy.requirements = [];
            copy.publishedAt = null;
            copy.slug = null;

            $scope.todos.push(copy);
            $scope.programEditFrm.$setDirty();
        };
        $scope.removeTodo = function (e, index, todo) {
            if (!$scope.canEditEntity(todo, $scope.program)) {
                return $scope.cancelEvent(e);
            }

            e.preventDefault();
            e.stopPropagation();
            $scope.closeMenus();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove To-do?',
                            text: 'You are about to remove the selected to-do. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }

            }).result.then(
                function () {
                    $scope.todos.splice(index, 1);
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

        $scope.todoReqSummary = function (todo) {
            if (todo.requirements.length <= 0) return 'No requirements set.';
            if (todo.requirements[0].requirementRef === 'Quest') {
                var quest = findQuest(todo.requirements[0].requirementRefId);
                return quest ? 'Part of quest ' + quest.title + '.' : 'No requirements set.';
            }
            if (todo.requirements[0].requirementRef === 'Level') {
                var level = _.find($scope.program.levels, function (l) {
                    return l.id === todo.requirements[0].requirementRefId;
                });
                return level ? 'Part of level ' + level.title + '.' : 'No requirements set.';
            }
            return 'No requirements set.';
        };
        $scope.todoPointSummary = function (todo) {
            if (todo.points && todo.points > 0) {
                if (todo.points == 1) return 'Awards 1 point once verified.';
                return 'Awards ' + todo.points + ' points once verified.'
            }
            return null;
        };
    }]);

controllers.controller('AuthoringSuiteProgramTodoEditController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', 'authService', 'helperService', 'controllerState',
    function ($scope, $http, $timeout, $q, $modal, $upload, authService, helpers, controllerState) {
        $scope.todo = null;
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
            if (!$scope.program || params.todoIndex >= $scope.todos.length) {
                controllerState.go('todos');
                return;
            }
            resetVal();
            $scope.todo = (params && params.todo) ? params.todo : $scope.todos[Number(params.todoIndex)];

            $scope.quests = [];
            _.each($scope.program.quests, function (q) {
                var qi = {
                    id: q.id,
                    title: q.title,
                    publishedAt: q.publishedAt,
                    available: true,
                    selected: _.find($scope.todo.requirements, function (r) {
                        return r.requirementRef === 'Quest' && r.requirementRefId === q.id
                    }) != null
                };
                $scope.quests.push(qi);
            });

            $scope.levels = [];
            _.each($scope.program.levels, function (l) {
                var li = {
                    id: l.id,
                    title: l.title,
                    available: true,
                    selected: _.find($scope.todo.requirements, function (r) {
                        return r.requirementRef === 'Level' && r.requirementRefId === l.id
                    }) != null,
                    quests: []
                };

                $scope.levels.push(li);


                _.each(l.quests, function (q) {
                    var qi = {
                        id: q.id,
                        title: q.title,
                        publishedAt: q.publishedAt,
                        available: true,
                        selected: _.find($scope.todo.requirements, function (r) {
                            return r.requirementRef === 'Quest' && r.requirementRefId === q.id
                        }) != null
                    };
                    li.quests.push(qi);
                });
            });
        };

        controllerState.state('todoEdit', {
            url: '/todo/:todoIndex',
            parent: 'todos',
            onEnter: initState
        });

        $scope.selectByUser = function (todo) {
            if (todo.due.byUser) {
                todo.due.byUser = false;
                todo.due.byAuthor = true;
            }
            else {
                todo.due.byUser = true;
                todo.due.byAuthor = false;
            }
            $scope.programEditFrm.$setDirty();
        };
        $scope.selectByAuthor = function (todo) {
            if (todo.due.byAuthor) {
                todo.due.byAuthor = false;
                todo.due.byUser = true;
            }
            else {
                todo.due.byAuthor = true;
                todo.due.byUser = false;
            }
            $scope.programEditFrm.$setDirty();
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

        $scope.uploadDownloadContent = function (files, todo) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check size
            if (file.size > helpers.maxFileSize) {
                todo.val.resource.size = true;
                return;
            }

            $scope.busy = true;
            todo.resource.uploading = true;

            $upload.upload({url: authService.apiUrl + '/ur', file: file})
                .success(function (data) {
                    todo.resource.name = file.name;
                    todo.resource.url = data.url;
                    todo.resource.description = null;

                    $scope.programEditFrm.$setDirty();

                    $timeout(function () {
                        todo.resource.uploading = false;
                        $scope.busy = false;
                    }, 300);
                });
        };

        $scope.removeDownloadContent = function (e, todo) {
            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Content?',
                            text: 'You are about to remove the download content. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    todo.resource.url = null;
                    todo.resource.name = null;
                    todo.resource.description = null;
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

        $scope.toggleQuest = function (todo, quest) {
            if (!quest.available) return;
            if (!$scope.canEditTodoEntity(todo, $scope.program)) return;
            if (!helpers.canEditEntity(quest, $scope.program)) return;
            var sel = !quest.selected;
            clearAll();
            quest.selected = sel;
            if (quest.selected) {
                todo.requirements = [{
                    requirementRef: 'Quest',
                    requirementRefId: quest.id
                }];
            }
            else todo.requirements = [];
            $scope.programEditFrm.$setDirty();
        };
        $scope.toggleLevel = function (todo, level) {
            if (!level.available) return;
            if (!$scope.canEditTodoEntity(todo, $scope.program)) return;
            if ($scope.levelHasLockedContent(level)) return;


            var sel = !level.selected;
            clearAll();
            level.selected = sel;
            if (level.selected) {
                todo.requirements = [{
                    requirementRef: 'Level',
                    requirementRefId: level.id
                }];
            }
            else todo.requirements = [];
            $scope.programEditFrm.$setDirty();
        };


        $scope.addVerification = function () {
            $scope.todo.verifications.push({
                customQuestion: null,
                predefinedQuestionId: null
            });
            $scope.programEditFrm.$setDirty();
        };

        $scope.removeVerification = function (verification) {
            $scope.todo.verifications = _.without($scope.todo.verifications, verification);
            $scope.programEditFrm.$setDirty();
        };

        $scope.predefinedQuestionSelected = function (verification) {
            if (verification.predefinedQuestionId == 'custom') {
                $scope.addChallenge(verification, null);
            } else {
                var question = _.findWhere($scope.predefinedVerificationQuestions, {id: verification.predefinedQuestionId});
                $scope.addChallenge(verification, question.value);
            }
            verification.custom = true;
            $scope.programEditFrm.$setDirty();
        };

        $scope.addChallenge = function (verification, question) {
            var challenge = {
                type: 'general',
                title: 'Todo Verification',
                instructions: null,
                finishText: null,
                notes: null,
                canUploadContent: true,
                sequence: null,
                points: null,
                todoId: $scope.todo.id,
                questions: [{
                    question: question
                }]
            };

            verification.challenge = challenge;
        };

    }]);


