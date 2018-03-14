'use strict';

var controllers = angular.module('Jubi.controllers');

var fitToContent = function (id, maxHeight) {
    var text = id && id.style ? id : document.getElementById(id);
    if (!text) return;

    var adjustedHeight = text.clientHeight;
    if (!maxHeight || maxHeight > adjustedHeight) {
        adjustedHeight = Math.max(text.scrollHeight, adjustedHeight);
        if (maxHeight)
            adjustedHeight = Math.min(maxHeight, adjustedHeight);
        if (adjustedHeight > text.clientHeight)
            text.style.height = adjustedHeight + "px";
    }
};

controllers.controller('AuthoringSuiteHomeController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', '$window', 'authService', 'helperService',
    function ($scope, $http, $timeout, $q, $modal, $upload, $window, authService, helpers) {
        $scope.canEditEntity = helpers.canEditEntity;
        $scope.programs = null;
        $scope.inAddProgram = false;
        $scope.programLoading = false;
        $scope.busy = false;
        $scope.model = {
            title: null,
            description: null,
            imageUrl: null,
            slug: null
        };
        $scope.slug = {
            clientId: authService.user.clients[0].id,
            checking: false,
            server: null,
            edit: false,
            value: null
        };


        var resetVal = function () {
            $scope.val = {
                title: {
                    req: false,
                    dup: false
                },
                slug: {req: false},
                image: {
                    size: false,
                    type: false
                }
            }
        };
        resetVal();

        $scope.$timeout = $timeout; 

        var init = function () {
            $scope.slug.server = $window.location.protocol + '//' + $window.location.host;

            $scope.removeSelectedProgram();
            return $q(function (resolve, reject) {
                $scope.loading.isLoading++;
                $http.get(authService.apiUrl + '/programs/all')
                    .success(function (programs) {
                        $scope.stopLoading();
                        resolve(programs);
                    })
                    .error(function (err) {
                        reject(err);
                    })
            });
        };
        init().then(function (programs) {
            $scope.programs = programs;
        });

        $scope.$on('previewProgramTiles', function () {
            $window.location = '/user?preview=true&previewRet=' + encodeURIComponent($window.location.hash.replace('#', ''));
        });

        $scope.addProgram = function (e) {
            e.preventDefault();
            $scope.model = {
                name: null,
                slug: null,
                description: null,
                imageUrl: null
            };
            $scope.slug.checking = false;
            $scope.slug.direct = false;
            resetVal();
            $scope.inAddProgram = true;
        };
        $scope.cancelAddProgram = function () {
            $scope.inAddProgram = false;
        };
        $scope.submitAddProgram = function (e) {
            e.preventDefault();

            if (!$scope.model.title) {
                $scope.val.title.req = true;
                return;
            } else {
                $scope.val.title.req = false;
            }
            var existingProgramWithSameName = _.findWhere($scope.programs, {title: $scope.model.title});
            if (existingProgramWithSameName){
                $scope.val.title.dup = true;
                return
            } else {
                $scope.val.title.dup = false;
            }

            $scope.programLoading = true;
            $scope.inAddProgram = false;
            $http.post(authService.apiUrl + '/programs/create', $scope.model)
                .success(function () {
                    init().then(function (programs) {
                        $scope.programs = programs;
                        $timeout(function () {
                            $scope.programLoading = false;
                        }, 300);
                    });
                });
        };

        $scope.uploadProgramImage = function (files) {
            resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            $scope.val.image.size = false;
            $scope.val.image.type = false;

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.val.image.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.val.image.size = true;
                return;
            }

            $scope.busy = true;
            $scope.imageLoading = 'program';

            $upload.upload({
                    url: authService.apiUrl + '/ui/square',
                    fields: {sizes: [100, 250, 600]},
                    file: file
                })
                .progress(function (e) {
                    /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                     console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                })
                .success(function (data) {

                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.model.imageUrl = data.url;
                            $scope.imageLoading = null;
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url + '/600x600';

                });
        };

        $scope.duplicateProgram = function (e, program) {
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Duplicate Program?',
                            text: 'You are about to create a copy of the selected program and all it\'s associated quests. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.post(authService.apiUrl + '/programs/duplicate', {programId: program.id})
                        .success(function (program) {
                            $window.location.reload();
                        });
                });
        };

        $scope.removeProgram = function (e, program) {
            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Program?',
                            text: 'You are about to remove the selected program and all it\'s associated quests. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $scope.programLoading = true;
                    $http.delete(authService.apiUrl + '/programs/' + program.linkId)
                        .success(function (program) {
                            init().then(function (programs) {
                                $scope.programs = programs;
                                $timeout(function () {
                                    $scope.programLoading = false;
                                }, 300);
                            });
                        })
                });

        };

        var checkSlug = function () {
            return $q(function (resolve, reject) {
                $scope.slug.checking = true;
                $http.post(authService.apiUrl + '/clients/' + $scope.slug.clientId + '/programs/check-slug', {
                        slug: $scope.model.slug
                    })
                    .success(function (result) {
                        $scope.model.slug = result.slug;
                        $scope.slug.checking = false;
                        resolve();
                    })
                    .error(reject);
            });
        };

        var slugTimeoutId = 0;
        var timeCheckSlug = function () {
            clearTimeout(slugTimeoutId);
            slugTimeoutId = setTimeout(function () {
                checkSlug();
                slugTimeoutId = 0;
            }, 750);
        };

        $scope.titleChange = function () {
            if ($scope.slug.direct) return;
            $scope.model.slug = $scope.model.title.toLowerCase()
                .replace(/\s/g, '').replace(/[^0-9a-z]/g, '');
            timeCheckSlug();
        };
        $scope.slugChange = function () {
            if (!$scope.slug.value || $scope.slug.value.trim().length < 0) return clearTimeout(slugTimeoutId);
            $scope.model.slug = $scope.slug.value;
            timeCheckSlug();
            $scope.slug.direct = true;
        };
        $scope.editSlug = function (e) {
            e.stopPropagation();
            $scope.slug.value = $scope.model.slug;
            $scope.slug.edit = true;
            $timeout(function () {
                angular.element('#slugInput').focus();
            }, 0)
        };
        $scope.removeNewProgramImage = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.model.imageUrl = null;
        };
    }]);

controllers.controller('AuthoringSuiteProgramEditController', ['$scope', '$http', '$timeout', '$q', '$upload', '$window', '$modal', 'authService', 'helperService',
    function ($scope, $http, $timeout, $q, $upload, $window, $modal, authService, helpers) {
        $scope.busy = false;
        $scope.program = null;
        $scope.isSaving = false;
        $scope.orgTitle = null;
        $scope.canEditEntity = helpers.canEditEntity;

        $scope.canEditProgram = function (program) {
            if (program != null) {
                if (program.status != 'preview') {
                    //If the program is on a major version there won't be a . in it,
                    //if major version then we know all content is published do lock it down
                    //if (program && !program.version.subVersion && program.version.version == program.history[0].version) {
                    //    //If this is a major version set it to locked by default, but only once so if user sets it to unlocked it will stay
                    //    if (!program.cancelMigrateReultsOveridden) {
                    //        program.cancelMigrateResultsOnPublish = false;
                    //    }
                    //    program.cancelMigrateReultsOveridden = true;

                    //    //If the entity has an id then it already existed and can't be edited
                    //    //Id greater than 1473811230515 is a date being used by to-do and badge pages for some strange reason when adding a new record
                    //    //Definitely a tickin time bomb if id's ever get higher than that number, but in that case probably need to redesign the system if there is
                    //    //over a trillion records in a table
                    //    //if (!program.cancelMigrateResultsOnPublish && (entity.id && entity.id < 1473811230515)) {
                    //    //    return false;
                    //    //} else if (!program.cancelMigrateResultsOnPublish && !entity.id) {
                    //    //    //If the entity didn't have an id then it is new since this override took place
                    //    //    // so shouldn't be included and thus still editable
                    //    //    return true;
                    //    //}
                    //}

                    //If the program major version doesn't mach the most recent major version, then must cancel migration of results
                    if (program && program.version.version != program.history[0].version) {
                        program.cancelMigrateResultsOnPublish = true;
                        return true;
                    }

                    //If the program major version is 0 or not set then move to reset mode
                    if (program && !program.version.version && program.version.version == 0) {
                        //program.cancelMigrateResultsOnPublish = true;
                        return false;
                    }

                    //If we are on a minor version that hasn't been saved since the update set it to editable
                    if (program
                        && program.version.version  //If major version is 0 we don't need to do anything
                        && program.version.version == program.history[0].version
                        && !program.hasSavedContent) {
                        //program.cancelMigrateResultsOnPublish = true;
                        program.cancelMigrateReultsOveridden = true;
                        return true;
                    }
                }
            } else {
                return false;
            }
            

            //if (!entity.publishedAt) {
            //    return true;
            //} else if (entity.publishedAt && program.cancelMigrateResultsOnPublish) {
            //    return true
            //} else {
            //    return false;
            //}
        }

        var load = function (slug, restore) {
            return $q(function (resolve, reject) {
                $scope.restoreId = Number(restore);
                var url = authService.apiUrl + '/programs/' + slug;
                if (restore > 0) url += ('?restore=' + restore);

                $scope.loading.isLoading++;
                $http.get(url)
                    .success(function (program) {
                        finishInit(program);
                        $scope.stopLoading();
                        resolve();
                    })
                    .error(function (err) {
                        reject(err);
                    })
            });
        };

        var finishInit = function (program) {
            helpers.canEditEntity({}, program);
            program.comment = null;
            $scope.program = program;
            $scope.orgTitle = program.title;
            $scope.setSelectedProgram(program);
            $scope.resetVal();
        };

        this.init = function (slug, restore) {
            load(slug, restore).then(function () {
                $timeout(function () {
                    fitToContent('program-desc', 500);
                }, 0);
            });
        };

        $scope.resetVal = function () {
            $scope.val = {
                title: {
                    req: false,
                    dup: false
                },
                sequencing: {
                    type: {
                        req: false
                    },
                    interval: {
                        req: false,
                        min: false,
                        fmt: false
                    },
                    period: {
                        req: false
                    },
                    intervalType: {
                        req: false
                    },
                    startDate: {
                        req: false,
                        min: false
                    }
                }
            };

            $scope.programImageVal = {
                size: false,
                type: false
            };
            if (!$scope.program) return;
        };
        $scope.resetVal();

        $scope.validate = function (silent) {

            if (!silent) {
                $scope.resetVal();
            }

            var isValid = true;

            if (!$scope.program) {
                isValid = false;
            } else {
                if (!$scope.program.title) {
                    if (!silent) {
                        $scope.val.title.req = true;
                    }
                    isValid = false;
                }

                if (!$scope.program.sequencingTypeId) {
                    if (!silent) {
                        $scope.val.sequencing.type.req = true;
                    }
                    isValid = false;
                }


                if ($scope.program.sequencingTypeId == helpers.sequencingTypes.interval.id) {
                    if (!$scope.program.sequencingParameters.interval) {
                        if (!silent) {
                            $scope.val.sequencing.interval.req = true;
                        }
                        isValid = false;
                    }
                    else if (isNaN(Number($scope.program.sequencingParameters.interval))) {
                        if (!silent) {
                            $scope.val.sequencing.interval.fmt = true;
                        }
                        isValid = false;
                    }
                    else if (Number($scope.program.sequencingParameters.interval) < .5) {
                        if (!silent) {
                            $scope.val.sequencing.interval.min = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalPeriod) {
                        if (!silent) {
                            $scope.val.sequencing.period.req = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalStartTypeId) {
                        if (!silent) {
                            $scope.val.sequencing.intervalType.req = true;
                        }
                        isValid = false;
                    } else if ($scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && !$scope.program.sequencingParameters.startDate) {
                        if (!silent) {
                            $scope.val.sequencing.startDate.req = true;
                        }
                        isValid = false;
                    }
                    //else if ($scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && $scope.program.sequencingParameters.startDate) {
                    //    if (new Date($scope.program.sequencingParameters.startDate) < $scope.today) {
                    //        if (!silent) {
                    //            $scope.val.sequencing.startDate.min = true;
                    //        }
                    //        isValid = false;
                    //    }
                    //}
                }

                if (isValid && !silent) {
                    if ($scope.program.sequencingParameters && $scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                        $scope.program.sequencingParameters.startDate = null;
                    }
                    _.each($scope.program.levels, function (level) {
                        if (level.sequencingParameters && level.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                            level.sequencingParameters.startDate = null;
                        }
                    })
                }

                if (!isValid && !silent) {
                    $scope.scrollToError();
                }
            }

            return isValid;
        };

        $scope.checkTitle = function (title) {
            return $q(function (resolve, reject) {
                $http.post(authService.apiUrl + '/client/programs/' + $scope.program.id + '/check-title/', {
                    title: $scope.program.title
                }).success(function (result) {
                        if (result) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }

                    })
                    .error(reject);
            });
        };

        $scope.$on('autoSaveNow', function () {
            $scope.autoSaveNow();
        });

        $scope.$watch(function () {
            return $scope.validate(true);
        }, function () {
            $scope.autoSaveNow();
        }, true);

        $scope.autoSaveNow = function () {
            if ($scope.validate(true)) {
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

        window.onbeforeunload = function (e) {
            if ($scope.programEditFrm.$dirty) {
                return 'There are unsaved changes on this page!'
            }
        };


        $scope.submit = function (e, status, publish) {
            e.preventDefault();
            return $q(function (resolve, reject) {
                if (!$scope.validate(false)) return;

                var continueSave = function () {
                    $scope.isSaving = true;
                    $scope.checkTitle($scope.program.title).then(function (allowed) {
                        if (!allowed) {
                            $scope.val.title.dup = true;
                            $scope.isSaving = false;
                        } else {
                            $scope.program.status = status ? status : 'ready';

                            //If the program is being published, add the publish date, otherwise remove the publish date publish doesn't carry over from one version to the next
                            if (publish) {
                                $scope.program.published = (new Date()).toISOString();
                            } else {
                                if ($scope.program.published) {
                                    $scope.program.wasPublished = true;
                                }
                                $scope.program.published = null;
                            }

                            //If the program is not of Interval sequencing type, then remove any parameters that were associated with that type.
                            if ($scope.program.sequencingTypeId != $scope.sequencingTypes.interval.id) {
                                $scope.program.sequencingParameters = null;
                            }

                            $scope.programEditFrm.$setPristine();

                            $http.post(authService.apiUrl + '/programs', $scope.program)
                                .success(function (program) {
                                    //If status is preview then we dont need to initialize the UI again because we will be redirected
                                    if (!(status == 'preview')) {
                                        //If we just saved from a restored program, we need to redirect to the new program without the restore= querystring from the restored program
                                        if ($scope.restoreId > 0) {
                                            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit';
                                        } else {
                                            finishInit(program);
                                            resolve(program);
                                            $timeout(function () {
                                                $('html,body').animate({scrollTop: 0}, 'slow');
                                                $scope.isSaving = false;
                                            }, 300);
                                        }
                                    }
                                    else {
                                        resolve(program);
                                    }
                                });

                        }
                    })
                };

                //If the user is in a restored program, they could have moved into RESET mode without knowing it, verify before allowing save
                if ($scope.restoreId > 0) {
                    if ($scope.program.cancelMigrateResultsOnPublish && !$scope.program.history[0].cancelMigrateResultsOnPublish) {
                        $scope.promptUnlockProgramThen(function () {
                            continueSave();
                        })
                    } else {
                        continueSave();
                    }
                } else {
                    continueSave();
                }
            });
        };

        $scope.togglePublished = function (e) {
            if (!$scope.validate()) return;

            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Publish Program?',
                            text: helpers.getPublishText($scope.program),
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }

            }).result.then(
                function () {
                    $scope.submit(e, null, true);
                });
        };

        $scope.restore = function (e, history) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/?restore=' + history.programId;
        };

        $scope.revert = function (e) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/';
        };

        $scope.$on('previewProgramTiles', function (e) {
            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit';
                    $window.location = url;
                });
        });

        $scope.preview = function (e) {
            e.preventDefault();
            e.stopPropagation();

            e.preventDefault();

            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user/program/' + program.slug + '/quests?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit';
                    $window.location = url;
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
                            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit'
                        });

                    });
            } else {
                e.preventDefault();
                e.stopPropagation();
                $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit'
            }
        }


        /* QUIlll JS on load function   */
        $scope.editorCreated = function (editor) {
            console.log(editor);
        };
        $scope.contentChanged = function (editor, html, text) {
            $scope.changeDetected = true;
            console.log('editor: ', editor, 'html: ', html, 'text:', text);
        };

    }]);

controllers.controller('AuthoringSuiteQuestsEditManagerController', ['$scope', '$http', '$timeout', '$q', '$upload', '$window', '$modal', 'controllerState', 'authService', 'helperService',
    function ($scope, $http, $timeout, $q, $upload, $window, $modal, controllerState, authService, helpers) {
        $scope.busy = false;
        $scope.program = null;
        $scope.quest = null;
        $scope.inState = null;
        $scope.canEditEntity = helpers.canEditEntity;
        

        $scope.isQuestsValid = true;

        controllerState.scope($scope);
        controllerState.otherwise('quests');
        controllerState.onEnter = function (state) {
            $timeout(function () {
                $scope.inState = state;
            });
        };

        $scope.checkEncoding = function (media) {
            if (media.url) {
                $http.get(authService.apiUrl + '/uv/encoded?url=' + media.url)
                    .success(function (result) {
                        if (result.encodings.length < 1) return $timeout(function () {
                            $scope.checkEncoding(media);
                        }, 5000);
                        media.encodings = result.encodings;
                    });
            }
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
                            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/quests'
                        });

                    });
            } else {
                e.preventDefault();
                e.stopPropagation();
                $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/quests'
            }
        };
      

        $scope.duplicateQuest = function (e, quest, level, program) {
            if (quest.type == 'T') {
                quest.menuOpen = false;
                var newQuest = angular.copy(quest);
                //get todo of quest and add to todo.
                _.each(program.todos, function (todo) {
                    if (todo.questId == quest.id) {
                        newQuest.todo = todo;
                    }
                });
                newQuest.id = 0;
                newQuest.slug = undefined;
                newQuest.levelId = undefined;
                newQuest.publishedAt = null;

            } else {
                quest.menuOpen = false;
                var newQuest = angular.copy(quest);
                newQuest.id = 0;
                newQuest.slug = undefined;
                newQuest.levelId = undefined;
                newQuest.publishedAt = null;

                angular.forEach(newQuest.challenges, function (challenge) {
                    challenge.questId = undefined;
                    challenge.id = 0;
                });
            }
            

            program.quests.push(newQuest);
            $scope.programEditFrm.$setDirty();
        };

        $scope.duplicateChallenge = function (e, quest, challenge) {
            challenge.menuOpen = false;
            var newChallenge = angular.copy(challenge);
            newChallenge.id = 0;
            newChallenge.publishedAt = null;
            newChallenge.slug = undefined;
            $scope.programEditFrm.$setDirty();

            if (!$scope.hasFinishChallenge(quest))  quest.challenges.push(newChallenge);
            else quest.challenges.splice(quest.challenges.length - 1, 0, newChallenge);

        };

        $scope.hasFinishChallenge = function (quest) {
            if (quest) {
                var finishChallenge = _.findWhere(quest.challenges, {type: 'finish'});
                if (finishChallenge) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        };

        $scope.defaultWorkQuestions = {
            singleSelect: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.singleSelectAnswer(),
                        $scope.defaultWorkQuestions.singleSelectAnswer()
                    ],
                    val: {correct: {req: false}}
                };
            },
            singleSelectAnswer: function () {
                return {
                    answer: null,
                    correct: false,
                    hasError: false,
                    val: {answer: {req: false}}
                };
            },
            multiSelect: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.multiSelectAnswer(),
                        $scope.defaultWorkQuestions.multiSelectAnswer()
                    ],
                    val: {correct: {req: false}}
                };
            },
            multiSelectAnswer: function () {
                return $scope.defaultWorkQuestions.singleSelectAnswer()
            },
            poll: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.pollAnswer()
                    ]
                };
            },
            pollAnswer: function () {
                return $scope.defaultWorkQuestions.singleSelectAnswer()
            },
            pollMultiSelect: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.pollMultiSelectAnswer()
                    ],
                    selectCount: null,
                    val: {
                        selectCount: {fmt: false, max: false}
                    }
                };
            },
            pollMultiSelectAnswer: function () {
                return $scope.defaultWorkQuestions.singleSelectAnswer()
            },
            narrative: function () {
                return {
                    selectAnswer: null,
                    answers: []
                }
            },
            fillBlank: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.fillBlankAnswer()
                    ],
                    val: {blank: {req: false, all: false}}
                };
            },
            fillBlankAnswer: function () {
                return $scope.defaultWorkQuestions.singleSelectAnswer()
            },
            matching: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.matchingAnswer()
                    ]
                };
            },
            matchingAnswer: function () {
                return {
                    answer: null,
                    match: null,
                    hasError: false,
                    val: {
                        answer: {req: false},
                        match: {req: false}
                    }
                };
            },
            shortAnswer: function () {
                return {
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.shortAnswerAnswer()
                    ]
                };
            },
            shortAnswerAnswer: function () {
                return {
                    answer: null,
                    correct: false,
                    hasError: false,
                    val: {answer: {req: false}}
                };
            },
            contrasting: function () {
                return {
                    differences: {
                        selectedAnswer: null,
                        canDrag: false,
                        answers: []
                    },
                    similarities: {
                        selectedAnswer: null,
                        canDrag: false,
                        answers: []
                    }
                };
            },
            contrastingAnswer: function () {
                return $scope.defaultWorkQuestions.singleSelectAnswer()
            },
            sentenceBuilder: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.sentenceBuilderAnswer()
                    ]
                };
            },
            sentenceBuilderAnswer: function () {
                return $scope.defaultWorkQuestions.singleSelectAnswer()
            },

            freeContrasting: function () {
                return {
                    selectedAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.freeContrastingAnswer()
                    ]
                };
            },
            freeContrastingAnswer: function () {
                return {
                    answer: null,
                    match: null,
                    hasError: false,
                    val: {
                        answer: {req: false},
                        match: {req: false}
                    }
                };
            },
            sequencing: function () {
                return {
                    selectAnswer: null,
                    canDrag: false,
                    answers: [
                        $scope.defaultWorkQuestions.sequencingAnswer(),
                        $scope.defaultWorkQuestions.sequencingAnswer()
                    ],
                    val: {correct: {req: false}}
                };
            },
            sequencingAnswer: function () {
                return {
                    answer: null,
                    correct: false,
                    hasError: false,
                    val: {answer: {req: false}}
                };
            },

            grouping: function () {
                return {
                    selectedAnswer: null,
                    answers: [
                        $scope.defaultWorkQuestions.groupingAnswer()
                    ]
                };
            },
            groupingAnswer: function () {
                return {
                    answer: null,
                    items: [{
                        item: null,
                        hasError: false,
                        val: {item: {req: false}}
                    }],
                    selectedItem: null,
                    hasError: false,
                    val: {answer: {req: false}}
                };
            },
            init: function (question) {
                question.workAnswers = {
                    singleSelect: $scope.defaultWorkQuestions.singleSelect(),
                    multiSelect: $scope.defaultWorkQuestions.multiSelect(),
                    poll: $scope.defaultWorkQuestions.poll(),
                    pollMultiSelect: $scope.defaultWorkQuestions.pollMultiSelect(),
                    narrative: $scope.defaultWorkQuestions.narrative(),
                    fillBlank: $scope.defaultWorkQuestions.fillBlank(),
                    matching: $scope.defaultWorkQuestions.matching(),
                    shortAnswer: $scope.defaultWorkQuestions.shortAnswer(),
                    contrasting: $scope.defaultWorkQuestions.contrasting(),
                    sentenceBuilder: $scope.defaultWorkQuestions.sentenceBuilder(),
                    freeContrasting: $scope.defaultWorkQuestions.freeContrasting(),
                    sequencing: $scope.defaultWorkQuestions.sequencing(),
                    grouping: $scope.defaultWorkQuestions.grouping()
                };
            }
        };

        $scope.initState = function () {
            var initQuest = function (quest) {
                quest.uploading = {
                    tile: false,
                    bg: false
                };

                angular.forEach(quest.challenges, function (challenge) {

                    challenge.val = angular.copy($scope.chalengeValTemplate);

                    angular.forEach(challenge.questions, function (question) {
                        $scope.defaultWorkQuestions.init(question);

                        // Single Select
                        if (question.type.id == $scope.questionTypes.singleSelect.id) {
                            question.workAnswers.singleSelect.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.singleSelect.answers.push({
                                    answer: answer.answer,
                                    correct: answer.correct,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                            });
                        }
                        // Multi Select
                        else if (question.type.id == $scope.questionTypes.multiSelect.id) {
                            question.workAnswers.multiSelect.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.multiSelect.answers.push({
                                    answer: answer.answer,
                                    correct: answer.correct,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                            });
                        }
                        // Poll
                        else if (question.type.id == $scope.questionTypes.poll.id) {
                            question.workAnswers.poll.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.poll.answers.push({
                                    answer: answer.answer,
                                    correct: answer.correct,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                            });
                        }
                        // Poll Multi Select
                        else if (question.type.id == $scope.questionTypes.pollMultiSelect.id) {
                            question.workAnswers.pollMultiSelect.answers = [];

                            var selectCount = -1;
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.pollMultiSelect.answers.push({
                                    answer: answer.answer,
                                    correct: answer.correct,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                                if (answer.correct) {
                                    if (selectCount < 0) selectCount = 1
                                    else selectCount++;
                                }
                            });
                            if (selectCount > 0) question.workAnswers.pollMultiSelect.selectCount = selectCount.toString();
                        }
                        // Free Narrative Response
                        else if (question.type.id == $scope.questionTypes.narrative.id) {
                        }
                        // Fill In The Blank
                        else if (question.type.id == $scope.questionTypes.fillBlank.id) {

                            question.workAnswers.fillBlank.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.fillBlank.answers.push({
                                    answer: answer.answer,
                                    correct: answer.correct,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                            });

                        }
                        // Item Matching
                        else if (question.type.id == $scope.questionTypes.matching.id) {
                            question.workAnswers.matching.answers = [];

                            var a = null;
                            for (var i = 0; i < question.answers.length; i++) {
                                if (!a) {
                                    a = {
                                        answer: question.answers[i].answer,
                                        match: null,
                                        hasError: false,
                                        val: {
                                            answer: {req: false},
                                            match: {req: false}
                                        }
                                    }
                                }
                                else {
                                    a.match = question.answers[i].answer;
                                    question.workAnswers.matching.answers.push(a);
                                    a = null;
                                }
                            }
                        }
                        // Short Answer
                        else if (question.type.id == $scope.questionTypes.shortAnswer.id) {
                            question.workAnswers.shortAnswer.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.shortAnswer.answers.push({
                                    answer: answer.answer,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                            });
                        }
                        // Sentence / Phrase Builder
                        else if (question.type.id == $scope.questionTypes.sentenceBuilder.id) {
                            question.workAnswers.sentenceBuilder.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.sentenceBuilder.answers.push({
                                    answer: answer.answer,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                            });
                        }
                        // Sequencing
                        else if (question.type.id == $scope.questionTypes.sequencing.id) {
                            question.workAnswers.sequencing.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.sequencing.answers.push({
                                    answer: answer.answer,
                                    correct: answer.correct,
                                    hasError: false,
                                    val: {answer: {req: false}}
                                });
                            });
                        }
                        //Contrasting
                        else if (question.type.id == $scope.questionTypes.contrasting.id) {
                            angular.forEach(question.answers, function (answer) {
                                if (answer.correct) {
                                    question.workAnswers.contrasting.similarities.answers.push({
                                        answer: answer.answer,
                                        hasError: false,
                                        val: {
                                            answer: {req: false}
                                        }
                                    });
                                }
                                else {
                                    question.workAnswers.contrasting.differences.answers.push({
                                        answer: answer.answer,
                                        hasError: false,
                                        val: {
                                            answer: {req: false}
                                        }
                                    });
                                }

                            });
                        }
                        //freeContrasting
                        else if (question.type.id == $scope.questionTypes.freeContrasting.id) {
                            question.workAnswers.freeContrasting.answers = [];
                            angular.forEach(question.answers, function (answer) {
                                question.workAnswers.freeContrasting.answers.push({
                                    answer: answer.answer,
                                    match: answer.match,
                                    hasError: false,
                                    val: {
                                        answer: {req: false},
                                        match: {req: false}
                                    }
                                });
                            });
                        }
                        // Grouping
                        else if (question.type.id == $scope.questionTypes.grouping.id) {
                            question.workAnswers.grouping.answers = [];
                            var g = null;
                            angular.forEach(question.answers, function (answer) {
                                if (answer.answer[0] !== '@') {
                                    g = {
                                        answer: answer.answer,
                                        items: [],
                                        selectedItem: null,
                                        hasError: false,
                                        val: {answer: {req: false}}
                                    };
                                    question.workAnswers.grouping.answers.push(g);
                                }
                                else {
                                    g.items.push({
                                        item: answer.answer.replace('@', ''),
                                        val: {item: {reg: false}}
                                    });
                                }
                            });
                        }
                    });

                    angular.forEach(challenge.media, function (media) {
                        if (media.type == 'link') {
                            media.val = {
                                link: {
                                    req: false,
                                    fmt: false
                                }
                            };
                        } else if (media.type == 'video') {
                            $scope.checkEncoding(media);
                        }
                    });
                });
            };
            angular.forEach($scope.program.quests, function (quest) {
                initQuest(quest);
            });
            angular.forEach($scope.program.levels, function (level) {
                angular.forEach(level.quests, function (quest) {
                    initQuest(quest);
                });
            });
            $scope.resetVal();
        };

        var load = function (slug, restore) {
            return $q(function (resolve, reject) {
                $scope.restoreId = Number(restore);
                var url = authService.apiUrl + '/programs/' + slug;
                if (restore > 0) url += ('?restore=' + restore);

                $scope.loading.isLoading++;
                $http.get(url)
                    .success(function (program) {
                        finishInit(program);
                        $scope.stopLoading();
                        resolve();
                    })
                    .error(function (err) {
                        reject(err);
                    })
            });
        };

        var finishInit = function (program) {
            if (program.description) program.description = program.description.replace(/\n/g, '<br>');
            program.comment = null;
            $scope.program = program;

            //Call to set program mode based on version
            helpers.canEditEntity({}, program);

            $scope.setSelectedProgram(program);
            $scope.initState();
            $scope.resetVal();
        };

        this.init = function (slug, restore) {
            load(slug, restore).then(function () {
                controllerState.route();
                $timeout(function () {
                    fitToContent('program-desc', 500);
                }, 0);
            });
        };

        $scope.resetVal = function () {
            $scope.val = {
                title: {
                    req: false,
                    title: false
                },
                sequencing: {
                    type: {
                        req: false
                    },
                    interval: {
                        req: false,
                        min: false,
                        fmt: true
                    },
                    period: {
                        req: false
                    },
                    intervalType: {
                        req: false
                    },
                    startDate: {
                        req: false,
                        min: false
                    }
                }
            };

            $scope.programImageVal = {
                size: false,
                type: false
            };

            $scope.noLevelActivityOrder = {
                firstActivityError: { req: false },
                firstActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n',
                levelHasNoActivity: { req: false },
                levelHasNoActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n'
            };

            if (!$scope.program) return;

            var resetQuestVal = function (quest) {
                quest.hasError = false;
                quest.val = {
                    title: {req: false},
                    objective: { req: false },
                    program: {save: false},
                    featuredImage: {type: false, size: false},
                    backgroundImage: {type: false, size: false},
                    challenges: {req: false}
                };

                // Reset all challenges
                angular.forEach(quest.challenges, function (challenge) {
                    challenge.hasError = false;
                    challenge.val = angular.copy($scope.challengeValTemplate);
                    challenge.menuOpen = false;
                    if (typeof challenge.addMedia !== 'undefined') {
                        challenge.addMedia.val = {
                            req: false,
                            fmt: false,
                            src: false
                        };
                    }

                    // Reset all questions
                    angular.forEach(challenge.questions, function (question) {
                        question.hasError = false;
                        question.val = {
                            question: {req: false}
                        };
                        question.menuOpen = false;
                        question.typeOpen = false;

                        // Are the work answers in the object?
                        if (typeof question.workAnswers === 'undefined') return;

                        question.workAnswers.singleSelect.val.correct.req = false;
                        angular.forEach(question.workAnswers.singleSelect.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        question.workAnswers.multiSelect.val.correct.req = false;
                        angular.forEach(question.workAnswers.multiSelect.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        angular.forEach(question.workAnswers.poll.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        question.workAnswers.pollMultiSelect.val = {selectCount: {fmt: false, max: false}};
                        angular.forEach(question.workAnswers.pollMultiSelect.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        question.workAnswers.fillBlank.val.blank.req = false;
                        question.workAnswers.fillBlank.val.blank.all = false;
                        angular.forEach(question.workAnswers.fillBlank.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        angular.forEach(question.workAnswers.sentenceBuilder.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        angular.forEach(question.workAnswers.matching.answers, function (a) {
                            a.hasError = false;
                            a.val = {
                                answer: {req: false},
                                match: {req: false}
                            };
                        });

                        angular.forEach(question.workAnswers.grouping.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                            angular.forEach(a.items, function (i) {
                                i.hasError = false;
                                i.val = {item: {req: false}};
                            });

                        });

                        angular.forEach(question.workAnswers.shortAnswer.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        angular.forEach(question.workAnswers.contrasting.differences.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });
                        angular.forEach(question.workAnswers.contrasting.similarities.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });

                        angular.forEach(question.workAnswers.freeContrasting.answers, function (a) {
                            a.hasError = false;
                            a.val = {
                                answer: {req: false},
                                match: {req: false}
                            };
                        });

                        angular.forEach(question.workAnswers.sequencing.answers, function (a) {
                            a.hasError = false;
                            a.val = {answer: {req: false}};
                        });
                    });

                    // Reset all media
                    angular.forEach(challenge.media, function (media) {
                        if (media.type == 'link') {
                            media.val = {
                                link: {
                                    req: false,
                                    fmt: false
                                }
                            };
                        }
                    });
                });
            };

            // Reset all quests
            angular.forEach($scope.program.quests, function (quest) {
                resetQuestVal(quest);
            });

            // Reset all quests
            angular.forEach($scope.program.levels, function (level) {
                angular.forEach(level.quests, function (quest) {
                    resetQuestVal(quest);
                });
            });
        };
        $scope.resetVal();

        $scope.challengeValTemplate = {
            title: {
                req: false,
                length: false
            },
            media: {
                type: false,
                size: false
            },
            downloadContent: {
                type: false,
                size: false
            }
        };

        $scope.noLevelActivityOrder = {
            firstActivityError: { req: false },
            firstActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n',
            levelHasNoActivity: { req: false},
            levelHasNoActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n'
        };

        $scope.validate = function (silent, publish, currentQuest) {
            var challengeError = false;

            if (!silent) {
                $scope.resetVal();
            }

            var isValid = true;

            var validateQuest = function (quest) {
                if (!quest.title) {
                    if (!silent) {
                        quest.val.title.req = true;
                        quest.hasError = true;
                        quest.expanded = true;
                    }
                    isValid = false;
                }
             
             //if (!publish) {
             //       if (quest.challenges.length == 0) {
             //           if (!silent) {
             //               quest.val.challenges.req = true;
             //               quest.hasError = true;
             //               quest.expanded = true;
             //           }
             //           isValid = false;
             //       }
             //   }
              
               // if (!quest.objective) {
               //if (!silent) {
               //    quest.val.objective.req = true;
               //     quest.hasError = true;
               //     quest.expanded = true;
                 
               //    }
               //    isValid = false;
               //}

                if (publish) {
                    if (quest.challenges.length == 0) {
                        if (!silent) {
                            quest.val.challenges.req = true;
                            quest.hasError = true;
                            quest.expanded = true;
                        }
                        isValid = false;
                    }
                }

                // Validate each challenge
                angular.forEach(quest.challenges, function (challenge) {
                    if (!challenge.title) {
                        if (!silent) {
                            challenge.val.title.req = true;
                            challenge.hasError = true;
                            quest.hasError = true;
                            quest.expanded = true;
                            challenge.expanded = true;
                        }
                        challengeError = true;
                        isValid = false;
                    }
                    //if (challenge.title) {
                    //    if (challenge.title.length >= 45) {
                    //        challenge.val.title.length = true;
                    //        challengeError = true;
                    //        isValid = false;
                    //    } else {
                    //        challenge.val.title.length = false;
                    //    }
                    //}
                    
                    

                    // Validate each question
                    angular.forEach(challenge.questions, function (question) {
                        if (!question.question) {
                            if (!silent) {
                                question.val.question.req = true;
                                challenge.hasError = question.hasError = true;
                                challengeError = true;
                                quest.hasError = true;
                                quest.expanded = true;
                                question.expanded = true;
                            }
                            isValid = false;
                        }

                        if (question.type.id == 0) {
                            if (!silent) {
                                question.val.question.type = true;
                                challenge.hasError = question.hasError = true;
                                challengeError = true;
                                quest.hasError = true;
                                quest.expanded = true;
                                question.expanded = true;
                            }
                            isValid = false;
                        }

                        // Single Select
                        if (question.type.id == $scope.questionTypes.singleSelect.id) {
                            var hasCorrect = false;
                            // Validate each answer
                            angular.forEach(question.workAnswers.singleSelect.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                                if (answer.correct) hasCorrect = true;
                            });
                            if (!hasCorrect) {
                                if (!silent) {
                                    question.workAnswers.singleSelect.val.correct.req = true;
                                    challenge.hasError = question.hasError = true;
                                    challengeError = true;
                                    quest.hasError = true;
                                    quest.expanded = true;
                                    challenge.expanded = question.expanded = true;
                                }
                                isValid = false;
                            }
                        }
                        // Multi Select
                        else if (question.type.id == $scope.questionTypes.multiSelect.id) {
                            var hasCorrect = false;
                            // Validate each answer
                            angular.forEach(question.workAnswers.multiSelect.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                                if (answer.correct) hasCorrect = true;
                            });
                            if (!hasCorrect) {
                                if (!silent) {
                                    question.workAnswers.multiSelect.val.correct.req = true;
                                    challenge.hasError = question.hasError = true;
                                    challengeError = true;
                                    quest.hasError = true;
                                    quest.expanded = true;
                                    challenge.expanded = question.expanded = true;
                                }
                                isValid = false;
                            }
                        }
                        // Poll
                        else if (question.type.id == $scope.questionTypes.poll.id) {
                            // Validate each answer
                            angular.forEach(question.workAnswers.poll.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Poll Multi Select
                        else if (question.type.id == $scope.questionTypes.pollMultiSelect.id) {

                            if (question.workAnswers.pollMultiSelect.selectCount && question.workAnswers.pollMultiSelect.selectCount.trim().length > 0) {

                                var r = /^(\d+)$/;
                                if (!r.test(question.workAnswers.pollMultiSelect.selectCount)) {
                                    if (!silent) {
                                        question.workAnswers.pollMultiSelect.val.selectCount.fmt = true;
                                        challenge.hasError = question.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = true;
                                    }
                                    isValid = false;
                                }
                                else {
                                    var c = parseInt(question.workAnswers.pollMultiSelect.selectCount);
                                    if (c < 1 || c > question.workAnswers.pollMultiSelect.answers.length) {
                                        if (!silent) {
                                            question.workAnswers.pollMultiSelect.val.selectCount.max = true;
                                            challenge.hasError = question.hasError = true;
                                            challengeError = true;
                                            quest.hasError = true;
                                            quest.expanded = true;
                                            challenge.expanded = question.expanded = true;
                                        }
                                        isValid = false;
                                    }
                                }
                            }
                            // Validate each answer
                            angular.forEach(question.workAnswers.pollMultiSelect.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Free Narrative Response
                        else if (question.type.id == $scope.questionTypes.narrative.id) {
                        }
                        // Fill In The Blank
                        else if (question.type.id == $scope.questionTypes.fillBlank.id) {
                            var blank = 0;
                            // Validate each answer
                            angular.forEach(question.workAnswers.fillBlank.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                                if (answer.correct) blank++;
                            });
                            if (blank == 0 || blank == question.workAnswers.fillBlank.answers.length) {
                                if (!silent) {
                                    if (blank == 0) question.workAnswers.fillBlank.val.blank.req = true;
                                    else question.workAnswers.fillBlank.val.blank.all = true;
                                    challenge.hasError = question.hasError = true;
                                    challengeError = true;
                                    quest.hasError = true;
                                    quest.expanded = true;
                                    challenge.expanded = question.expanded = true;
                                }
                                isValid = false;
                            }
                        }
                        // Item Matching
                        else if (question.type.id == $scope.questionTypes.matching.id) {
                            // Validate each answer
                            angular.forEach(question.workAnswers.matching.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                                if (!answer.match) {
                                    if (!silent) {
                                        answer.val.match.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Short Answer
                        else if (question.type.id == $scope.questionTypes.shortAnswer.id) {
                            angular.forEach(question.workAnswers.shortAnswer.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Contrasting
                        else if (question.type.id == $scope.questionTypes.contrasting.id) {
                            // Validate each difference
                            angular.forEach(question.workAnswers.contrasting.differences.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                            // Validate each similarity
                            angular.forEach(question.workAnswers.contrasting.similarities.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Sentence / Phrase Builder
                        else if (question.type.id == $scope.questionTypes.sentenceBuilder.id) {
                            // Validate each answer
                            angular.forEach(question.workAnswers.sentenceBuilder.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Free Contrasting
                        else if (question.type.id == $scope.questionTypes.freeContrasting.id) {
                            // Validate each answer
                            angular.forEach(question.workAnswers.freeContrasting.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                                if (!answer.match) {
                                    if (!silent) {
                                        answer.val.match.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Sequencing
                        else if (question.type.id == $scope.questionTypes.sequencing.id) {
                            // Validate each answer
                            angular.forEach(question.workAnswers.sequencing.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }
                            });
                        }
                        // Grouping
                        else if (question.type.id == $scope.questionTypes.grouping.id) {
                            // Validate each answer
                            angular.forEach(question.workAnswers.grouping.answers, function (answer) {
                                if (!answer.answer) {
                                    if (!silent) {
                                        answer.val.answer.req = true;
                                        challenge.hasError = question.hasError = answer.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = question.expanded = answer.expanded = true;
                                    }
                                    isValid = false;
                                }

                                angular.forEach(answer.items, function (item) {
                                    if (!item.item) {
                                        if (!silent) {
                                            item.val.item.req = true;
                                            challenge.hasError = question.hasError = answer.hasError = true;
                                            challengeError = true;
                                            quest.hasError = true;
                                            quest.expanded = true;
                                            challenge.expanded = question.expanded = answer.expanded = true;
                                        }
                                        isValid = false;
                                    }
                                });
                            });

                        }

                        /********************************Validate Question Hint*************************************/

                        angular.forEach(question.hints, function (hint) {
                            if (!hint.hint) {
                                if (!silent) {
                                    challengeError = true;
                                    quest.hasError = true;
                                    quest.expanded = true;
                                    hint.hasError = true;
                                }
                                isValid = false;
                            }

                            //if (hint.hint) {
                            //    if (hint.hint.length > 45) {
                            //        hint.length = true;
                            //        challengeError = true;
                            //        isValid = false;
                            //    } else {
                            //        hint.length = false;
                            //    }
                            //}
                        });

                    });

                    // Reset all media
                    angular.forEach(challenge.media, function (media) {
                        if (media.type == 'link') {
                            if (challenge.type == 'finish') {
                                if (media.link) {
                                    if (!helpers.validLink(media.link)) {

                                        if (!silent) {
                                            media.val.link.fmt = true;
                                            challenge.hasError = true;
                                            challengeError = true;
                                            quest.hasError = true;
                                            quest.expanded = true;
                                            challenge.expanded = true;
                                        }
                                        isValid = false;
                                    }
                                }
                            }
                            else {
                                if (!media.link) {
                                    if (!silent) {
                                        media.val.link.req = true;
                                        challenge.hasError = true;
                                        challengeError = true;
                                        quest.hasError = true;
                                        quest.expanded = true;
                                        challenge.expanded = true;
                                    }
                                    isValid = false;
                                }
                                else {
                                    if (!helpers.validLink(media.link)) {
                                        if (!silent) {
                                            media.val.link.fmt = true;
                                            challenge.hasError = true;
                                            challengeError = true;
                                            quest.hasError = true;
                                            quest.expanded = true;
                                            challenge.expanded = true;
                                        }
                                        isValid = false;
                                    }
                                }
                            }

                        }
                    });
                });
            };

            if (!$scope.program) {
                isValid = false;
            } else {
                if (!$scope.program.title) {
                    if (!silent) {
                        $scope.val.title.req = true;
                    }
                    isValid = false;
                }

                if (!$scope.program.sequencingTypeId) {
                    if (!silent) {
                        $scope.val.sequencing.type.req = true;
                    }
                    isValid = false;
                }

                if ($scope.program.sequencingTypeId == helpers.sequencingTypes.interval.id) {
                    if (!$scope.program.sequencingParameters.interval) {
                        if (!silent) {
                            $scope.val.sequencing.interval.req = true;
                        }
                        isValid = false;
                    } else if (isNaN(Number($scope.program.sequencingParameters.interval))) {
                        if (!silent) {
                            $scope.val.sequencing.interval.fmt = true;
                        }
                        isValid = false;
                    } else if (Number($scope.program.sequencingParameters.interval) < .5) {
                        if (!silent) {
                            $scope.val.sequencing.interval.min = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalPeriod) {
                        if (!silent) {
                            $scope.val.sequencing.period.req = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalStartTypeId) {
                        if (!silent) {
                            $scope.val.sequencing.intervalType.req = true;
                        }
                        isValid = false;
                    } else if ($scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && !$scope.program.sequencingParameters.startDate) {
                        if (!silent) {
                            $scope.val.sequencing.startDate.req = true;
                        }
                        isValid = false;
                    }
                    //else if ($scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && $scope.program.sequencingParameters.startDate) {
                    //    if (new Date($scope.program.sequencingParameters.startDate) < $scope.today) {
                    //        if (!silent) {
                    //            $scope.val.sequencing.startDate.min = true;
                    //        }
                    //        isValid = false;
                    //    }
                    //}
                }

                //check to see if program has levels. if not then Activity must start with type Base.
                if (!silent) {
                    if ($scope.program.levels.length > 0) {
                        //if level exist and have no activity, then logic is same as if there is no levels.
                        //levels must have activity to ignore nonlevel activity logic. 
                        var levelHasQuests = false;
                        _.each($scope.program.levels, function (level) {
                            if (level.quests.length > 0) {
                                levelHasQuests = true;
                            }
                        });

                        //if level has no quests then check is activity order is valid. 
                        if (!levelHasQuests) {
                            if ($scope.program.quests[0].baseOrBonus == 'O') {
                                if (!silent) {
                                    $scope.noLevelActivityOrder.levelHasNoActivity.req = true;
                                }
                                isValid = false;
                            }
                        }
                    } else {
                        //no levels then activity should start with base
                        if ($scope.program.quests[0].baseOrBonus == 'O') {
                            if (!silent) {
                                $scope.noLevelActivityOrder.firstActivityError.req = true;
                            }
                            isValid = false;
                        }
                    }
                }

                // Validate each quest
                angular.forEach($scope.program.quests, function (quest) {
                    validateQuest(quest);
                });

                angular.forEach($scope.program.levels, function (level) {
                    // Validate each quest
                    angular.forEach(level.quests, function (quest) {
                        validateQuest(quest);
                    });
                });

                //Below code checks if the current challege has errors (if so we stay here)
                //If not does the current quest have errors (if so we stay here)
                //If not does another challenge have errors? (if so take the user there)
                //If not does another quest have errors (if so take the user to the quests page)
                if (!silent) {
                    if (challengeError && (!currentQuest || !currentQuest.hasError)) {
                        var challengeFound = null;
                        angular.forEach($scope.program.levels, function (level) {
                            angular.forEach(level.quests, function (quest) {
                                angular.forEach(quest.challenges, function (challenge) {
                                    if (challenge.hasError && !challengeFound) {
                                        challengeFound = true;
                                        controllerState.go('levelQuest', {
                                            quest: quest,
                                            questIndex: level.quests.indexOf(quest),
                                            level: level,
                                            levelIndex: $scope.program.levels.indexOf(level)
                                        });
                                    }
                                })
                            })
                        });

                        if (!challengeFound) {
                            angular.forEach($scope.program.quests, function (quest) {
                                angular.forEach(quest.challenges, function (challenge) {
                                    if (challenge.hasError && !challengeFound) {
                                        challengeFound = true;
                                        controllerState.go('quest', {
                                            quest: quest,
                                            questIndex: $scope.program.quests.indexOf(quest),
                                        });
                                    }
                                })
                            })
                        }

                    }
                    else {
                        if (!isValid && !silent && (!currentQuest || !currentQuest.hasError)) {
                            controllerState.go('quests');
                        }
                    }
                }

                //check to see if all todos custom questions filled
                //if yes then break and go there.
                if (!silent) {
                    angular.forEach($scope.program.levels, function (level) {
                        angular.forEach(level.quests, function (quest) {
                            if (quest.type === 'T') {
                                _.each($scope.program.todos, function (todo) {
                                    if (todo.questId == quest.id) {
                                        _.each(todo.challenges, function (challenge) {
                                            if (challenge != null || challenge != undefined) {
                                                if (challenge.title == 'Todo Verification') {
                                                    if (challenge.questions && challenge.questions.length > 0) {
                                                        challenge.customeErr = false;//resets the err msg
                                                        if (challenge.questions[0].question == null || challenge.questions[0].question.trim().length <= 0) {
                                                            isValid = false;
                                                            $scope.$broadcast('customChallValidate');
                                                            //$scope.scrollToError();
                                                            //controllerState.go('levelQuest', {
                                                            //    quest: quest,
                                                            //    questIndex: level.quests.indexOf(quest),
                                                            //    level: level,
                                                            //    levelIndex: $scope.program.levels.indexOf(level)
                                                            //});
                                                        }
                                                    }
                                                }
                                            } else {
                                                isValid = false;
                                                $scope.$broadcast('customChallValidate');
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });

                    angular.forEach($scope.program.quests, function (quest) {
                        if (quest.type == 'T') {
                            _.each($scope.program.todos, function (todo) {
                                if (todo.questId == quest.id) {
                                    _.each(todo.challenges, function (challenge) {
                                        if (challenge != null || challenge != undefined) {
                                            if (challenge.title == 'Todo Verification') {
                                                if (challenge.questions && challenge.questions.length > 0) {
                                                    challenge.customeErr = false;//resets the err msg
                                                    if (challenge.questions[0].question == null || challenge.questions[0].question.trim().length <= 0) {
                                                        isValid = false;
                                                        $scope.$broadcast('customChallValidate');
                                                        //$scope.scrollToError();
                                                        //controllerState.go('quest', {
                                                        //    quest: quest,
                                                        //    questIndex: $scope.program.quests.indexOf(quest),
                                                        //});
                                                    }
                                                }
                                            }
                                        } else {
                                            isValid = false;
                                            $scope.$broadcast('customChallValidate');
                                        }
                                    });
                                }
                            });
                        }

                    });
                }

                if (isValid && !silent) {
                    if ($scope.program.sequencingParameters && $scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                        $scope.program.sequencingParameters.startDate = null;
                    }
                    _.each($scope.program.levels, function (level) {
                        if (level.sequencingParameters && level.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                            level.sequencingParameters.startDate = null;
                        }
                    })
                }

                if (!isValid && !silent) {
                    $scope.scrollToError();
                }
            }

            return isValid;
        };

        $scope.mediaHasError = function (media) {
            if (media.type == 'link')
                return media.val.link.req || media.val.link.fmt;
            return false;
        };

        $scope.$on('autoSaveNow', function () {
            $scope.autoSaveNow();
        });

        $scope.$watch(function () {
            return $scope.validate(true);
        }, function () {
            $scope.autoSaveNow();
        }, true);


        $scope.autoSaveNow = function () {
            if ($scope.validate(true)) {
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

        window.onbeforeunload = function (e) {
            if ($scope.programEditFrm.$dirty) {
                return 'There are unsaved changes on this page!'
            }
        };

        $scope.submit = function (e, status, publish, quest) { /*save functionality in quest Edit and challenge edit*/

            if(e) e.preventDefault();

            if (quest != null) {
                if (quest.type == 'T') {
                    $scope.$broadcast('saveTodo');
                }
                if(quest.type == 'I'){
                    $scope.$broadcast('saveInspire');
                }
              
            }
           
            return $q(function (resolve, reject) {
                if ($scope.validate(false, status == 'preview' ? false : publish, quest)) {
                    if ($scope.isQuestsValid == false) {
                        return;
                    }
                    $scope.program.status = status ? status : 'ready';

                    //If the program is being published, add the publish date, otherwise remove the publish date publish doesn't carry over from one version to the next
                    if (publish) {
                        $scope.program.published = (new Date()).toISOString();
                    } else {
                        if ($scope.program.published) {
                            $scope.program.wasPublished = true;
                        }
                        $scope.program.published = null;
                    }

                    //If the program is not of Interval sequencing type, then remove any parameters that were associated with that type.
                    if ($scope.program.sequencingTypeId != $scope.sequencingTypes.interval.id) {
                        $scope.program.sequencingParameters = null;
                    }

                    var continueSave = function () {
                        $scope.isSaving = true;

                        $scope.programEditFrm.$setPristine();

                        $http.post(authService.apiUrl + '/programs', $scope.program)
                            .success(function (program) {
                                //If status is preview then we dont need to initialize the UI again because we will be redirected
                                if (!(status == 'preview')) {
                                    //If we just saved from a restored program, we need to redirect to the new program without the restore= querystring from the restored program
                                    if ($scope.restoreId > 0) {
                                        $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/quests';
                                    } else {
                                        finishInit(program);
                                        resolve(program);
                                        controllerState.route();
                                        $timeout(function () {
                                            $('html,body').animate({ scrollTop: 0 }, 'slow');
                                            $scope.isSaving = false;
                                        }, 300);
                                    }
                                }
                                else {
                                    resolve(program);
                                }
                            });
                    };

                    //If the user is in a restored program, they could have moved into RESET mode without knowing it, verify before allowing save
                    if ($scope.restoreId > 0) {
                        if ($scope.program.cancelMigrateResultsOnPublish && !$scope.program.history[0].cancelMigrateResultsOnPublish) {
                            $scope.promptUnlockProgramThen(function () {
                                continueSave();
                            })
                        } else {
                            continueSave();
                        }
                    } else {
                        continueSave();
                    }
                }
                else {

                    var userErrorMsg = '';

                    if ($scope.noLevelActivityOrder.firstActivityError.req) {
                        userErrorMsg += $scope.noLevelActivityOrder.firstActivityErrorMsg;
                    }
                    if ($scope.noLevelActivityOrder.levelHasNoActivity.req) {
                        userErrorMsg += $scope.noLevelActivityOrder.levelHasNoActivityErrorMsg;
                    }

                        if ($scope.noLevelActivityOrder.firstActivityError.req || $scope.noLevelActivityOrder.levelHasNoActivity.req) {
                        $modal.open({
                            templateUrl: 'levelModalError.html',
                            controller: levelModalErrorControllerObj.levelModalErrorController,
                            size: 'sm',
                            resolve: {
                                initData: function () {
                                    return {
                                        title: 'Activity Type Order Error',
                                        text: userErrorMsg,
                                        okLabel: 'OK'
                                    }
                                }
                            }
                        });
                    }
                }

            });
            
        };

        $scope.togglePublished = function (e) {
            if (!$scope.validate()) return;

            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Publish Program?',
                            text: helpers.getPublishText($scope.program),
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }

            }).result.then(
                function () {
                    $scope.submit(e, null, true);
                });
        };

        $scope.restore = function (e, history) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/quests?restore=' + history.programId;
        };

        $scope.revert = function (e) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/quests';
        };

        $scope.$on('previewProgramTiles', function (e) {
            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user?preview=true'
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/quests';
                    $window.location = url;
                });
        });

        $scope.preview = function (e, quest, challenge, level) {
            e.preventDefault();
            e.stopPropagation();

            var questIndexInLevel;
            var questIndexInProgram;
            var levelIndexInProgram;
            var challengeIndexInQuest;

            //Savign the indexes so when we save the quest and all objects come back with new ID's we can find the new versions
            //of the quest that was passed into this function, and pass it's ID to the quest player
            if (level) {
                levelIndexInProgram = $scope.program.levels.indexOf(level);
            }
            if (quest && quest.levelId) {
                questIndexInLevel = level.quests.indexOf(quest);
            } else if (quest) {
                questIndexInProgram = $scope.program.quests.indexOf(quest);
            }

            if (challenge) {
                challengeIndexInQuest = quest.challenges.indexOf(challenge);
            }

            e.preventDefault();

            $scope.submit(e, 'preview', true, quest)
                .then(function (program) {
                    var preview = '/program/' + program.slug;
                    if (quest) {

                        //If we have a level find the quest with the matching index in the level, if we don't then get the quest with the index from the program.quests collection
                        var newQuest;
                        var newChallenge;
                        if (level) {
                            var newLevel = program.levels[levelIndexInProgram];
                        }
                        if (quest && quest.levelId) {
                            newQuest = newLevel.quests[questIndexInLevel];
                        } else if (quest) {
                            newQuest = program.quests[questIndexInProgram];
                        }
                        //If we have a challege find the newly saved version
                        if (challenge) {
                            newChallenge = newQuest.challenges[challengeIndexInQuest];
                        }
                      
                        //Send the new questId to the quest player
                        preview += '/' + 'quest/' + newQuest.id;

                        //If there is a challenge (from the quest) included in the preview then get it's index within the quest
                        if (challenge) {
                            if (challenge.type == 'finish') preview += '/challenge/finish';
                            else preview += '/challenge/' + newQuest.challenges.indexOf(newChallenge);
                        }
                    }
                    var url = '/user/program/preview?preview=' + encodeURIComponent(preview);

                    url += '&previewRet=' + encodeURIComponent('/program/' + program.slug + '/edit/quests');

                    if ($window.location.hash) {
                        url += '&previewRetHash=' + encodeURIComponent($window.location.hash.replace('#', ''));
                    }

                    $window.location = url;
                });
        };
    }]);

controllers.controller('AuthoringSuiteQuestsEditController', ['$scope', '$http', '$timeout', '$q', '$upload', '$modal', '$window', '$document', 'controllerState', 'authService', 'helperService',
    function ($scope, $http, $timeout, $q, $upload, $modal, $window, $document, controllerState, authService, helpers) {

        
        $scope.activityTemplates = [
            {
                id: 0,
                title: null,
                objective: null,
                type: 'L',
                baseOrBonus: 'B',
                backgroundImageUrl: null,
                featuredImageUrl: null,
                challenges: [],
                hasError: false,
                setActivity: null,
                val: {
                    title: { req: false },
                    program: { save: false },
                    objective: { req: false },
                    featuredImage: { type: false, size: false },
                    backgroundImage: { type: false, size: false },
                    challenges: { req: false }
                },
                menuOpen: false,
                expanded: true,
                uploading: {
                    tile: false,
                    bg: false
                },
                inspireAvailableToUser: false,
                storyAvailableToUser: false,
                encourageAvailableToUser: false,
                userAllowedMediaUpload: false
            },
            {
                id: 0,
                title: null,
                objective: null,
                type: 'T',
                baseOrBonus: 'B',
                points: 0,
                backgroundImageUrl: null,
                featuredImageUrl: null,
                challenges: [],
                hasError: false,
                setActivity: null,
                inspireAvailableToUser: false,
                storyAvailableToUser: false,
                encourageAvailableToUser: false,
                userAllowedMediaUpload: false,
                val: {
                    title: { req: false },
                    program: { save: false},
                    objective: { req: false },
                    featuredImage: { type: false, size: false },
                    backgroundImage: { type: false, size: false },
                    challenges: { req: false }
                },
                userTodos: {
                    bonusPoints: [],
                    results: [],
                    userMedia: [],
                    todo: {
                        title: null,
                        instructions: null,
                        verificationInstructions: null,
                        points: null,
                        dueByUser: true,
                        dueDate: null,
                        resourceUrl: null,
                        resourceName: null,
                        resourceDescription: null,
                        challenges: []
                    }
                },
                menuOpen: false,
                expanded: true,
                uploading: {
                    tile: false,
                    bg: false
                }
            },
            {
                id: 0,
                title: null,
                objective: null,
                type: 'I',
                baseOrBonus: 'B',
                points: 0,
                inspireAvailableToUser: true,
                storyAvailableToUser: true,
                encourageAvailableToUser: true,
                userAllowedMediaUpload: true,
                backgroundImageUrl: null,
                featuredImageUrl: null,
                challenges: [],
                hasError: false,
                setActivity: null,
                val: {
                    title: { req: false },
                    program: { save: false },
                    objective: { req: false },
                    featuredImage: { type: false, size: false },
                    backgroundImage: { type: false, size: false },
                    challenges: { req: false }
                },
                menuOpen: false,
                expanded: true,
                uploading: {
                    tile: false,
                    bg: false
                }
            }
            ];

        $scope.imageLoading = null;
        $scope.selectedQuest = null;
        $scope.questCanDrag = false;
        $scope.canEditEntity = helpers.canEditEntity;

        var initState = function () {
            $scope.quest = null;
        };

        controllerState.state('quests', {
            url: '/quests',
            onEnter: initState
        });

        var init = function () {
            $document.on('click', function (e) {
                $scope.$apply(function () {
                    $scope.closeAllQuestMenus(null);
                    $scope.selectedQuest = null;
                });
            });
        };
        init();

        $scope.getNumberOfMedia = function (quest) {
            var numMedia = 0;
            _.each(quest.challenges, function (challenge) {
                numMedia += $scope.getChallengeMediaCount(challenge);
            });
            return numMedia;
        };

        $scope.getNumberOfTodos = function (quest) {
            return 0;
        };

        $scope.questDragHandleDown = function (e, quest, level) {
            $scope.questCanDrag = true;
            $scope.selectedQuest = quest;
            $scope.selectedLevel = level;
        };
        $scope.questDragHandleUp = function (e, quest) {
            $scope.questCanDrag = false;
            $scope.selectedQust = null;
        };
        $scope.questMoved = function () {
            $scope.selectedQuest = null;
            $scope.selectedLevel = null;
        };
        $scope.questDrop = function (event, index, item) {
            var selectedQuest = $scope.selectedQuest;
            var selectedLevel = $scope.selectedLevel;


            if (!$scope.program.cancelMigrateResultsOnPublish) {
                var indexOfPublishedQuest = -1;

                //If neither of the above, quests can only be added to the last level after any published quests
                _.each($scope.program.quests, function (quest) {
                    if (quest.publishedAt || ($scope.program.cancelMigrateReultsOveridden && quest.id)) {
                        indexOfPublishedQuest = $scope.program.quests.indexOf(quest);
                    }
                });

                if (index <= indexOfPublishedQuest) {
                    return $scope.cancelEvent(event);
                }

                //If quest has already been published can't move it anywhere
                if (item.publishedAt || ($scope.program.cancelMigrateReultsOveridden && item.id)) {
                    return $scope.cancelEvent(event);
                }
            }


            if (selectedQuest) {
                //Timeout here to allow drag and drop time to add new item to the list before removing the old one, otherwise
                //new item doesn't get added at correct index
                $timeout(function () {
                    if (item.levelId) {
                        selectedLevel.quests = _.without(selectedLevel.quests, selectedQuest);
                        item.levelId = null;
                    } else {
                        $scope.program.quests = _.without($scope.program.quests, selectedQuest);
                    }
                });
            }
            $scope.selectedQuest = null;
            $scope.selectedLevel = null;
            $scope.questCanDrag = false;
            $scope.program.status = 'autoSaved'; 
            $scope.programEditFrm.$setDirty();
            return item;

        };

        $scope.levelQuestDrop = function (event, index, item, external, type, level) {
            if (!$scope.program.cancelMigrateResultsOnPublish) {
                //If no program quests, only allow add quests to the last level (or beyond) that has published quests
                var indexOfLastLevelWithPublishedQuests = -1;
                _.each($scope.program.levels, function (level) {
                    if (_.filter(level.quests, function (quest) {
                            return quest.publishedAt != null || ($scope.program.cancelMigrateReultsOveridden && quest.id)
                        }).length > 0) {
                        indexOfLastLevelWithPublishedQuests = $scope.program.levels.indexOf(level);
                    }
                });

                if (indexOfLastLevelWithPublishedQuests > $scope.program.levels.indexOf(level)) {
                    return $scope.cancelEvent(event);
                }

                //If quest has already been published can't move it anywhere
                if (item.publishedAt || ($scope.program.cancelMigrateReultsOveridden && item.id)) {
                    return $scope.cancelEvent(event);
                }

                var indexOfPublishedLevelQuest = -1;
                //If neither of the above, quests can only be added to the level after any published quests
                _.each(level.quests, function (quest) {
                    if (quest.publishedAt || ($scope.program.cancelMigrateReultsOveridden && quest.id)) {
                        indexOfPublishedLevelQuest = level.quests.indexOf(quest);
                    }
                });

                if (index <= indexOfPublishedLevelQuest) {
                    return $scope.cancelEvent(event);
                }

                var indexOfPublishedQuest = -1;

                //If neither of the above, quests can only be added to the last level after any published quests
                _.each($scope.program.quests, function (quest) {
                    if (quest.publishedAt || ($scope.program.cancelMigrateReultsOveridden && quest.id)) {
                        indexOfPublishedQuest = $scope.program.quests.indexOf(quest);
                    }
                });

                if (indexOfPublishedQuest > -1) {
                    return $scope.cancelEvent(event);
                }
            }


            var selectedQuest = $scope.selectedQuest;
            var selectedLevel = $scope.selectedLevel;

            if (selectedQuest) {
                //Timeout here to allow drag and drop time to add new item to the list before removing the old one, otherwise
                //new item doesn't get added at correct index
                $timeout(function () {
                    if (item.levelId) {
                        selectedLevel.quests = _.without(selectedLevel.quests, selectedQuest);
                    } else {
                        $scope.program.quests = _.without($scope.program.quests, selectedQuest);
                    }
                    item.levelId = level.id;
                });
            }
            $scope.selectedQuest = null;
            $scope.selectedLevel = null;
            $scope.questCanDrag = false;
            $scope.program.status = 'autoSaved';
            $scope.programEditFrm.$setDirty();
            return item;
        };


        $scope.selectLevel = function (level) {
            if ($scope.selectedLevel !== level) {
                $scope.selectedLevel = level;
                $scope.closeAllLevelMenus(level);
            }
        };

        $scope.selectQuest = function (quest, level) {
            if ($scope.selectedQuest !== quest) {
                $scope.selectedQuest = quest;
                $scope.closeAllQuestMenus(quest);
            }
            if (level) {
                $scope.selectLevel(level);
  if ($scope.selectedQuest !== quest) {
                $scope.selectedQuest = quest;
                $scope.closeAllQuestMenus(quest);
            }
            }
        };

        $scope.uploadProgramImage = function (files) {
            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            $scope.programImageVal.size = false;
            $scope.programImageVal.type = false;

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.programImageVal.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.programImageVal.size = true;
                return;
            }


            $scope.busy = true;
            $scope.imageLoading = 'program';

            $upload.upload({
                    url: authService.apiUrl + '/ui/square',
                    fields: {sizes: [100, 250, 600]},
                    file: file
                })
                .progress(function (e) {
                    /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                     console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                })
                .success(function (data) {

                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.program.imageUrl = data.url;
                            $scope.imageLoading = null;
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url + '/600x600';
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.removeProgramImage = function (e) {
            e.preventDefault();
            $scope.program.imageUrl = null;
            $scope.programEditFrm.$setDirty();
        };
               
        $scope.addQuest = function (e,type) {
            e.preventDefault();
            if (type == 'L') {
                var quest = {
                    id: 0,
                    title: null,
                    objective: null,
                    type: type,
                    baseOrBonus: 'B',
                    backgroundImageUrl: null,
                    featuredImageUrl: null,
                    challenges: [],
                    hasError: false,
                    setActivity: null,
                    val: {
                        title: { req: false },
                        program: { save: false },
                        objective: { req: false },
                        featuredImage: { type: false, size: false },
                        backgroundImage: { type: false, size: false },
                        challenges: { req: false }
                    },
                    menuOpen: false,
                    expanded: true,
                    uploading: {
                        tile: false,
                        bg: false
                    },
                    inspireAvailableToUser: false,
                    storyAvailableToUser: false,
                    encourageAvailableToUser: false,
                    userAllowedMediaUpload: false


                };
            }

            if (type == 'I') {
                var quest = {
                    id: 0,
                    title: null,
                    objective: null,
                    type: type,
                    baseOrBonus: 'B',
                    points: 0,
                    inspireAvailableToUser: true,
                    storyAvailableToUser: true,
                    encourageAvailableToUser: true,
                    userAllowedMediaUpload: true,
                    backgroundImageUrl: null,
                    featuredImageUrl: null,
                    challenges: [],
                    hasError: false,
                    setActivity: null,
                    val: {
                        title: { req: false },
                        program: { save: false },
                        objective: { req: false },
                        featuredImage: { type: false, size: false },
                        backgroundImage: { type: false, size: false },
                        challenges: { req: false }
                    },
                    menuOpen: false,
                    expanded: true,
                    uploading: {
                        tile: false,
                        bg: false
                    }
                };
            }

            if (type == 'T') {
                var quest = {
                    id: 0,
                    title: null,
                    objective: null,
                    type: type,
                    baseOrBonus: 'B',
                    points: 0,
                    backgroundImageUrl: null,
                    featuredImageUrl: null,
                    challenges: [],
                    hasError: false,
                    setActivity: null,
                    inspireAvailableToUser: false,
                    storyAvailableToUser: false,
                    encourageAvailableToUser: false,
                    userAllowedMediaUpload: false,
                    val: {
                        title: { req: false },
                        program: { save: false },
                        objective: { req: false },
                        featuredImage: { type: false, size: false },
                        backgroundImage: { type: false, size: false },
                        challenges: { req: false }
                    },
                    userTodos: {
                        bonusPoints: [],
                        results: [],
                        userMedia: [],
                        todo: {
                            title: null,
                            instructions: null,
                            verificationInstructions: null,
                            points: 0,
                            dueByUser: true,
                            dueDate: null,
                            resources : [],
                            //resourceUrl: null,
                            //resourceName: null,
                            //resourceDescription: null,
                            challenges: []
                        }
                    },
                    menuOpen: false,
                    expanded: true,
                    uploading: {
                        tile: false,
                        bg: false
                    }


                };
            }
           
            $scope.program.quests.push(quest);
            $scope.selectedQuest = quest;
            console.log(quest.type);

            $timeout(function () {
                var id = $('#quest' + ($scope.program.quests.length - 1));
                var bodyCanvas = $('#bodyCanvas');
                var authContainer = $('#authoring-container');

                var scrol = $(id).position().top + $(id).innerHeight() + $(authContainer).height();

                if (bodyCanvas[0] && id[0] && $.contains(bodyCanvas[0], id[0])) {
                    //$('#bodyCanvas').animate({ scrollTop: $(id).position().top + $(id).innerHeight() + $(authContainer)[0].scrollHeight }, 'slow');
                    $('#bodyCanvas').animate({ scrollTop: $('#authoring-container').scrollTop($('#authoring-container')[0].scrollHeight) }, '500');
                    $("html, body").animate({ scrollTop: $(document).height() }, 1000);
                }
            }, 0);

            $scope.programEditFrm.$setDirty();
        };

        $scope.dragStartScrollBottom = function (e) {
            if (e) e.stopPropagation;
            $('#bodyCanvas').animate({ scrollTop: $('#authoring-container').scrollTop($('#authoring-container')[0].scrollHeight) }, '500');
            $("html, body").animate({ scrollTop: $(document).height() }, 1000);
        };

        $scope.removeQuest = function (e, quest, level) {
            if (!$scope.canEditEntity(quest, $scope.program)) {
                return $scope.cancelEvent(e);
            }

            e.preventDefault();

            $scope.closeAllQuestMenus();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Activity?',
                            text: 'You are about to remove the selected Activity. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    if (level) {
                        level.quests = _.without(level.quests, quest);
                    } else {
                        $scope.program.quests = _.without($scope.program.quests, quest);
                    }
                    $scope.programEditFrm.$setDirty();
                });

        };
        $scope.editQuest = function (e, quest, level, index) {
            if (e) e.preventDefault();

            
            if ($scope.program.status != 'autoSaved') {
                if (!questValidate(quest)) {
                    if (!level) {
                        controllerState.go('quest', {
                            quest: quest,
                            questIndex: index
                        });
                    } else {
                        controllerState.go('levelQuest', {
                            quest: quest,
                            questIndex: index,
                            level: level,
                            levelIndex: $scope.program.levels.indexOf(level)
                        });
                    }
                }
            } else {
                quest.val.program.save = true;
                //alert("Please Save you application.");
            }

            
        };

        var questValidate = function (quest) {
            var hasError = false;
            quest.val.title.req = false;

            if (quest.title == null) {
                hasError = true;
                quest.val.title.req = true;
            } 
            

            return hasError;
        }


        $scope.toggleQuest = function (e, quest) {
            e.stopPropagation();
            quest.expanded = !quest.expanded;
        };
        $scope.toggleQuestMenu = function (e, quest) {
            e.stopPropagation();
            $scope.closeAllQuestMenus(quest);
            if (quest.menuOpen == null) {
                quest.menuOpen = false;
            }
            console.log("busy: " + $scope.busy + " , menuOPen: " + quest.menuOpen);
            quest.menuOpen = !quest.menuOpen;
            return;
        };
        $scope.closeAllQuestMenus = function (except) {
            if (!$scope.program) return;
            angular.forEach($scope.program.quests, function (quest) {
                if (except !== quest)
                    quest.menuOpen = false;
            });
            angular.forEach($scope.program.levels, function (level) {
                angular.forEach(level.quests, function (quest) {
                    if (except !== quest)
                        quest.menuOpen = false;
                })
            })
        };

        //checks to see if atleast base or bonus is checked else doesnt allow u to proceed
        $scope.baseBonusCheck = function (val, quest) {

            if (val == 'B') {
                if (quest.baseOrBonus != val) {
                    quest.baseOrBonus = val;
                }
            } else {
                if (quest.baseOrBonus != val) {
                    quest.baseOrBonus = val;
                }
            }
            
            console.log(quest);

        }

        $scope.uploadQuestImage = function (files, quest, which) {
            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            if (!helpers.validImageFile(file.name)) {
                quest.val.featuredImage.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                quest.val.featuredImage.size = true;
                return;
            }

            $scope.busy = true;
            quest.uploading[which] = true;

            var url = (which == 'tile') ? authService.apiUrl + '/ui/square' : authService.apiUrl + '/ui';

            $upload.upload({
                    url: url,
                    fields: {sizes: [100, 250, 600]},
                    file: file
                })
                .progress(function (e) {
                    /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                     console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                })
                .success(function (data) {
                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            if (which == 'tile') quest.featuredImageUrl = data.url;
                            else quest.backgroundImageUrl = data.url;
                            quest.uploading[which] = false;
                            if (!quest.uploading.tile && !quest.uploading.bg)
                                $scope.busy = false;
                        });
                    };
                    if (which == 'tile') img.src = data.url + '/250x250';
                    else img.src = data.url;
                    $scope.programEditFrm.$setDirty();
                });
        };
        $scope.removeQuestImage = function (e, quest, which) {
            e.preventDefault();
            if (which == 'tile') quest.featuredImageUrl = null;
            else quest.backgroundImageUrl = null;
            $scope.programEditFrm.$setDirty();
        };
    }]);

controllers.controller('AuthoringSuiteQuestEditController', ['$scope', '$modal', '$http', '$timeout', '$upload', '$document', '$window', 'controllerState', 'authService', 'helperService',
    function ($scope, $modal, $http, $timeout, $upload, $document, $window, controllerState, authService, helpers) {
        $scope.selectedInspire = 'Appreciate';
        $scope.selectedActivityType = 'Base'
        $scope.types = [];
        $scope.selectedChallenge = null;
        $scope.taToolbar = [
            ['h1', 'h2', 'h3', 'p', 'quote'],
            ['bold', 'italics', 'underline', 'strikeThrough'],
            ['ul', 'ol'],
            ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
            ['redo', 'undo', 'clear', 'html']
        ];
        $scope.selectedQuestion = null;
        $scope.questionTypesForDropdown = null;
        $scope.canEditEntity = helpers.canEditEntity;

        var initState = function (state, params) {

            if (!$scope.program || !$scope.programHasQuests($scope.program)) {
                controllerState.go('quests');
                return;
            }

            $scope.closeAllQuestMenus();
            $scope.closeAllChallengeMenus();

            if (params && params.quest) {
                $scope.quest = params.quest;
                $scope.quest.menuOpen = false;
                $scope.level = params.level;
            } else {
                if (!(Number(params.levelIndex) >= 0)) {
                    $scope.quest = $scope.program.quests[Number(params.questIndex)];
                } else {
                    var level = $scope.program.levels[Number(params.levelIndex)];
                    $scope.quest = level.quests[Number(params.questIndex)];
                    $scope.quest.menuOpen = false;
                    $scope.level = level;
                }
            }

            $timeout(function () {
                fitToContent('quest-desc', 500);
            }, 0);
        };

        controllerState
            .state('quest', {
                url: '/quest/:questIndex',
                parent: 'quests',
                onEnter: initState
            })
            .state('levelQuest', {
                url: '/level/:levelIndex/quest/:questIndex',
                parent: 'quests',
                onEnter: initState
            });

        $scope.clearValues = function () {
            $scope.quest = null;
            $scope.level = null;
        };

        var init = function () {
            $scope.loading.isLoading++;
            $http.get(authService.apiUrl + '/challenge-question-types')
                .success(function (result) {
                    $scope.questionTypesForDropdown = result.data;
                    $scope.stopLoading();
                });

            $document.on('click', function () {
                $scope.$apply(function () {
                    $scope.closeAllChallengeMenus(null);
                    $scope.selectedChallenge = null;
                    if (!$scope.quest) return;
                    angular.forEach($scope.quest.challenges, function (challenge) {
                        challenge.selectedQuestion = null;
                    });
                });
            });
        };
        init();

        $scope.questTitleChanged = function (quest) {
            if (quest.type == 'T') {
                _.each($scope.program.todos, function (todo) {
                    if (todo.questId != null) {
                        if (quest.id == todo.questId) {
                            todo.title = quest.title;
                        }
                    }
                });
            }

        }

        $scope.challengeDragHandleDown = function (e, challenge) {
            challenge.canDrag = true;
            $scope.selectedChallenge = challenge;
        };
        $scope.challengeDragHandleUp = function (e, challenge) {
            challenge.canDrag = false;
            $scope.selectedChallenge = null;
        };
        $scope.challengeMoved = function () {
            $scope.selectedChallenge = null;
        };
        $scope.challengeDrop = function (event, index, item, quest) {
            if (!$scope.program.cancelMigrateResultsOnPublish) {
                if (!$scope.canEditEntity(quest, $scope.program)) {
                    return $scope.cancelEvent(event);
                }
            }

            var selectedChallenge = $scope.selectedChallenge;

            if (selectedChallenge) {
                selectedChallenge.canDrag = false;

                //Timeout here to allow drag and drop time to add new item to the list before removing the old one, otherwise
                //new item doesn't get added at correct index
                $timeout(function () {
                    $scope.quest.challenges = _.without($scope.quest.challenges, selectedChallenge);
                    $scope.selectedChallenge = null;
                });
            }
            $scope.programEditFrm.$setDirty();
            return item;
        };
        $scope.challengeCanDrag = function (challenge) {
            if (challenge.type == 'finish') return false;
            return challenge.canDrag;
        };
        $scope.selectChallenge = function (challenge) {
            if ($scope.selectedChallenge !== challenge) {
                $scope.selectedChallenge = challenge;
                $scope.closeAllChallengeMenus(challenge);
            }
        };

        $scope.hasPrevious = function () {
            var hasPrev = false;
            //Search through all of the levels and quests that belong to levels, stop on the level with quests
            //If the first quest found in the level is not the current quests then we must have a previous quest
            //(because levels quests come before program quests, so if the first level quest is not our current quest then we have a previous)
            if ($scope.program && $scope.quest) {
                var level = _.find($scope.program.levels, function (level) {
                    if (level.quests.length > 0) {
                        var quest = level.quests[0];
                        if (quest != $scope.quest) {
                            hasPrev = true;
                        }
                        return true;
                    }
                });

                if (hasPrev) return hasPrev;

                //If we couldn't find a quest in the levels, and the current quest belongs to the program quests, check if the
                //first proram quest equals the current quest, if not then we have a previous quest in the program to go to
                if ($scope.program.quests.length > 1 && !$scope.quest.levelId) {
                    if ($scope.program.quests[0] != $scope.quest) {
                        return true;
                    }
                }

                //If we couldn't find a previous quest in the levels or in the program then there is no previous quest
                return false;
            }
        };

        $scope.previous = function (e) {
            e.preventDefault();

            //Using a model for these because I don't want to repeat the searchLevelsForQuest functionality and using a model
            //allows it to be passed by reference into that function and updated from within
            var model = {
                nextLevel: null,
                nextQuest: null,
                questIndex: null,
                levelIndex: null
            };

            var searchLevelsForQuest = function (model) {
                //While we still don't have the quest, but we do have a new level to try
                while (!model.nextQuest && model.nextLevel) {
                    //If the new level has quest, take the last one
                    if (model.nextLevel.quests.length > 0) {
                        model.nextQuest = model.nextLevel.quests[model.nextLevel.quests.length - 1];
                        model.questIndex = model.nextLevel.quests.length - 1;
                        model.levelIndex = $scope.program.levels.indexOf(model.nextLevel);
                    } else { //If the  new level didn't have quests, go to the level before it and loop again
                        var indexOfLevel = $scope.program.levels.indexOf(model.nextLevel);
                        model.nextLevel = $scope.program.levels[indexOfLevel - 1];
                    }
                }
            };

            //If quest belongs to a level
            if ($scope.quest && $scope.quest.levelId) {
                //Get the level
                model.nextLevel = _.findWhere($scope.program.levels, {id: Number($scope.quest.levelId)});
                var questIndexInLevel = model.nextLevel.quests.indexOf($scope.quest);

                //If the quest index is at least one, then we can get the previous quest from this level
                if (questIndexInLevel > 0) {
                    model.nextQuest = model.nextLevel.quests[questIndexInLevel - 1];
                    model.questIndex = questIndexInLevel - 1;
                    model.levelIndex = $scope.program.levels.indexOf(model.nextLevel);
                }

                //If we still don't have a quest, get the previous level and then start the backward search through levels to find a quest
                if (!model.nextQuest) {
                    var indexOfLevel = $scope.program.levels.indexOf(model.nextLevel);
                    model.nextLevel = $scope.program.levels[indexOfLevel - 1];

                    searchLevelsForQuest(model);
                }

            } else { //If the quest doesn't belong to a level
                var questIndexInProgram = $scope.program.quests.indexOf($scope.quest);
                if (questIndexInProgram > 0) {
                    //Check if the quest is not the first quest in the program, go to the quest before it
                    model.questIndex = questIndexInProgram - 1;
                    model.nextQuest = $scope.program.quests[model.questIndex];
                } else { //If there is no previous quest in the program, loop through the levels to look for one
                    //We need to find the last quest from a level, so start with the last level
                    model.nextLevel = $scope.program.levels[$scope.program.levels.length - 1];
                    searchLevelsForQuest(model);
                }
            }

            $scope.goToNextQuest(model.nextQuest, model.questIndex, model.levelIndex);

            $('html,body').animate({scrollTop: 0}, 'slow');
        };

        $scope.hasNext = function () {
            var hasNext = false;

            //Search through all of the levels and quests that belong to levels, stop on the level with quests
            //If the first quest found in the level is not the current quests then we must have a previous quest
            //(because levels quests come before program quests, so if the first level quest is not our current quest then we have a previous)
            if ($scope.program && $scope.quest) {

                //If the current quest is in a level but we don't have program quests, then check the level for quest after the current quest
                if ($scope.quest.levelId) {

                    //If the current quest is in a level, and there are program quests, then we have a next quest (because proram quests come after level quests)
                    if ($scope.program.quests.length > 0) {
                        return true;
                    }

                    var currentLevel = _.findWhere($scope.program.levels, {id: Number($scope.quest.levelId)});
                    var indexOfCurrentLevel = $scope.program.levels.indexOf(currentLevel);

                    //If the current level has a quest after the current quest, return true
                    if (currentLevel.quests.indexOf($scope.quest) < currentLevel.quests.length - 1) {
                        return true;
                    } else {
                        //Otherwise loop through the levels after the current level and look for a quest
                        var level = _.find($scope.program.levels, function (level) {
                            if (level.quests.length > 0 && $scope.program.levels.indexOf(level) > indexOfCurrentLevel) {
                                var quest = level.quests[0];
                                if (quest != $scope.quest) {
                                    hasNext = true;
                                }
                                return true;
                            }
                        })
                    }
                } else { //The current quest does not belong to a level, check if there is a quest after it in the program, if so then there is a nextQuest
                    if ($scope.program.quests.length > $scope.program.quests.indexOf($scope.quest) + 1) {
                        hasNext = true;
                    }
                }

                return hasNext;
            }
        };

        $scope.next = function (e) {
            e.preventDefault();
            var nextQuest;
            var levelIndex;
            var questIndex;

            //If the quest belongs to a  level
            if ($scope.quest.levelId) {
                var level = _.findWhere($scope.program.levels, {id: Number($scope.quest.levelId)});
                var levelIndexInProgram = $scope.program.levels.indexOf(level);
                var questIndexInLevel = level.quests.indexOf($scope.quest);

                //If the level has a quest after the current one then, use it for the next quest
                if (level.quests.length > (questIndexInLevel + 1)) {
                    nextQuest = level.quests[questIndexInLevel + 1];
                    levelIndex = $scope.program.levels.indexOf(level);
                    questIndex = questIndexInLevel + 1;
                    level = null;
                } else { //If there was no quest in the current level, get the next level
                    level = $scope.program.levels[levelIndexInProgram + 1];
                }

                //If the current level didn't have a quest after the current one, and we have a next level
                while (level && !nextQuest) {
                    //If the next level has any quests, use the first one as our next quest
                    if (level.quests.length > 0) {
                        nextQuest = level.quests[0];
                        levelIndex = $scope.program.levels.indexOf(level);
                        questIndex = 0;
                        level = null;
                    } else { //Otherwise if there is another level use it for the next loop
                        if ($scope.program.levels.length > (levelIndexInProgram + 1)) {
                            questIndexInLevel = -1;
                            level = $scope.program.levels[levelIndexInProgram + 1];
                        } else {
                            //There are no more levels, break the loop
                            level = null;
                        }
                    }
                }
                //If we went through all the levels and didn't find a next quest, then the next quest must be in the program quests
                //So we take the first one
                if (!nextQuest) {
                    nextQuest = $scope.program.quests[0];
                    questIndex = 0;
                }
            } else { //The quest does not belong to a level, there must be a quest after it in the program so retrieve it
                var indexOfQuestInProgram = $scope.program.quests.indexOf($scope.quest);
                if ($scope.program.quests.length > indexOfQuestInProgram + 1) {
                    nextQuest = $scope.program.quests[indexOfQuestInProgram + 1];
                    questIndex = indexOfQuestInProgram + 1;
                }
            }


            $scope.goToNextQuest(nextQuest, questIndex, levelIndex);

            $('html,body').animate({scrollTop: 0}, 'slow');
        };

        $scope.goToNextQuest = function (nextQuest, questIndex, levelIndex) {
            //If there is no level index then the quest we found is a program quest, only need the questIndex to find it on a refresh
            if (levelIndex == null) {
                controllerState.go('quest', {
                    quest: nextQuest,
                    questIndex: questIndex
                });
            } else {
                //If there was a level index then we have a level quest, only reason to keep these seperate is for page refreshes so the page can use
                //the indexes to find the correct quest within the correct level
                controllerState.go('levelQuest', {
                    quest: nextQuest,
                    questIndex: questIndex,
                    levelIndex: levelIndex
                });
            }
        };

        $scope.backToQuests = function (e) {
            e.preventDefault();
            e.stopPropagation();
            controllerState.go('quests');
           
        };

        $scope.addChallenge = function (e, type) {
            e.preventDefault();

            var challenge = {
                id: 0,
                type: type,
                title: null,
                notes: null,
                questions: [],
                media: [],
                uploadingMedia: false,
                hasError: false,
                val: angular.copy($scope.challengeValTemplate),
                menuOpen: false,
                expanded: true,
                addMedia: {}
            };

            if (!$scope.hasFinishChallenge($scope.quest)) $scope.quest.challenges.push(challenge);
            else $scope.quest.challenges.splice($scope.quest.challenges.length - 1, 0, challenge);

            if (type == 'finish') {
                challenge.title = 'Finish';

                challenge.media.push({
                    type: 'link',
                    link: null
                });
                challenge.media.push({
                    type: 'resource',
                    name: null,
                    date: null,
                    mimeType: null,
                    url: null,
                    ref: null
                });
                challenge.canUploadContent = false;
            }

            $scope.quest.selectedChallenge = challenge;

            $timeout(function () {
                var id = $('#challenge' + ($scope.quest.challenges.length - 1) + 'quest' + ($scope.quest.levelId ? $scope.getQuestIndexInLevel($scope.quest, $scope.program) : $scope.getQuestIndexInProgram($scope.quest, $scope.program)) + 'level' + ($scope.quest.levelId ? $scope.quest.levelId : '0'));
                var bodyCanvas = $('#bodyCanvas');

                if (bodyCanvas[0] && id[0] && $.contains(bodyCanvas[0], id[0])) {
                    $('#bodyCanvas').animate({scrollTop: $(id).position().top + +$(id).innerHeight()}, 'slow');
                }
            }, 0);

            $scope.programEditFrm.$setDirty();
        };
        $scope.removeChallenge = function (e, index) {
            if (!$scope.canEditEntity($scope.quest, $scope.program)) {
                return $scope.cancelEvent(e);
            }

            e.preventDefault();

            $scope.closeAllChallengeMenus();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Challenge?',
                            text: 'You are about to remove the selected challenge. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $scope.quest.challenges.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });

        };

        $scope.toggleChallenge = function (e, challenge) {
            e.stopPropagation();
            challenge.expanded = !challenge.expanded;
            $scope.selectedChallenge = challenge;
        };
        $scope.toggleChallengeMenu = function (e, challenge) {
            e.stopPropagation();
            if (!challenge.menuOpen) {
                challenge.menuOpen = true;
                $scope.selectedChallenge = challenge;
                return $scope.closeAllChallengeMenus(challenge);
            }
            $scope.closeAllChallengeMenus(null);
        };
        $scope.closeAllChallengeMenus = function (except) {
            if (!$scope.quest) return;
            angular.forEach($scope.quest.challenges, function (challenge) {
                if (except !== challenge) challenge.menuOpen = false;
                if (typeof challenge.addMedia !== 'undefined') challenge.addMedia.in = false;
                angular.forEach(challenge.questions, function (question) {
                    question.menuOpen = false;
                    question.typeOpen = false;
                });
            });
        };

        $scope.offMenuClick = function (e) {
            $scope.closeAllChallengeMenus(null);
        };

        $scope.uploadDownloadContent = function (files, challenge) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            if (!helpers.validUploadFile(file.name)) {
                challenge.val.downloadContent.type = true;
                return;
            }

            // Check size
            if (file.size > helpers.maxFileSize) {
                challenge.val.downloadContent.size = true;
                return;
            }

            $scope.busy = true;
            challenge.uploadingDownloadContent = true;

            $upload.upload({url: authService.apiUrl + '/ur', file: file})
                .success(function (data) {
                    challenge.media[1].name = file.name;
                    challenge.media[1].date = file.lastModifiedDate;
                    challenge.media[1].mimeType = file.type;
                    challenge.media[1].url = data.url;
                    challenge.media[1].ref = data.ref;

                    $scope.programEditFrm.$setDirty();

                    $timeout(function () {
                        challenge.uploadingDownloadContent = false;
                        $scope.busy = false;
                    }, 300);
                });
        };

        $scope.removeDownloadContent = function (e, challenge) {
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
                    challenge.media[1].name = null;
                    challenge.media[1].date = null;
                    challenge.media[1].mimeType = null;
                    challenge.media[1].url = null;
                    challenge.media[1].ref = null;
                    $scope.programEditFrm.$setDirty();
                });
        };

    }]);

controllers.controller('AuthoringSuiteDoEditController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', 'authService', 'helperService', 'controllerState',
    function ($scope, $http, $timeout, $q, $modal, $upload, authService, helpers, controllerState) {
        $scope.canEditEntity = helpers.canEditEntity;
        $scope.todo = null;
         window.onbeforeunload = function (e) {
            if ($scope.programEditFrm.$dirty) {
                return 'There are unsaved changes on this page!'
            }
        };

         //watch for #scope.quest changes. if quest.type = T then run the DoInitStart func.
         $scope.$watch('quest', function () {
             if ($scope.quest.type == 'T') {
                 $scope.doInitStart();
             }
         }, false);

         $scope.doInitStart = function () {
         
             $scope.setSelectedProgram($scope.program);
             $scope.todo = [];
          

             $scope.predefinedVerificationQuestions = $scope.program.todoVerificationQuestionTemplates;
             $scope.predefinedVerificationQuestions.push({
                 id: 'custom',
                 value: 'Custom'
             });

             _.each($scope.program.todos, function (todo) {
                 if (todo.questId != null) {
                     if ($scope.quest.id == todo.questId) {
                         $scope.todo = todo;
                     }
                 }
             });

             configTodo($scope.todo);
             
             $scope.triggerSubmitClick();
         };

         var configTodo = function (todo) {

       

             $scope.todo = [];
             var newTodo = {
                 id: todo.id,
                 allowUserMediaUpload: false,
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
                 //resource: {
                 //    url: todo.resourceUrl,
                 //    name: todo.resourceName,
                 //    description: todo.resourceDescription,
                 //    uploading: false
                 //},
                 resources : [],
                 requirements: angular.copy(todo.requirements),
                 expanded: false,
                 val: {
                     title: { req: false },
                     resource: { type: false, size: false },
                     dueDate: { req: false }
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
                             canUploadContent: false,
                             sequence: null,
                             points: null,
                             todoId: todo.id,
                             userMedia: null,
                             questions: [{
                                 question: challenge.questions[0].question
                             }]

                         }
                     };

                     newTodo.verifications.push(newVerification);
                 }

             });

             //$scope.todos.push(newTodo);
             $scope.todo = newTodo;
             console.log($scope.todo);


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
                        configTodo($scope.todo);
                       
                    // $scope.resetVal();
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

        //$scope.$on("DoTitleChanged", function (e, quest) {
        //    $scope.todo.title = quest.title;
        //});

        //$scope.$watch(function () {
        //    saveTodoTOprogam();
        //    return validate(true);//
        //}, function () {
        //    $scope.autoSaveNow();
        //}, true);


        $scope.autoSaveNow = function () {
            if (validate(true)) {
                if (!$scope.restoreId && $scope.programEditFrm.$dirty) {
                  //  configTodo($scope.todo);
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
        $scope.triggerClick = function () {
            setTimeout(function () {
                document.getElementById('triggerInput').click()
                $scope.clicked = true;
            }, 0);
        }
        //$scope.restore = function (e, history) {
        //    e.preventDefault();
        //    $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/todos?restore=' + history.programId;
        //};

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
            //console.log($scope.todo);
            $scope.resetVal();
            validate();
            //console.log(validate());
            $scope.programEditFrm.$setDirty();
        };
     
   
        
        //$scope.uploadDownloadContent = function (files, todo) {
        //    $scope.programEditFrm.$setDirty();
        //    $scope.resetVal();
        //    if (!files || files.length <= 0) return;
        //    var file = files[0];

        //    ////check file type
        //    //if (!helpers.validUploadFile(file.name)) {
        //    //    todo.val.resource.type = true;
        //    //    return;
        //    //}


        //    //// Check size
        //    //if (file.size > helpers.maxFileSize) {
        //    //    todo.val.resource.size = true;
        //    //    //  checkerror();
        //    //    return;
        //    //}

        //    //$scope.busy = true;
        //    //todo.resource.uploading = true;
        //    var mediaType;

        //    // Check type
        //    if (!helpers.validVideoFile(file.name)) {
        //        if (!helpers.validAudioFile(file.name)) {
        //            if (!helpers.validImageFile(file.name)) {
        //                todo.val.resource.type = true;

        //                return;
        //            } else {
        //                mediaType = 'image';
        //                // Check size
        //                if (file.size > helpers.maxImageSize) {
        //                    todo.val.resource.size = true;
        //                    return;
        //                }
        //            }
        //        } else {
        //            mediaType = 'audio';
        //            // Check size
        //            if (file.size > helpers.maxAudioSize) {
        //                todo.val.resource.size = true;
        //                return;
        //            }
        //        }
        //    } else {
        //        mediaType = 'video';
        //        // Check size
        //        if (file.size > helpers.maxVideoSize) {
        //            todo.val.resource.size = true;
        //            return;
        //        }
        //    }

        //    $scope.busy = true;
        //    todo.loading = true;
        //    $upload.upload({ url: authService.apiUrl + '/ur', file: file })
        //        .success(function (data) {
        //            todo.resources.push({
        //                name: file.name,
        //                url: data.url,
        //                description: null,
        //                uploading: false
        //            });
        //            $scope.programEditFrm.$setDirty();
        //            $timeout(function () {
        //                todo.loading = false;
        //                $scope.busy = false;
        //            }, 300);
        //        });
             
        //};

        //$scope.removeDownloadContent = function (e, todo, index) {
        //    e.preventDefault();

        //    $modal.open({
        //        templateUrl: 'confirmModal.html',
        //        controller: confirmModalControllerObj.confirmModalController,
        //        size: 'sm',
        //        resolve: {
        //            initData: function () {
        //                return {
        //                    title: 'Remove Content?',
        //                    text: 'You are about to remove the download content. Are you sure you want to continue?',
        //                    ok: 'Yes', cancel: 'No'
        //                }
        //            }
        //        }
        //    }).result.then(
        //        function () {
        //            //todo.resource.url = null;
        //            //todo.resource.name = null;
        //            //todo.resource.description = null;
        //            todo.resources.splice(index, 1);
        //            $scope.programEditFrm.$setDirty();
        //        });

        //};

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

        $scope.addVerification = function () {
            $scope.todo.verifications.push({
                customQuestion: null,
                customErr: false,
                predefinedQuestionId: null
            });
            $scope.programEditFrm.$setDirty();
        };

        $scope.removeVerification = function (verification) {
            //do not outright remove, create summy record-
            $scope.todo.verifications = _.without($scope.todo.verifications, verification);

            ////create verification with no challenge/ questions
            //var challenge = {
            //    type: 'general',
            //    title: 'Todo Verification',
            //    instructions: null,
            //    finishText: null,
            //    notes: null,
            //    canUploadContent: true,
            //    sequence: null,
            //    points: null,
            //    custom: false,
            //    customeErr: false,
            //    todoId: $scope.$parent.id,
            //    questions: [}]
            //};

            //verification.challenge = challenge;




            $scope.programEditFrm.$setDirty();
        };

        $scope.predefinedQuestionSelected = function (verification) {
            if (verification.predefinedQuestionId == 'custom') {
                $scope.addChallenge(verification, null);
            } else {
                var question = _.findWhere($scope.predefinedVerificationQuestions, { id: verification.predefinedQuestionId });
                $scope.addChallenge(verification, question.value);
            }
            verification.custom = true;
            $scope.programEditFrm.$setDirty();
            
            //verification.customErr = true;
            //verification.customErr = false;

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
                custom: false,
                customeErr: false,
                todoId: $scope.$parent.id,
                questions: [{
                    question: question
                }]
            };

            verification.challenge = challenge;
        };

        $scope.toggleUserMedia = function () {

            $scope.todo.allowUserMediaUpload = !$scope.todo.allowUserMediaUpload;
            $scope.quest.userAllowedMediaUpload = !$scope.quest.userAllowedMediaUpload;

            console.log($scope.todo);

            $scope.programEditFrm.$setDirty();
        };

        $scope.resetVal = function () {
            $scope.todo.val = {
                title: { req: false },
                points: { fmt: false },
                dueDate: { req: false },
                resource: { type: false, size: false }
            };
            //console.log("reset called" + $scope.todo.val);
        };
        var checkerror = function(){
            var isValid = true;
            if (!$scope.todo.val.resource.size) {
               
                $scope.todo.val.resource.size = true;
                $scope.todo.expanded = true;
            }
                isValid = false;
          
            };
        var validate = function (silent) {
            var isValid = true;

            if (!silent) {
                $scope.resetVal();
             
            }
           
         
            if (!$scope.todo.title || $scope.todo.title.trim().length <= 0) {
                if (!silent) {
                    $scope.todo.val.title.req = true;
                    $scope.todo.expanded = true;
                }
                isValid = false;
            }
            if ($scope.todo.points && $scope.todo.points.trim().length > 0) {
                if (!helpers.validInteger($scope.todo.points)) {
                    if (!silent) {
                        $scope.todo.val.points.fmt = true;
                        $scope.todo.expanded = true;
                    }
                    isValid = false;
                }
                else {
                    var i = parseInt($scope.todo.points);
                    if (i < 1 || i > 1000) {
                        if (!silent) {
                            $scope.todo.val.points.range = true;
                            $scope.todo.expanded = true;
                        }
                        isValid = false;
                    }
                }
            }

            if ($scope.todo.due.byAuthor && !$scope.todo.due.date) {
                if (!silent) {
                    $scope.todo.val.dueDate.req = true;
                    $scope.todo.expanded = true;
                }
                isValid = false;
            }
            

            if ($scope.todo.due.byUser) {
                 
                $scope.todo.val.dueDate.req = false;
                isValid = true;
            }
            else {

                if ($scope.todo.due.date == null){
                    $scope.todo.val.dueDate.req = true;       
                    isValid = false;
                }else {

                    $scope.todo.val.dueDate.req = false;
                    isValid = true;
                }
            }
            if ($scope.todo.val.resource.size) {
                isValid = true;
            }
            if ($scope.todo.val.resource.type) {
                isValid = true;
            }

            return isValid;
        };

        $scope.$on('customChallValidate', function (e) {

            $scope.customQuestionValid();

        });
        $scope.customQuestionValid = function () {

            _.each($scope.todo.verifications, function (verification) {
                if (verification.challenge != undefined) {
                    if (verification.challenge.questions[0].question == null || verification.challenge.questions[0].question.trim().length <= 0) {
                        verification.customErr = true;
                    } else {
                        verification.customErr = false;
                    }
                } else {
                    verification.customErr = true;
                }
                
            });
           
            $scope.scrollToError();
            //_.each($scope.todo.verifications, function (verification) {
            //    if (verification.predefinedQuestionId == 'custom') {          
            //        if (verification.challenge.questions[0].question == null || verification.challenge.questions[0].question.trim().length <= 0 || verification.challenge.questions[0].question == '') {
            //                verification.customErr = true;
            //                isValid = false;
            //                //$scope.$parent.isQuestsValid = false;
            //            } else {
            //                verification.customErr = false;
            //                isValid = true;
            //                //$scope.$parent.isQuestsValid = true;
            //        }
            //    }
            //    $scope.scrollToError();
            //});

        };


        $scope.triggerSubmitClick = function () {
            $scope.autoSaveNow();
        }

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
                        $http.post(authService.apiUrl + '/programs/remove-autosaved', { linkId: $scope.program.linkId }).then(function () {
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
        $scope.addMedia = function (e, todo) {
            e.stopPropagation();

            if (!todo.addMedia) {
                todo.addMedia = {
                    in: false,
                    val: {
                        req: false,
                        fmt: false
                    },
                    link: null
                };
            }

            var btnElm = angular.element(e.target);
            var popupElm = btnElm.next('.add-media-popup');
            popupElm.css('left', btnElm.outerWidth() + (15 + 30));

            angular.element('.add-media .val').addClass('ng-hide');
            var st = !todo.addMedia.in;
            todo.addMedia.in = st;
            $scope.programEditFrm.$setDirty();
        };
        $scope.uploadMedia = function (files, todo) {
            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            var mediaType;

            // Check type
            if (!helpers.validVideoFile(file.name)) {
                if (!helpers.validAudioFile(file.name)) {
                    if (!helpers.validImageFile(file.name)) {
                        //challenge.val.media.type = true;
                        $scope.uploadDownloadContent(files, todo);
                        return;
                    } else {
                        mediaType = 'image';
                        // Check size
                        if (file.size > helpers.maxImageSize) {
                            todo.val.media.size = true;
                            return;
                        }
                    }
                } else {
                    mediaType = 'audio';
                    // Check size
                    if (file.size > helpers.maxAudioSize) {
                        todo.val.media.size = true;
                        return;
                    }
                }
            } else {
                mediaType = 'video';
                // Check size
                if (file.size > helpers.maxVideoSize) {
                    todo.val.media.size = true;
                    return;
                }
            }

            $scope.busy = true;
            todo.isLoading = true;

            var url = authService.apiUrl;
            if (mediaType == 'video') url += '/uv';
            else if (mediaType == 'audio') url += '/ua';
            else url += '/ui';

            $upload.upload({ url: url, file: file })
                .progress(function (e) {
                    /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                     console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                })
                .success(function (data) {
                    $scope.programEditFrm.$setDirty();
                    if (mediaType == 'audio') {
                     
                        var media = {
                            type: mediaType,
                            name: file.name,
                            date: file.lastModifiedDate,
                            mimeType: file.type,
                            url: data.url,
                            ref: data.ref,
                            source: 'system',
                            canDrag: false,
                            encoding: true,
                            description: null,
                            uploading: false
                        };
                        todo.resources.push(media);

                        $timeout(function () {
                            todo.isLoading = false;
                            todo.addMedia.in = false;
                            $scope.busy = false;
                        }, 300);
                    }
                    else {
                        var img = new Image();
                        img.onload = function () {
                            $scope.$apply(function () {
                                var media = {
                                    type: mediaType,
                                    name: file.name,
                                    date: file.lastModifiedDate,
                                    mimeType: file.type,
                                    url: data.url,
                                    ref: data.ref,
                                    source: 'system',
                                    canDrag: false,
                                    encodings: [],
                                    description: null,
                                    uploading: false
                                };
                                if (mediaType == 'video') $scope.checkEncoding(media);
                                todo.resources.push(media);
                                todo.addMedia.in = false;

                                $timeout(function () {
                                    todo.isLoading = false;
                                    $scope.busy = false;
                                }, 300);
                            });
                        };
                        img.src = data.url;
                    }
                })
                .catch(function (ex) {
                    todo.isLoading = false;
                });
        };
        $scope.uploadDownloadContent = function (files, todo) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];



            $scope.busy = true;
            todo.isLoading = true;

            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
                .success(function (data) {

                    var userMedia = {
                        type: 'resource',
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref,
                        isNew: true,
                        description: null,
                        uploading: false
                    };


                    todo.resources.push(userMedia);

                    $scope.programEditFrm.$setDirty();

                    $timeout(function () {
                        todo.isLoading = false;
                        $scope.busy = false;
                    }, 300);
                });
        };
        $scope.selectMediaLink = function (e, todo, ref) {
            e.preventDefault();
            e.stopPropagation();

            $scope.resetVal();
            var isValid = true;
            if (!todo.addMedia.link) {
                todo.addMedia.val.req = true;
                isValid = false;
            }
            else {

                if (ref == 'YouTube') {
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test(todo.addMedia.link)) {
                        todo.addMedia.val.fmt = true;
                        isValid = false;
                    }
                }
                else {
                    todo.addMedia.val.src = true;
                    isValid = false;
                }
            }

            if (!isValid) return;

            if (ref == 'YouTube') {

                if (todo.addMedia.link.toUpperCase().indexOf('QUIZREVOLUTION.COM') != -1 && todo.addMedia.link.toUpperCase().indexOf('HTTP:') != -1) {
                    todo.addMedia.link = todo.addMedia.link.replace('http://', 'https://www.');
                    todo.addMedia.link = todo.addMedia.link.replace('http://', 'https://www.');
                }
                ;

                // Get the source url
                var r = /src="([_\-a-z0-9:\/\.]+)"/gi;
                var m = r.exec(todo.addMedia.link);

                var name = null;
                var parts = null;
                var videoId = null;

                if (m) {
                    name = m[1];
                    parts = name.split('/');
                    videoId = parts[parts.length - 1];
                }

                var media = {
                    type: 'video',
                    name: name,
                    date: new Date(),
                    mimeType: 'video/*',
                    iframe: todo.addMedia.link,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg',
                    description: null,
                    uploading: false
                };
                todo.resources.push(media);

                todo.addMedia.in = false;
                todo.addMedia.link = null;
            }
        };

   
        $scope.addLink = function (todo) {
            var media = {
                type: 'link',
                link: null,
                canDrag: false,
                val: {
                    link: {
                        req: false,
                        fmt: false
                    }
                }
            };
            todo.resources.push(media);
            $scope.programEditFrm.$setDirty();
        };
        $scope.removeMedia = function (e, todo, index) {
            e.preventDefault();
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Media?',
                            text: 'You are about to remove the selected media. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                   todo.resources.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });

        };
        $scope.selectDoMedia = function (todo, media) {
            todo.selectedMedia = media;
        };
        $scope.challengeMediaHandleDown = function (e, todo, media) {
            media.canDrag = true;
            todo.selectedMedia = media;
        };
        $scope.challengeMediaHandleUp = function (e, todo, media) {
            media.canDrag = false;
        };
        $scope.challengeMediaDrop = function (event, index, item, external, type, name, todo) {
            todo.selectedMedia = item;
            todo.selectedMedia.canDrag = false;
            $scope.programEditFrm.$setDirty();
            return item;
        };
        $scope.$on('saveTodo', function (e) {

            saveTodoTOprogam();

        });

        var saveTodoTOprogam = function () {

            //first find if todo being saved is in the program object. if not then create and push
            var isTodoInProgObj = false;
            _.each($scope.program.todos, function (todo) {
                if (todo.questId != null) {
                    if ($scope.quest.id == todo.questId) {
                        isTodoInProgObj = true;
                    }
                }
            });

            _.each($scope.program.todos, function (todo) {
                if (todo.questId != null) {
                    if ($scope.quest.id == todo.questId) {
                        //var isValid = true;
                        todo.title = $scope.quest.title;
                        todo.dueByUser = $scope.todo.due.byUser;
                        todo.dueDate = $scope.todo.due.date ? $scope.todo.due.date : null;
                        todo.instructions = $scope.todo.instructions;
                        //todo.resourceDescription = $scope.todo.resource.description;
                        //todo.resourceName = $scope.todo.resource.name;
                        //todo.resourceUrl = $scope.todo.resource.url;
                        todo.resources = $scope.todo.resources;
                        todo.validate = $scope.todo.validate;
                        todo.verificationInstructions = $scope.todo.verificationInstructions;

                        //clear the challenges and repush all the data. 
                        todo.challenges = [];

                        //verify all verification have questions
                        if (validate(false)) {
                            //add all verification challenge. 
                            _.each($scope.todo.verifications, function (challenge) {
                                todo.challenges.push(challenge.challenge);
                            });
                        

                            //always save a feedback challenge
                            var challenge = {
                                type: 'general',
                                title: 'Todo Feedback',
                                instructions: null,
                                finishText: null,
                                notes: null,
                                canUploadContent: false,
                                sequence: null,
                                points: null,
                                todoId: todo.id,
                                questions: null,
                                userMedia: null

                            };

                            todo.challenges.push(challenge);

                            //if userMEdiaUpload is enabled then add that also.
                            if ($scope.quest.userAllowedMediaUpload == true) {
                                var challenge = {
                                    type: 'general',
                                    title: 'Todo Media Upload',
                                    instructions: null,
                                    finishText: null,
                                    notes: null,
                                    canUploadContent: false,
                                    sequence: null,
                                    points: 0,
                                    todoId: $scope.$parent.id,
                                    questions: null,
                                    userMedia: null

                                };

                                todo.challenges.push(challenge);
                            }
                        }
                        else {                        
                            $scope.$parent.isQuestsValid = false;
                        }
                        console.log(todo);
                    }
                }
            });
        };
    }]);

controllers.controller('AuthoringSuiteInspireEditController', ['$scope', '$modal', '$http', '$timeout', '$upload', '$document', '$window', 'controllerState', 'authService', 'helperService',
    function ($scope, $modal, $http, $timeout, $upload, $document, $window, controllerState, authService, helpers) {
        $scope.canEditEntity = helpers.canEditEntity;
        $scope.inspireAvailableToUser = true;
        $scope.storyAvailableToUser = true;
        $scope.encourageAvailableToUser = true;
        $scope.userAllowedMediaUpload = true;
        $scope.selectedInspierEditActivityType = 'B';
        $scope.loadQuest = function () {
            if (!$scope.$parent.quest.media) {
                $scope.$parent.quest.media = [];
            }
            console.log($scope.$parent.quest)
        };

        //checks to see if atleast one inspire is checked else doesnt allow u to proceed
        $scope.checkMinBox = function (val) {
            if ($scope.$parent.quest.inspireAvailableToUser == false && $scope.$parent.quest.encourageAvailableToUser == false && $scope.$parent.quest.storyAvailableToUser == false) {
                if (val == 'A') {
                    $scope.$parent.quest.inspireAvailableToUser = true;
                }
                if (val == 'E') {
                    $scope.$parent.quest.encourageAvailableToUser = true;
                }
                if (val == 'S') {
                    $scope.$parent.quest.storyAvailableToUser = true;
                }
            }
           console.log($scope.$parent.quest);
        };
 $scope.$on('saveInspire', function (e) {

            $scope.loadQuest();

        });
        //$scope.showLog = function () {
        //    console.log($scope.$parent.quest);
        //};
 
 $scope.addMedia = function (e, quest) {
     e.stopPropagation();

     if (!quest.addMedia) {
         quest.addMedia = {
             in: false,
             val: {
                 req: false,
                 fmt: false
             },
             link: null
         };
     }

     var btnElm = angular.element(e.target);
     var popupElm = btnElm.next('.add-media-popup');
     popupElm.css('left', btnElm.outerWidth() + (15 + 30));

     angular.element('.add-media .val').addClass('ng-hide');
     var st = !quest.addMedia.in;
     quest.addMedia.in = st;
     $scope.programEditFrm.$setDirty();
 };
 $scope.uploadMedia = function (files, quest) {
     $scope.resetVal();
     if (!files || files.length <= 0) return;
     var file = files[0];

     var mediaType;

     // Check type
     if (!helpers.validVideoFile(file.name)) {
         if (!helpers.validAudioFile(file.name)) {
             if (!helpers.validImageFile(file.name)) {
                 //challenge.val.media.type = true;
                 $scope.uploadDownloadContent(files, quest);
                 return;
             } else {
                 mediaType = 'image';
                 // Check size
                 if (file.size > helpers.maxImageSize) {
                     quest.val.media.size = true;
                     return;
                 }
             }
         } else {
             mediaType = 'audio';
             // Check size
             if (file.size > helpers.maxAudioSize) {
                 quest.val.media.size = true;
                 return;
             }
         }
     } else {
         mediaType = 'video';
         // Check size
         if (file.size > helpers.maxVideoSize) {
             quest.val.media.size = true;
             return;
         }
     }

     $scope.busy = true;
     quest.isLoading = true;

     var url = authService.apiUrl;
     if (mediaType == 'video') url += '/uv';
     else if (mediaType == 'audio') url += '/ua';
     else url += '/ui';

     $upload.upload({ url: url, file: file })
         .progress(function (e) {
             /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
              console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
         })
         .success(function (data) {
             $scope.programEditFrm.$setDirty();
             if (mediaType == 'audio') {
                 var media = {
                     type: mediaType,
                     name: file.name,
                     date: file.lastModifiedDate,
                     mimeType: file.type,
                     url: data.url,
                     ref: data.ref,
                     source: 'system',
                     canDrag: false,
                     encoding: true
                 };
                 quest.media.push(media);

                 $timeout(function () {
                     quest.isLoading = false;
                     $scope.busy = false;
                 }, 300);
             }
             else {
                 var img = new Image();
                 img.onload = function () {
                     $scope.$apply(function () {
                         var media = {
                             type: mediaType,
                             name: file.name,
                             date: file.lastModifiedDate,
                             mimeType: file.type,
                             url: data.url,
                             ref: data.ref,
                             source: 'system',
                             canDrag: false,
                             encodings: []
                         };
                         if (mediaType == 'video') $scope.checkEncoding(media);
                         quest.media.push(media);

                         $timeout(function () {
                             quest.isLoading = false;
                             $scope.busy = false;
                         }, 300);
                     });
                 };
                 img.src = data.url;
             }
         })
         .catch(function (ex) {
             quest.isLoading = false;
         });
 };
 $scope.uploadDownloadContent = function (files, quest) {

     $scope.resetVal();
     if (!files || files.length <= 0) return;
     var file = files[0];

    

     $scope.busy = true;
     quest.isLoading = true;

     $upload.upload({ url: authService.apiUrl + '/ur', file: file })
         .success(function (data) {

             var userMedia = {
                 type: 'resource',
                 name: file.name,
                 date: file.lastModifiedDate,
                 mimeType: file.type,
                 url: data.url,
                 ref: data.ref,
                 isNew: true
             };


             quest.media.push(userMedia);

             $scope.programEditFrm.$setDirty();

             $timeout(function () {
                 quest.isLoading = false;
                 $scope.busy = false;
             }, 300);
         });
 };
 $scope.selectMediaLink = function (e, quest, ref) {
     e.preventDefault();
     e.stopPropagation();

     $scope.resetVal();
     var isValid = true;
     if (!quest.addMedia.link) {
         quest.addMedia.val.req = true;
         isValid = false;
     }
     else {

         if (ref == 'YouTube') {
             var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
             if (!r.test(quest.addMedia.link)) {
                 quest.addMedia.val.fmt = true;
                 isValid = false;
             }
         }
         else {
             quest.addMedia.val.src = true;
             isValid = false;
         }
     }

     if (!isValid) return;

     if (ref == 'YouTube') {

         if (quest.addMedia.link.toUpperCase().indexOf('QUIZREVOLUTION.COM') != -1 && quest.addMedia.link.toUpperCase().indexOf('HTTP:') != -1) {
             quest.addMedia.link = quest.addMedia.link.replace('http://', 'https://www.');
             quest.addMedia.link = quest.addMedia.link.replace('http://', 'https://www.');
         }
         ;

         // Get the source url
         var r = /src="([_\-a-z0-9:\/\.]+)"/gi;
         var m = r.exec(quest.addMedia.link);

         var name = null;
         var parts = null;
         var videoId = null;

         if (m) {
             name = m[1];
             parts = name.split('/');
             videoId = parts[parts.length - 1];
         }

         var media = {
             type: 'video',
             name: name,
             date: new Date(),
             mimeType: 'video/*',
             iframe: quest.addMedia.link,
             ref: videoId,
             canDrag: false,
             encodings: [],
             source: 'youtube',
             coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
         };
         quest.media.push(media);

         quest.addMedia.in = false;
         quest.addMedia.link = null;
     }
 };

 $scope.addText = function (quest) {
     var media = {
         type: 'text',
         text: null,
         canDrag: false
     };
     quest.media.push(media);
     $scope.programEditFrm.$setDirty();
 };
 $scope.addLink = function (quest) {
     var media = {
         type: 'link',
         link: null,
         canDrag: false,
         val: {
             link: {
                 req: false,
                 fmt: false
             }
         }
     };
     quest.media.push(media);
     $scope.programEditFrm.$setDirty();
 };
 $scope.removeMedia = function (e, quest, index) {
     e.preventDefault();
     $modal.open({
         templateUrl: 'confirmModal.html',
         controller: confirmModalControllerObj.confirmModalController,
         size: 'sm',
         resolve: {
             initData: function () {
                 return {
                     title: 'Remove Media?',
                     text: 'You are about to remove the selected media. Are you sure you want to continue?',
                     ok: 'Yes', cancel: 'No'
                 }
             }
         }
     }).result.then(
         function () {
             quest.media.splice(index, 1);
             $scope.programEditFrm.$setDirty();
         });

 };
 $scope.selectQuestMedia = function (quest, media) {
     quest.selectedMedia = media;
 };
 $scope.challengeMediaHandleDown = function (e, quest, media) {
     media.canDrag = true;
     quest.selectedMedia = media;
 };
 $scope.challengeMediaHandleUp = function (e, quest, media) {
     media.canDrag = false;
 };
 $scope.challengeMediaDrop = function (event, index, item, external, type, name, quest) {
     quest.selectedMedia = item;
     quest.selectedMedia.canDrag = false;
     $scope.programEditFrm.$setDirty();
     return item;
 };
    }]);

controllers.controller('AuthoringSuiteChallengeController', ['$scope', '$modal', '$http', '$timeout', '$upload', 'controllerState', 'authService', 'helperService', 'ngAudio',
    function ($scope, $modal, $http, $timeout, $upload, controllerState, authService, helpers, ngAudio) {
        $scope.canEditEntity = helpers.canEditEntity;

        $scope.selectChallengeMedia = function (challenge, media) {
            challenge.selectedMedia = media;
        };
        $scope.challengeMediaHandleDown = function (e, challenge, media) {
            media.canDrag = true;
            challenge.selectedMedia = media;
        };
        $scope.challengeMediaHandleUp = function (e, challenge, media) {
            media.canDrag = false;
        };
        $scope.challengeMediaDrop = function (event, index, item, external, type, name, challenge) {
            challenge.selectedMedia = item;
            challenge.selectedMedia.canDrag = false;
            $scope.programEditFrm.$setDirty();
            return item;
        };

        $scope.addMedia = function (e, challenge) {
            e.stopPropagation();

            if (!challenge.addMedia) {
                challenge.addMedia = {
                    in: false,
                    val: {
                        req: false,
                        fmt: false
                    },
                    link: null
                };
            }

            var btnElm = angular.element(e.target);
            var popupElm = btnElm.next('.add-media-popup');
            popupElm.css('left', btnElm.outerWidth() + (15 + 30));

            angular.element('.add-media .val').addClass('ng-hide');
            var st = !challenge.addMedia.in;
            $scope.closeAllChallengeMenus();
            challenge.addMedia.in = st;
            $scope.programEditFrm.$setDirty();
        };


        $scope.selectMediaLink = function (e, challenge, ref) {
            e.preventDefault();
            e.stopPropagation();

            $scope.resetVal();
            var isValid = true;
            if (!challenge.addMedia.link) {
                challenge.addMedia.val.req = true;
                isValid = false;
            }
            else {

                if (ref == 'YouTube') {
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test(challenge.addMedia.link)) {
                        challenge.addMedia.val.fmt = true;
                        isValid = false;
                    }
                }
                else {
                    challenge.addMedia.val.src = true;
                    isValid = false;
                }
            }

            if (!isValid) return;

            if (ref == 'YouTube') {

                if (challenge.addMedia.link.toUpperCase().indexOf('QUIZREVOLUTION.COM') != -1 && challenge.addMedia.link.toUpperCase().indexOf('HTTP:') != -1) {
                    challenge.addMedia.link = challenge.addMedia.link.replace('http://', 'https://www.');
                    challenge.addMedia.link = challenge.addMedia.link.replace('http://', 'https://www.');
                }
                ;

                // Get the source url
                var r = /src="([_\-a-z0-9:\/\.]+)"/gi;
                var m = r.exec(challenge.addMedia.link);

                var name = null;
                var parts = null;
                var videoId = null;

                if (m) {
                    name = m[1];
                    parts = name.split('/');
                    videoId = parts[parts.length - 1];
                }

                var media = {
                    type: 'video',
                    name: name,
                    date: new Date(),
                    mimeType: 'video/*',
                    iframe: challenge.addMedia.link,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
                };
                challenge.media.push(media);

                challenge.addMedia.in = false;
                challenge.addMedia.link = null;
            }
        };

        $scope.uploadMedia = function (files, challenge) {
            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            var mediaType;

            // Check type
            if (!helpers.validVideoFile(file.name)) {
                if (!helpers.validAudioFile(file.name)) {
                    if (!helpers.validImageFile(file.name)) {
                        //challenge.val.media.type = true;
                        $scope.uploadDownloadContent(files, challenge);
                        return;
                    } else {
                        mediaType = 'image';
                        // Check size
                        if (file.size > helpers.maxImageSize) {
                            challenge.val.media.size = true;
                            return;
                        }
                    }
                } else {
                    mediaType = 'audio';
                    // Check size
                    if (file.size > helpers.maxAudioSize) {
                        challenge.val.media.size = true;
                        return;
                    }
                }
            } else {
                mediaType = 'video';
                // Check size
                if (file.size > helpers.maxVideoSize) {
                    challenge.val.media.size = true;
                    return;
                }
            }

            $scope.busy = true;
            challenge.isLoading = true;

            var url = authService.apiUrl;
            if (mediaType == 'video') url += '/uv';
            else if (mediaType == 'audio') url += '/ua';
            else url += '/ui';

            $upload.upload({url: url, file: file})
                .progress(function (e) {
                    /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                     console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                })
                .success(function (data) {
                    $scope.programEditFrm.$setDirty();
                    if (mediaType == 'audio') {
                        var media = {
                            type: mediaType,
                            name: file.name,
                            date: file.lastModifiedDate,
                            mimeType: file.type,
                            url: data.url,
                            ref: data.ref,
                            source: 'system',
                            canDrag: false,
                            encoding: true
                        };
                        challenge.media.push(media);

                        $timeout(function () {
                            challenge.isLoading = false;
                            $scope.busy = false;
                        }, 300);
                    }
                    else {
                        var img = new Image();
                        img.onload = function () {
                            $scope.$apply(function () {
                                var media = {
                                    type: mediaType,
                                    name: file.name,
                                    date: file.lastModifiedDate,
                                    mimeType: file.type,
                                    url: data.url,
                                    ref: data.ref,
                                    source: 'system',
                                    canDrag: false,
                                    encodings: []
                                };
                                if (mediaType == 'video') $scope.checkEncoding(media);
                                challenge.media.push(media);

                                $timeout(function () {
                                    challenge.isLoading = false;
                                    $scope.busy = false;
                                }, 300);
                            });
                        };
                        img.src = data.url;
                    }
                })
                .catch(function (ex) {
                    challenge.isLoading = false;
                });
        };
      

        $scope.uploadDownloadContent = function (files, challenge) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check size
            if (file.size > helpers.maxFileSize) {
                todo.val.resource.size = true;
                validate();
                return;
            }
         
            $scope.busy = true;
            challenge.isLoading = true;

            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
                .success(function (data) {

                    var userMedia = {
                        type: 'resource',
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref,
                        isNew: true
                    };


                    challenge.media.push(userMedia);

                    $scope.programEditFrm.$setDirty();

                    $timeout(function () {
                        challenge.isLoading = false;
                        $scope.busy = false;
                    }, 300);
                });
        };


        $scope.playVideo = function (media) {
            if (media.source == 'youtube') {
                $modal.open({
                    templateUrl: 'youTubePlayer.html',
                    controller: youTubePlayerControllerObj.youTubePlayerController,
                    resolve: {
                        initData: function () {
                            return {iframe: media.iframe};
                        }
                    }
                });
                return;
            }
            $modal.open({
                templateUrl: 'videoPlayer.html',
                controller: videoPlayerControllerObj.videoPlayerController,
                resolve: {
                    initData: function () {
                        return {
                            url: media.url,
                            encodings: media.encodings
                        };
                    }
                }
            });
        };

        $scope.playPauseAudio = function (media) {
            if (!media.audio) {
                media.audio = ngAudio.load(media.url);
                media.audio.play();
                return;
            }
            media.audio.paused ? media.audio.play() : media.audio.pause();
        };

        $scope.addText = function (challenge) {
            var media = {
                type: 'text',
                text: null,
                canDrag: false
            };
            challenge.media.push(media);
            $scope.programEditFrm.$setDirty();
        };

        $scope.addLink = function (challenge) {
            var media = {
                type: 'link',
                link: null,
                canDrag: false,
                val: {
                    link: {
                        req: false,
                        fmt: false
                    }
                }
            };
            challenge.media.push(media);
            $scope.programEditFrm.$setDirty();
        };

        $scope.removeMedia = function (e, challenge, index) {
            e.preventDefault();
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Media?',
                            text: 'You are about to remove the selected media. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    challenge.media.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });

        };

    }]);

controllers.controller('AuthoringSuiteChallengeQuestionsController', ['$scope', '$modal', 'helperService',
    function ($scope, $modal, helpers) {
        /*Hint Show*/
        $scope.showHintArray = true;
        $scope.canEditEntity = helpers.canEditEntity;

        $scope.questionDragHandleDown = function (e, question) {
            $scope.questionCanDrag = true;
            $scope.selectedQuestion = question;
        };
        $scope.questionDragHandleUp = function (e, question) {
            $scope.questionCanDrag = false;
        };
        $scope.questionDrop = function (event, index, item, external, type, name) {
            $scope.selectedQuestion = item;
            $scope.questionCanDrag = false;
            $scope.programEditFrm.$setDirty();
            return item;
        };

        $scope.addQuestion = function (challenge) {
            var question = {
                id: 0,
                question: null,
                type: {
                    id: 0,
                    name: null
                },
                answers: [],
                hints:[],
                hasError: false,
                val: {
                    question: {
                        req: false,
                        type: false
                    }
                },
                menuOpen: false,
                expanded: true
            };
            $scope.defaultWorkQuestions.init(question);
            challenge.questions.push(question);
            $scope.selectedQuestion = question;

            $scope.programEditFrm.$setDirty();
        };

        $scope.addHints = function (question) {

            if (question.hints.length < 3) {
                var hint = {
                    id: 0,
                    hint: null,
                    hasError: false,
                    length: false
                };

                question.hints.push(hint);
                $scope.programEditFrm.$setDirty();
            }
        };

        $scope.removeHint = function (e, question, index) {
            e.preventDefault();
            question.hints.splice(index, 1)
            $scope.programEditFrm.$setDirty();
        };

        $scope.removeQuestion = function (e, index, challenge, quest, program) {
            if (!$scope.canEditEntity(quest, program)) {
                $scope.closeAllChallengeMenus();
                return $scope.cancelEvent(e);
            }

            e.preventDefault();

            $scope.closeAllChallengeMenus();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Question?',
                            text: 'You are about to remove the selected question. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    challenge.questions.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });

        };

        $scope.toggleQuestion = function (e, challenge, question) {
            e.stopPropagation();
            question.expanded = !question.expanded;
            $scope.selectedQuestion = question;
        };
        $scope.toggleQuestionMenu = function (e, challenge, question) {
            e.stopPropagation();
            var st = !question.menuOpen;
            $scope.closeAllChallengeMenus(null);
            question.menuOpen = st;
            challenge.selectedQuestion = question;
        };
        $scope.selectQuestion = function (challenge, question) {
            if (challenge.selectedQuestion !== question) {
                challenge.selectedQuestion = question;
                $scope.closeAllChallengeMenus(null);
            }
        };

        $scope.toggleQuestionType = function (e, challenge, question) {
            e.stopPropagation();
            var st = !question.typeOpen;
            question.val.question.type = false;
            $scope.closeAllChallengeMenus(null);
            question.typeOpen = true;
        };
        $scope.selectQuestionType = function (e, question, type) {
            e.preventDefault();
            question.type.id = type.id;
            question.type.name = type.name;
            question.question = null;
            question.answers = [];
            question.hints = [];
            question.typeOpen = false;
            $scope.programEditFrm.$setDirty();
        };

        $scope.answerDragHandleDown = function (e, question, answer, which) {
            question.workAnswers[which].canDrag = true;
            question.workAnswers[which].selectedAnswer = answer;
        };
        $scope.answerDragHandleUp = function (e, question, which) {
            question.workAnswers[which].canDrag = false;
        };
        $scope.answerDrop = function (event, index, item, external, type, which, question) {
            question.workAnswers[which].selectedAnswer = item;
            question.workAnswers[which].canDrag = false;
            $scope.programEditFrm.$setDirty();
            return item;
        };
        $scope.addAnswer = function (which, question) {
            var answer = $scope.defaultWorkQuestions[which + 'Answer']();
            question.workAnswers[which].answers.push(answer);
            question.workAnswers[which].selectedAnswer = answer;
            $scope.programEditFrm.$setDirty();
        };

        $scope.contrastingAnswerDragHandleDown = function (e, question, answer, which) {
            question.workAnswers.contrasting[which].canDrag = true;
            question.workAnswers.contrasting[which].selectedAnswer = answer;
        };
        $scope.contrastingAnswerDragHandleUp = function (e, question, answer, which) {
            question.workAnswers.contrasting[which].canDrag = false;
        };
        $scope.contrastingAnswerDrop = function (event, index, item, external, type, which, question) {
            question.workAnswers.contrasting[which].selectedAnswer = item;
            question.workAnswers.contrasting[which].canDrag = false;
            $scope.programEditFrm.$setDirty();
            return item;
        };
        $scope.addContrastingAnswer = function (which, question) {
            var answer = $scope.defaultWorkQuestions.contrastingAnswer();
            question.workAnswers.contrasting[which].answers.push(answer);
            question.workAnswers.contrasting[which].selectedAnswer = answer;
            $scope.programEditFrm.$setDirty();
        };
        $scope.contrastingRemoveAnswer = function (e, answer, index, question, which) {
            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.contrasting[which].answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };


        $scope.multipleChoiceSetCorrect = function (e, answer, question) {
            e.preventDefault();
            // Single select?
            if (question.type.id == $scope.questionTypes.singleSelect.id) {
                angular.forEach(question.workAnswers.singleSelect.answers, function (a) {
                    a.correct = (a == answer);
                });
            }
            // Multi select?
            else if (question.type.id == $scope.questionTypes.multiSelect.id) {
                answer.correct = !answer.correct;
            }
            $scope.programEditFrm.$setDirty();
        };
        $scope.multipleChoiceRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            var obj = question.type.id == $scope.questionTypes.singleSelect.id ? 'singleSelect' : 'multiSelect';

            if (question.workAnswers[obj].answers.length <= 2) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Answer',
                                text: 'Multiple Choice questions must have at least 2 answers.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers[obj].answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.pollRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.poll.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Answer',
                                text: 'Poll questions must have at least 1 answer.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.poll.answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };
        $scope.pollMultiSelectRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.pollMultiSelect.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Answer',
                                text: 'Poll Multi Select questions must have at least 1 answer.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.pollMultiSelect.answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };
        $scope.matchingRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.matching.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Answer',
                                text: 'Item matching questions must have at least 1 answer.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.matching.answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.fillBlankSetBlank = function (e, answer, question) {
            e.preventDefault();
            answer.correct = !answer.correct;
            $scope.programEditFrm.$setDirty();
        };
        $scope.fillBlankRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.fillBlank.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Fragment',
                                text: 'Fill in the Blank questions must have at least 1 fragment.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Fragment?',
                            text: 'You are about to remove the selected fragment. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.fillBlank.answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.sentenceBuilderRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.sentenceBuilder.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Fragment',
                                text: 'Sentence / Phrase Builder questions must have at least 1 fragment.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Fragment?',
                            text: 'You are about to remove the selected fragment. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.sentenceBuilder.answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.sequencingRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.sequencing.answers.length <= 2) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Answer',
                                text: 'Sequencing questions must have at least 2 answers.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $scope.programEditFrm.$setDirty();
                    question.workAnswers.sequencing.answers.splice(index, 1);
                });
        };

        $scope.freeContrastingRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.freeContrasting.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Answer',
                                text: 'Contrasting questions must have at least 1 answer.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $scope.programEditFrm.$setDirty();
                    question.workAnswers.freeContrasting.answers.splice(index, 1);
                });
        };

        $scope.groupingRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();

            if (question.workAnswers.grouping.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Group',
                                text: 'Grouping questions must have at least 1 group.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Group?',
                            text: 'You are about to remove the selected group. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.grouping.answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };
        $scope.addGroupItem = function (answer) {
            answer.items.push({
                item: null,
                val: {item: {reg: false}}
            });
        };
        $scope.groupItemDrop = function (event, index, item, answer) {
            answer.selectedItem = item;
            $scope.programEditFrm.$setDirty();
            return item;
        };
        $scope.groupItemDragHandleDown = function (e, answer, item) {
            item.canDrag = true;
            answer.selectedItem = item;
        };
        $scope.groupItemDragHandleUp = function (e, question, which) {
            item.canDrag = true;
        };
        $scope.groupingRemoveItem = function (e, item, index, answer) {
            e.preventDefault();

            if (answer.items.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Group Item',
                                text: 'You must have at least 1 item in every group.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Group Item?',
                            text: 'You are about to remove the selected group item. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    answer.items.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.shortAnswerRemoveAnswer = function (e, answer, index, question) {
            e.preventDefault();


            if (question.workAnswers.shortAnswer.answers.length <= 1) {
                $modal.open({
                    templateUrl: 'infoModal.html',
                    controller: infoModalControllerObj.infoModalController,
                    size: 'sm',
                    resolve: {
                        initData: function () {
                            return {
                                title: 'Cannot Remove Answer',
                                text: 'Short Answer questions must have at least 1 answer.',
                                ok: 'OK'
                            }
                        }
                    }
                });
                return;
            }

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Answer?',
                            text: 'You are about to remove the selected answer. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    question.workAnswers.shortAnswer.answers.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };
    }]);

controllers.controller('AuthoringSuiteProgramLevelsController', ['$scope', '$q', '$http', '$timeout', 'authService', '$modal', '$document', '$window', 'helperService', '$upload',
    function ($scope, $q, $http, $timeout, authService, $modal, $document, $window, helpers, $upload) {
        $scope.isSaving = false;
        $scope.programs = [];
        $scope.selectedProgram = null;
        $scope.program = null;
        $scope.canEditEntity = helpers.canEditEntity;
        $scope.level = {
            quests: []
        };

        window.onbeforeunload = function (e) {
            if ($scope.programEditFrm.$dirty) {
                return 'There are unsaved changes on this page!'
            }
        };

        $scope.restore = function (e, history) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/levels?restore=' + history.programId;
        };

        $scope.revert = function (e) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/levels';
        };

        $scope.getNumberOfChallengesInLevel = function (level) {
            var numChallenges = 0;
            _.each(level.quests, function (quest) {
                _.each(quest.challenges, function (challenge) {
                    numChallenges++;
                })
            });
            return numChallenges;
        };

        $scope.getNumberOfMediaInLevel = function (level) {
            var numMedia = 0;
            _.each(level.quests, function (quest) {
                _.each(quest.challenges, function (challenge) {
                    _.each(challenge.challengeMedia, function (media) {
                        numMedia++;
                    })
                })
            });
            return numMedia;
        };

        $scope.getNumberOfTodosInLevel = function (level) {
            return 0;
        };

        var init = function (slug, restore) {
            $document.on('click', function (e) {
                $scope.$apply(function () {
                    $scope.closeAllLevelMenus(null);
                    $scope.selectedLevel = null;
                    $scope.selectedQuest = null;
                });
            });

            $scope.isSaving = true;

            return $q(function (resolve, reject) {
                $scope.restoreId = Number(restore);
                var url = authService.apiUrl + '/programs/' + slug;
                if (restore > 0) url += ('?restore=' + restore);

                $scope.loading.isLoading++;
                $http.get(url)
                    .success(function (program) {
                        $scope.stopLoading();
                        finishInit(program);
                        resolve();
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };

        var finishInit = function (program) {
            if (program.description) program.description = program.description.replace(/\n/g, '<br>');
            $scope.program = program;
            $scope.setSelectedProgram($scope.program);

            //Call to set program mode based on version
            helpers.canEditEntity({}, program);

            angular.forEach($scope.program.levels, function (level) {
                level.val = angular.copy($scope.levelValTemplate);
            });

            $scope.resetVal();
        };

        this.init = function (slug, restore) {
            init(slug, restore).then(function () {
                $timeout(function () {
                    $scope.isSaving = false;
                }, 300);
            });
        };

        $scope.levelDragHandleDown = function (e, level) {
            $scope.levelCanDrag = true;
            $scope.selectedLevel = level;
        };

        $scope.questDragHandleDown = function (e, quest, level) {
            $scope.questCanDrag = true;
            $scope.selectedQuest = quest;
            $scope.selectedLevel = level;
        };

        $scope.questDragHandleUp = function (e, quest, level) {
            quest.questCanDrag = false;
            $scope.selectedQuest = null;
            $scope.selectedLevel = null;
        };

        $scope.levelDragHandleUp = function (e, level) {
            $scope.levelCanDrag = false;
        };

        $scope.levelDrop = function (event, index, item) {
            if (!$scope.program.cancelMigrateResultsOnPublish) {
                //If the level has any published quests, can't move it
                if (_.filter(item.quests, function (quest) {
                        return quest.publishedAt != null || ($scope.program.cancelMigrateReultsOveridden && quest.id)
                    }).length > 0) {
                    return $scope.cancelEvent(event);
                }

                //don't allow any levels to be dropped if there are published program quests
                if (_.filter($scope.program.quests, function (quest) {
                        return quest.publishedAt != null || ($scope.program.cancelMigrateReultsOveridden && quest.id)
                    }).length > 0) {
                    return $scope.cancelEvent(event);
                }

                //don't allow any level to be dropped before any levels that contain published quests
                var indexOfLevelWithPublishedQuests = -1;
                _.each($scope.program.levels, function (level) {
                    if (_.filter(level.quests, function (quest) {
                            return quest.publishedAt != null || ($scope.program.cancelMigrateReultsOveridden && quest.id)
                        }).length > 0) {
                        indexOfLevelWithPublishedQuests = $scope.program.levels.indexOf(level);
                    }
                });
                if (indexOfLevelWithPublishedQuests >= index) {
                    return $scope.cancelEvent(event);
                }
            }

            var selectedLevel = $scope.selectedLevel;

            if (selectedLevel) {
                //Timeout here to allow drag and drop time to add new item to the list before removing the old one, otherwise
                //new item doesn't get added at correct index
                $timeout(function () {
                    $scope.program.levels = _.without($scope.program.levels, selectedLevel);
                    $scope.selectedLevel = null;
                });
            }

            $scope.levelCanDrag = false;
            $scope.programEditFrm.$setDirty();
            return item;
        };

        $scope.selectLevel = function (level) {
            if ($scope.selectedLevel !== level) {
                $scope.selectedLevel = level;
                $scope.closeAllLevelMenus(level);
            }
        };

        $scope.levelMoved = function () {
            $scope.selectedLevel = null;
        };

        $scope.selectQuest = function (quest, level) {
            if ($scope.selectedQuest !== quest) {
                $scope.selectedQuest = quest;
            }
            if (level) {
                $scope.selectLevel(level);
if ($scope.selectedQuest !== quest) {
                $scope.selectedQuest = quest;
            }
            }
        };

        $scope.questMoved = function () {
            $scope.selectedQuest = null;
        };

        $scope.questDrop = function (event, index, item, external, type, name, level) {
            if (!$scope.program.cancelMigrateResultsOnPublish) {
                //If the program already has quests outside of levels, then no quests can be added to levels since they are presented before the program quests
                if (_.filter($scope.program.quests, function (quest) {
                        return quest.publishedAt != null || ($scope.program.cancelMigrateReultsOveridden && quest.id)
                    }).length > 0) {
                    return $scope.cancelEvent(event);
                }

                //If no program quests, only allow add quests to the last level (or beyond) that has published quests
                var indexOfLastLevelWithPublishedQuests = -1;
                _.each($scope.program.levels, function (level) {
                    if (_.filter(level.quests, function (quest) {
                            return quest.publishedAt != null || ($scope.program.cancelMigrateReultsOveridden && quest.id)
                        }).length > 0) {
                        indexOfLastLevelWithPublishedQuests = $scope.program.levels.indexOf(level);
                    }
                });

                if (indexOfLastLevelWithPublishedQuests > $scope.program.levels.indexOf(level)) {
                    return $scope.cancelEvent(event);
                }

                //If the level is on or past the last level with published quests
                var indexOfPublishedQuest = -1;
                //If neither of the above, quests can only be added to the last level after any published quests
                _.each(level.quests, function (quest) {
                    if (quest.publishedAt || ($scope.program.cancelMigrateReultsOveridden && quest.id)) {
                        indexOfPublishedQuest = level.quests.indexOf(quest);
                    }
                });

                if (indexOfPublishedQuest >= index) {
                    return $scope.cancelEvent(event);
                }
            }


            if (!level.quests) {
                level.quests = [];
            }
            var selectedQuest = $scope.selectedQuest;
            var selectedLevel = $scope.selectedLevel;

            if (selectedQuest) {
                //Timeout here to allow drag and drop time to add new item to the list before removing the old one, otherwise
                //new item doesn't get added at correct index
                $timeout(function () {
                    if (item.levelId == null) {
                        $scope.program.quests = _.without($scope.program.quests, selectedQuest);
                    } else {
                        $scope.selectedLevel.quests = _.without($scope.selectedLevel.quests, selectedQuest);
                    }
                    item.levelId = level.id;
                    $scope.selectedQuest = null;
                    $scope.selectedLevel = null;
                });
            }

            $scope.questCanDrag = false;
            $scope.programEditFrm.$setDirty();
            return item;
        };

        $scope.questListDrop = function (event, index, item) {
            if (!$scope.program.cancelMigrateResultsOnPublish) {
                var indexOfPublishedQuest = -1;
                //If neither of the above, quests can only be added to the last level after any published quests
                _.each($scope.program.quests, function (quest) {
                    if (quest.publishedAt || ($scope.program.cancelMigrateReultsOveridden && quest.id)) {
                        indexOfPublishedQuest = $scope.program.quests.indexOf(quest);
                    }
                });

                //If quest has already been published can't move it anywhere
                if (item.publishedAt || ($scope.program.cancelMigrateReultsOveridden && item.id)) {
                    return $scope.cancelEvent(event);
                }

                if (index <= indexOfPublishedQuest) {
                    return $scope.cancelEvent(event);
                }
            }

            var selectedQuest = $scope.selectedQuest;
            var selectedLevel = $scope.selectedLevel;

            //Timeout here to allow drag and drop time to add new item to the list before removing the old one, otherwise
            //new item doesn't get added at correct index
            $timeout(function () {
                if (item.levelId != null) {
                    selectedLevel.quests = _.without(selectedLevel.quests, selectedQuest);
                    item.levelId = null;
                } else {
                    $scope.program.quests = _.without($scope.program.quests, selectedQuest);
                }
                $scope.selectedQuest = null;
                $scope.selectedLevel = null;
            });
            $scope.programEditFrm.$setDirty();
            $scope.questCanDrag = false;
            return item;
        };

        $scope.addLevel = function (e) {
            e.preventDefault();

            var level = {
                id: 0,
                title: null,
                sequence: $scope.program.levels ? $scope.program.levels.length + 1 : 1,
                menuOpen: false,
                sequencingTypeId: $scope.program.sequencingTypeId ? $scope.program.sequencingTypeId : $scope.sequencingTypes.inOrder.id,
                sequencingParameters: $scope.program.sequencingParameters ? $scope.program.sequencingParameters : null,
                expanded: true,
                sequencingType: null,
                hasError: false,
                val: angular.copy($scope.levelValTemplate),
                quests: []
            };


            $scope.program.levels.push(level);
            $scope.selectedLevel = level;

            $timeout(function () {
                var id = $('#level' + ($scope.program.levels.length - 1));
                var bodyCanvas = $('#bodyCanvas');

                if (bodyCanvas[0] && id[0] && $.contains(bodyCanvas[0], id[0])) {
                    $('#bodyCanvas').animate({scrollTop: $(id).position().top + +$(id).innerHeight()}, 'slow');
                }
            }, 0);

            $scope.programEditFrm.$setDirty();
        };

        $scope.toggleLevel = function (e, level) {
            e.stopPropagation();
            level.expanded = !level.expanded;
            $scope.selectedLevel = level;
        };
        $scope.toggleLevelMenu = function (e, level) {
            e.stopPropagation();
            $scope.closeAllLevelMenus(level);
            level.menuOpen = !level.menuOpen;
        };
        $scope.offClick = function (e) {
            e.stopPropagation();
            $scope.closeAllLevelMenus();
        };
        $scope.closeAllLevelMenus = function (except) {
            if (!$scope.program) return;
            angular.forEach($scope.program.levels, function (level) {
                if (except !== level) level.menuOpen = false;
            });
        };

        $scope.moveQuestsBackToSideBar = function (level) {
            if (level.quests && level.quests.length > 0) {
                var quests = level.quests;
                _.each(quests, function (quest) {
                    quest.levelId = null;
                });
                $scope.program.quests = $scope.program.quests.concat(quests);
                $scope.programEditFrm.$setDirty();
            }
        };

        $scope.removeLevel = function (e, index, level) {
            if (!$scope.program.cancelMigrateResultsOnPublish) {
                //If the level has any published quests, can't remove it
                if (_.filter(level.quests, function (quest) {
                        return quest.publishedAt != null || ($scope.program.cancelMigrateReultsOveridden && quest.id)
                    }).length > 0) {
                    $scope.closeAllLevelMenus();
                    return $scope.cancelEvent(e);
                }
            }

            e.preventDefault();
            $scope.closeAllLevelMenus();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Level?',
                            text: 'You are about to remove the selected level. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $scope.moveQuestsBackToSideBar(level);
                    $scope.program.levels.splice(index, 1);
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.resetVal = function () {
            angular.forEach($scope.program.levels, function (level) {
                level.val = angular.copy($scope.levelValTemplate);
                level.hasError = false;
            });
            $scope.productImageVal = angular.copy($scope.productImageValTemplate);
            $scope.val = angular.copy($scope.valTemplate);

            $scope.levelErrorData = {
                title: 'Level Errors',
                text: '',
                okLabel: 'OK',
                isFirstActivityBonusError: false,
                firstActivityBonusErrorMsg: 'The first Activity in a Level must be a Base Activity unless this is the last Level of the Program. \n',
                isBonusLevelError: false,
                bonusLevelErrorMsg: 'A Program with only one Level must have at least one Base Activity. \n',
                isNotLastLevelAllBonusActivityError: false,
                notLastLevelAllBonusActivityErrorMsg: 'A Level with all Bonus Activities must be the last Level of the Program. \n',
                isLastLevelFirstActivityBonus: false,
                lastLevelFirstActivityBonusErrorMsg: 'The first Activity in a Level must be a Base Activity unless this is the last Level of the Program. \n',
                isActiveBonusLevelPreviousLevelHasNoActivity: false,
                activeBonusLevelPreviousLevelHasNoActivityErrorMsg: 'All Levels must start with a Base Activity unless this is the last Level of the Program. \n',
                isActiveBonusLevelAtLeastOneLevelHasActivity: false,
                activeBonusLevelAtLeastOneLevelHasActivityErrorMsg: 'A Level with all Bonus Activities must be the last Level of the Program. \n'
            };

            $scope.noLevelActivityTemplate = {
                firstActivityError: { req: false },
                firstActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n',
                levelHasNoActivity: { req: false },
                levelHasNoActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n'
            };


        };

        $scope.productImageValTemplate = {
            size: false,
            type: false
        };

        /*** Level Error Modal Data and Error MEssage*/
        $scope.levelErrorData = {
            title: 'Level Errors',
            text: '',
            okLabel: 'OK',
            isFirstActivityBonusError: false,
            firstActivityBonusErrorMsg: 'The first Activity in a Level must be a Base Activity unless this is the last Level of the Program. \n',
            isBonusLevelError: false,
            bonusLevelErrorMsg: 'A Program with only one Level must have at least one Base Activity. \n',
            isNotLastLevelAllBonusActivityError: false,
            notLastLevelAllBonusActivityErrorMsg: 'A Level with all Bonus Activities must be the last Level of the Program. \n',
            isLastLevelFirstActivityBonus: false,
            lastLevelFirstActivityBonusErrorMsg: 'The first Activity in a Level must be a Base Activity unless this is the last Level of the Program. \n',
            isActiveBonusLevelPreviousLevelHasNoActivity: false,
            activeBonusLevelPreviousLevelHasNoActivityErrorMsg: 'All Levels must start with a Base Activity unless this is the last Level of the Program. \n',
            isActiveBonusLevelAtLeastOneLevelHasActivity: false,
            activeBonusLevelAtLeastOneLevelHasActivityErrorMsg: 'A Level with all Bonus Activities must be the last Level of the Program. \n'
        };

        $scope.noLevelActivityTemplate = {
            firstActivityError: { req: false },
            firstActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n',
            levelHasNoActivity: { req: false },
            levelHasNoActivityErrorMsg: 'With no Levels, the first Activity of the Program must be a Base Activity. \n'
        };
        /*******************************************************/

        $scope.levelValTemplate = {
            title: { req: false },
            quest: { req: false },
            bonusLevel: { req: false },
            firstActivityBonus: { req: false },
            notLastLevelAllBonusActivity: { req: false },
            lastLevelFirstActivityBonus: { req: false },
            activeBonusLevelPreviousLevelHasNoActivity: { req: false },
            activeBonusLevelAtLeastOneLevelHasActivity: { req: false },
            sequencing: {
                type: {
                    req: false
                },
                interval: {
                    req: false,
                    min: false,
                    fmt: false
                },
                period: {
                    req: false
                },
                intervalType: {
                    req: false
                },
                startDate: {
                    req: false,
                    min: false
                }
            }
        };

        $scope.valTemplate = {
            title: {
                req: false
            },
            sequencing: {
                type: {
                    req: false
                },
                interval: {
                    req: false,
                    min: false,
                    fmt: false
                },
                period: {
                    req: false
                },
                intervalType: {
                    req: false
                },
                startDate: {
                    req: false
                }
            },
            challenges: {
                req: false
            }
        };

        $scope.validate = function (silent, publish) {
            var isValid = true;
            if (!$scope.program) {
                isValid = false;
            }
            else {
                if (!silent) {
                    $scope.resetVal();
                }

                if (!silent) {
                    var numberOfLevelsInProgram = $scope.program.levels.length;
                    var indexOfLastLevelInProgram = numberOfLevelsInProgram - 1;
                }

                angular.forEach($scope.program.levels, function (level) {
                    if (publish && isValid) {

                        angular.forEach(level.quests, function (quest) {
                            if (quest.challenges.length == 0) {
                                isValid = false;
                                if (!silent) {
                                    $scope.val.challenges.req = true;
                                }
                            }
                        });
                        if (isValid) {
                            angular.forEach($scope.program.quests, function (quest) {
                                if (quest.challenges.length == 0) {
                                    isValid = false;
                                    if (!silent) {
                                        $scope.val.challenges.req = true;
                                    }
                                }
                            })
                        }
                    }

                    //check if levels have quests Jubi - 715
                    //if (!silent) {
                    //    if (level.quests.length == 0) {
                    //        level.val.quest.req = true;
                    //        isValid = false;
                    //    }
                    //}

                    if (!level.title) {
                        if (!silent) {
                            level.val.title.req = true;
                            level.hasError = true;
                            level.expanded = true;
                        }
                        isValid = false;
                    }
                    if (!level.sequencingTypeId) {
                        if (!silent) {
                            level.val.sequencing.type.req = true;
                            level.hasError = true;
                            level.expanded = true;
                        }
                        isValid = false;
                    }

                    if (level.sequencingTypeId == helpers.sequencingTypes.interval.id) {
                        if (!level.sequencingParameters.interval) {
                            if (!silent) {
                                level.val.sequencing.interval.req = true;
                                level.hasError = true;
                                level.expanded = true;
                            }
                            isValid = false;
                        }
                        else if (isNaN(Number(level.sequencingParameters.interval))) {
                            if (!silent) {
                                level.val.sequencing.interval.fmt = true;
                            }
                            isValid = false;
                        } else if (Number(level.sequencingParameters.interval) < .5) {
                            if (!silent) {
                                level.val.sequencing.interval.min = true;
                            }
                            isValid = false;
                        }
                        if (!level.sequencingParameters.intervalPeriod) {
                            if (!silent) {
                                level.val.sequencing.period.req = true;
                                level.hasError = true;
                                level.expanded = true;
                            }
                            isValid = false;
                        }
                        if (!level.sequencingParameters.intervalStartTypeId) {
                            if (!silent) {
                                level.val.sequencing.intervalType.req = true;
                                level.hasError = true;
                                level.expanded = true;
                            }
                            isValid = false;
                        } else if (level.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && !level.sequencingParameters.startDate) {
                            if (!silent) {
                                level.val.sequencing.startDate.req = true;
                                level.hasError = true;
                                level.expanded = true;
                            }
                            isValid = false;
                        }
                        //else if (level.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && level.sequencingParameters.startDate) {
                        //    if (new Date(level.sequencingParameters.startDate) < $scope.today) {
                        //        if (!silent) {
                        //            level.val.sequencing.startDate.min = true;
                        //            level.hasError = true;
                        //            level.expanded = true;
                        //        }
                        //        isValid = false;
                        //    }
                        //}
                    }

                    if (!silent) {

                        if (level.quests && level.quests.length > 0) {
                            level.hasActivity = true;
                        } else {
                            level.hasActivity = false;
                        }

                        //Validate Bonus Activity in Level: 
                        //IF there are more than 1 Level
                        if (numberOfLevelsInProgram > 1) {
                            //check index of level
                            var indexOfCurrentLevel = $scope.program.levels.indexOf(level);
                            //if current level index is less than last level index.
                            if (indexOfCurrentLevel < indexOfLastLevelInProgram) {
                                if (level.quests.length > 0) {
                                    //check to see if level that is not last is full of bonus
                                    var isNotLastLevelFullOfBonus = true;
                                    _.each(level.quests, function (quest) {
                                        if (quest.baseOrBonus == 'B') {
                                            isNotLastLevelFullOfBonus = false;
                                        }
                                    });
                                    //if any level not last, is full of bonus then throw errow. 
                                    if (isNotLastLevelFullOfBonus) {
                                        if (!silent) {
                                            level.val.notLastLevelAllBonusActivity.req = true;
                                        }
                                        isValid = false;

                                    } else {
                                        //check to see if the first activity is of type base, else throw error. 
                                        if (level.quests[0].baseOrBonus == 'O') {
                                            if (!silent) {
                                                level.val.firstActivityBonus.req = true;
                                            }
                                            isValid = false;
                                        }
                                    }
                                }
                            } else {
                                //current level is last level. 
                                if (level.quests.length > 0) {
                                    //is current level is last level then check to see if all the activity is bonus. if yes then no error. 
                                    // if there is a mix, then check if the first activity is base else throw error. 
                                    var isLevelFullOfBonus = true;
                                    _.each(level.quests, function (quest) {
                                        if (quest.baseOrBonus == 'B') {
                                            isLevelFullOfBonus = false;
                                        }
                                    });

                                    if (!isLevelFullOfBonus) {
                                        if (level.quests[0].baseOrBonus == 'O') {
                                            if (!silent) {
                                                level.val.lastLevelFirstActivityBonus.req = true;
                                            }
                                            isValid = false;
                                        }
                                    } else {
                                        //if last level is all bobnus then check for situation where levels preceding bonus level is empty.
                                        //if there is more than 2 levels, last one being bonus, then atleast one level must have activities.
                                        if ($scope.program.levels.length > 2) {
                                            //for every level, check to see if there is activity if yes then no error
                                            var atLeastOneLevelHasActivities = false;
                                            _.each($scope.program.levels, function (level, i) {
                                                if (i != indexOfCurrentLevel && level.quests.length > 0) {
                                                    atLeastOneLevelHasActivities = true;
                                                }
                                            });

                                            if (!atLeastOneLevelHasActivities) {
                                                if (!silent) {
                                                    level.val.activeBonusLevelAtLeastOneLevelHasActivity.req = true;
                                                }
                                                isValid = false;
                                            }

                                        } else {
                                            //if there is 2 levels, last one being bonus, then check if previous level hasActivity. If true then no error
                                            if (!$scope.program.levels[0].hasActivity) {
                                                //hasActivity is false, so throw error.
                                                if (!silent) {
                                                    level.val.activeBonusLevelPreviousLevelHasNoActivity.req = true;
                                                }
                                                isValid = false;
                                            }
                                        }
                                    }
                                }
                            }

                        } else {
                            if (level.quests.length > 0) {
                                //if only one level exist, check if all activity is bonus. if yes throw error. 
                                var isAllActivityBonus = true;
                                angular.forEach(level.quests, function (quest) {
                                    if (quest.baseOrBonus == 'B') {
                                        isAllActivityBonus = false;
                                    }
                                });

                                if (isAllActivityBonus) {
                                    if (!silent) {
                                        level.val.bonusLevel.req = true;
                                    }
                                    isValid = false;
                                } else {
                                    //check if first activoty is Bonus, If true then error. 
                                    if (level.quests[0].baseOrBonus == 'O') {
                                        if (!silent) {
                                            level.val.firstActivityBonus.req = true;
                                        }
                                        isValid = false;
                                    }
                                }
                            }
                        }
                    }
                    
                });

                //BELOW SECTION IS TO VALIDATE NON LEVEL ACTIVITY ORDER IF LEVELS EXISTS OR NOT
                //check to see if there are levels. if yes then Non level activities can be in any order of Base or bonus. 
                //if no level then Non level activities must start with Base. 
                if ($scope.program.levels.length > 0) {

                    //program has levels. Check if levels have quests
                    var levelHasQuests = false;

                    _.each($scope.program.levels, function (level) {
                        if (level.quests.length > 0) {
                            levelHasQuests = true;
                        }
                    });

                    //if level has no activity then check if activity order is valid. 
                    if (!levelHasQuests) {
                        if ($scope.program.quests[0].baseOrBonus == 'O') {
                            if (!silent) {
                                $scope.noLevelActivityTemplate.levelHasNoActivity.req = true;
                            }
                            isValid = false;
                        }
                    }
                }
                else {
                    //check if first activity is base else throw error
                    if ($scope.program.quests[0].baseOrBonus == 'O') {
                        if (!silent) {
                            $scope.noLevelActivityTemplate.firstActivityError.req = true;
                        }
                        isValid = false;
                    }
                }

                if (!$scope.program.title) {
                    if (!silent) {
                        $scope.val.title.req = true;
                    }
                    isValid = false;
                }

                if (!$scope.program.sequencingTypeId) {
                    if (!silent) {
                        $scope.val.sequencing.type.req = true;
                    }
                    isValid = false;
                }

                if ($scope.program.sequencingTypeId == helpers.sequencingTypes.interval.id) {
                    if (!$scope.program.sequencingParameters.interval) {
                        if (!silent) {
                            $scope.val.sequencing.interval.req = true;
                        }
                        isValid = false;
                    } else if (isNaN(Number($scope.program.sequencingParameters.interval))) {
                        if (!silent) {
                            $scope.val.sequencing.interval.fmt = true;
                        }
                        isValid = false;
                    } else if (Number($scope.program.sequencingParameters.interval) < .5) {
                        if (!silent) {
                            $scope.val.sequencing.interval.min = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalPeriod) {
                        if (!silent) {
                            $scope.val.sequencing.period.req = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalStartTypeId) {
                        if (!silent) {
                            $scope.val.sequencing.intervalType.req = true;
                        }
                        isValid = false;
                    } else if ($scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && !$scope.program.sequencingParameters.startDate) {
                        if (!silent) {
                            $scope.val.sequencing.startDate.req = true;
                        }
                        isValid = false;
                    }
                    //else if ($scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && $scope.program.sequencingParameters.startDate) {
                    //    if (new Date($scope.val.sequencing.startDate) < $scope.today) {
                    //        if (!silent) {
                    //            $scope.val.sequencing.startDate.min = true;
                    //        }
                    //        isValid = false;
                    //    }
                    //}
                }
            }

            if (isValid && !silent) {
                if ($scope.program.sequencingParameters && $scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                    $scope.program.sequencingParameters.startDate = null;
                }
                _.each($scope.program.levels, function (level) {
                    if (level.sequencingParameters && level.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                        level.sequencingParameters.startDate = null;
                    }
                })
            }

            if (!isValid && !silent) {
                $scope.scrollToError();
            }

            return isValid;
        };

        $scope.$on('autoSaveNow', function () {
            $scope.autoSaveNow();
        });

        $scope.$watch(function () {
            return $scope.validate(true);
        }, function () {
            $scope.autoSaveNow();
        }, true);


        $scope.autoSaveNow = function () {
            if ($scope.validate(true) && !$scope.restoreId && $scope.programEditFrm.$dirty) {
                $scope.autoSave($scope.program).then(function (program) {
                    $scope.program.createdAt = program.createdAt;
                    $scope.program.history = program.history;
                    $scope.program.version = program.version;
                    $scope.program.id = program.id;
                    $scope.program.status = program.status;
                    $scope.program.published = program.published;
                });
            }
        };

        $scope.submit = function (e, status, publish) {
            e.preventDefault();
            $scope.program.status = status ? status : 'ready';

            return $q(function (resolve, reject) {

                if ($scope.validate(false, status == 'preview' ? false : publish)) {

                    //If the program is not of Interval sequencing type, then remove any parameters that were associated with that type.
                    if ($scope.program.sequencingTypeId != $scope.sequencingTypes.interval.id) {
                        $scope.program.sequencingParameters = null;
                    }

                    //For each of the programs levels, if the sequencing type is not Interval then remove the sequencing parameters associated to that type
                    _.each($scope.program.levels, function (level) {
                        if (level.sequencingTypeId != $scope.sequencingTypes.interval.id) {
                            level.sequencingParameters = null;
                        }
                    });


                    //If the program is being published, add the publish date, otherwise remove the publish date publish doesn't carry over from one version to the next
                    if (publish) {
                        $scope.program.published = (new Date()).toISOString();
                    } else {
                        if ($scope.program.published) {
                            $scope.program.wasPublished = true;
                        }
                        $scope.program.published = null;
                    }

                    $scope.isSaving = true;

                    $scope.programEditFrm.$setPristine();
                    $http.post(authService.apiUrl + '/programs/', $scope.program)
                        .success(function (program) {
                            //If status is preview then we dont need to initialize the UI again because we will be redirected
                            if (!(status == 'preview')) {
                                if ($scope.restoreId > 0) {
                                    $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/quests';
                                } else {
                                    finishInit(program);
                                    $timeout(function () {
                                        $scope.isSaving = false;
                                    }, 300);
                                    resolve(program);
                                }
                            }
                            else {
                                resolve(program);
                            }
                        });
                } else {

                    var levelErrArry = [];

                    _.each($scope.program.levels, function (level) {
                        if (level.val.firstActivityBonus.req) {
                            var levErr = {
                                title: level.title,
                                errMsg: $scope.levelErrorData.firstActivityBonusErrorMsg
                            }
                            levelErrArry.push(levErr);
                            $scope.levelErrorData.isFirstActivityBonusError = true;
                        }

                        if (level.val.bonusLevel.req) {
                            var levErr = {
                                title: level.title,
                                errMsg: $scope.levelErrorData.bonusLevelErrorMsg
                            }
                            levelErrArry.push(levErr);
                            $scope.levelErrorData.isBonusLevelError = true;
                        }

                        if (level.val.notLastLevelAllBonusActivity.req) {
                            var levErr = {
                                title: level.title,
                                errMsg: $scope.levelErrorData.notLastLevelAllBonusActivityErrorMsg
                            }
                            levelErrArry.push(levErr);
                            $scope.levelErrorData.isNotLastLevelAllBonusActivityError = true;
                        }

                        if (level.val.lastLevelFirstActivityBonus.req) {
                            var levErr = {
                                title: level.title,
                                errMsg: $scope.levelErrorData.lastLevelFirstActivityBonusErrorMsg
                            }
                            levelErrArry.push(levErr);
                            $scope.levelErrorData.isLastLevelFirstActivityBonus = true;
                        }

                        if (level.val.activeBonusLevelPreviousLevelHasNoActivity.req) {
                            var levErr = {
                                title: level.title,
                                errMsg: $scope.levelErrorData.activeBonusLevelPreviousLevelHasNoActivityErrorMsg
                            }
                            levelErrArry.push(levErr);
                            $scope.levelErrorData.isActiveBonusLevelPreviousLevelHasNoActivity = true;
                        }

                        if (level.val.activeBonusLevelAtLeastOneLevelHasActivity.req) {
                            var levErr = {
                                title: level.title,
                                errMsg: $scope.levelErrorData.activeBonusLevelAtLeastOneLevelHasActivityErrorMsg
                            }
                            levelErrArry.push(levErr);
                            $scope.levelErrorData.isActiveBonusLevelAtLeastOneLevelHasActivity = true;
                        }
                    });

                    if ($scope.noLevelActivityTemplate.firstActivityError.req) {
                        var levErr = {
                            title: 'Activity Order Error',
                            errMsg: $scope.noLevelActivityTemplate.firstActivityErrorMsg
                        }
                        levelErrArry.push(levErr);
                    }

                    if ($scope.noLevelActivityTemplate.levelHasNoActivity.req) {
                        var levErr = {
                            title: 'Activity Order Error',
                            errMsg: $scope.noLevelActivityTemplate.levelHasNoActivityErrorMsg
                        }
                        levelErrArry.push(levErr);
                    }

                    var userErrorMessage = '';
                    _.each(levelErrArry, function (lea) {
                        userErrorMessage += lea.title + '\n';
                        userErrorMessage += lea.errMsg + '\n \n';
                    });

                    if ($scope.levelErrorData.isFirstActivityBonusError || $scope.levelErrorData.isBonusLevelError
                        || $scope.levelErrorData.isNotLastLevelAllBonusActivityError || $scope.levelErrorData.isLastLevelFirstActivityBonus
                        || $scope.noLevelActivityTemplate.firstActivityError.req || $scope.noLevelActivityTemplate.levelHasNoActivity.req
                        || $scope.levelErrorData.isActiveBonusLevelPreviousLevelHasNoActivity || $scope.levelErrorData.isActiveBonusLevelAtLeastOneLevelHasActivity) {
                        showErrorModal($scope.levelErrorData.title, userErrorMessage, $scope.levelErrorData.okLabel);
                    }
                }
            });
        };

        var showErrorModal = function (title, text, okLabel) {
            $modal.open({
                templateUrl: 'levelModalError.html',
                controller: levelModalErrorControllerObj.levelModalErrorController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: title,
                            text: text,
                            okLabel: okLabel
                        }
                    }
                }
            });
        };

        $scope.togglePublished = function (e) {
            if (!$scope.validate()) return;

            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Publish Program?',
                            text: helpers.getPublishText($scope.program),
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }

            }).result.then(
                function () {
                    $scope.submit(e, null, true);
                });
        };


        $scope.$on('previewProgramTiles', function (e) {
            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user/program/preview?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/levels';
                    $window.location = url;
                });
        });

        $scope.preview = function (e) {
            e.preventDefault();
            e.stopPropagation();

            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user/program/' + program.slug + '/quests?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/levels';
                    $window.location = url;
                });

        };

        $scope.uploadProgramImage = function (files) {

            $scope.resetVal();

            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.programImageVal.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.programImageVal.size = true;
                return;
            }

            $scope.busy = true;
            $scope.imageLoading = 'program';

            $upload.upload({
                    url: authService.apiUrl + '/ui/square',
                    fields: {sizes: [100, 250, 600]},
                    file: file
                })
                .progress(function (e) {
                    /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                     console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                })
                .success(function (data) {

                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.program.imageUrl = data.url;
                            $scope.imageLoading = null;
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url + '/600x600';
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.removeProgramImage = function (e) {
            e.preventDefault();
            $scope.program.imageUrl = null;
            $scope.programEditFrm.$setDirty();
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
                            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/levels'
                        });

                    });
            } else {
                e.preventDefault();
                e.stopPropagation();
                $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/levels'
            }
        };
    }]);

controllers.controller('AuthoringSuiteProgramScoringController', ['$scope', '$q', '$http', '$timeout', 'authService', '$window', 'helperService', '$upload', '$modal',
    function ($scope, $q, $http, $timeout, authService, $window, helpers, $upload, $modal) {
        $scope.isSaving = false;
        $scope.program = null;
        $scope.canEditEntity = helpers.canEditEntity;

        $scope.restore = function (e, history) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/scoring?restore=' + history.programId;
        };

        $scope.revert = function (e) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/scoring';
        };

        this.init = function (slug, restore) {
            $scope.slug = slug;
            init($scope.slug, restore).then(function () {
                $timeout(function () {
                    $scope.isSaving = false;
                }, 3000);
            });
        };

        var init = function (slug, restore) {
            return $q(function (resolve, reject) {
                $scope.restoreId = Number(restore);

                var url = authService.apiUrl + '/programs/' + slug;
                if (restore > 0) url += ('?restore=' + restore);
                $scope.loading.isLoading++;
                $http.get(url)
                    .success(function (program) {
                        initPrograms([program]);
                        $scope.program = program;

                        //Call to set program mode based on version
                        helpers.canEditEntity({}, program);

                        $scope.stopLoading();
                        $scope.setSelectedProgram($scope.program);
                        resolve(program);
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };

        var initPrograms = function (programs) {
            angular.forEach(programs, function (program) {
                if (program.description) program.description = program.description.replace(/\n/g, '<br>');
                program.comment = null;
                angular.forEach(program.quests, function (quest) {
                    quest.distributePoints = null;
                });
            });
        };

        $scope.selectProgram = function (program) {
            $scope.program = program;
        };

        $scope.decreasePoints = function (challenge) {
            if (challenge.points <= 0) return;
            challenge.points--;
            $scope.programEditFrm.$setDirty();
        };

        $scope.increasePoints = function (challenge) {
            challenge.points++;
            $scope.programEditFrm.$setDirty();
        };

        //$scope.decreaseInspirePoints = function (quest) {
        //    if (quest.inspirePoints <= 0) return;
        //    quest.inspirePoints--;
        //    $scope.programEditFrm.$setDirty();
        //};

        //$scope.increaseInspirePoints = function (quest) {
        //    quest.inspirePoints++;
        //    $scope.programEditFrm.$setDirty();
        //};

        //$scope.decreaseDoPoints = function (quest) {
        //    if (quest.inspirePoints <= 0) return;
        //    quest.inspirePoints--;
        //    $scope.programEditFrm.$setDirty();
        //};
        
        $scope.inspireActivityPoints = function (quest) {
            var points = 0;
            if (quest) {
                if (quest.inspirePoints != null) {
                    points = quest.inspirePoints ? quest.inspirePoints : 0;
                }
            }
            console.log(points);
            return points;
       

        };

        $scope.setInspirePoints = function (inspirepoints, quest) {

            quest.inspirePoints = inspirepoints;
            console.log(inspirepoints ? inspirepoints : 0);
        };

        
        $scope.getTododpoints = function (todo, qid) {
            var points = 0;
            _.each($scope.program.todos, function (todo) {
                //   todo.questId = qid;
                if (todo.questId != null) {
                    if (todo.questId == qid) {
                        points = todo.points ? todo.points : 0;

                    }

                }
            });
            return points;
        };


        $scope.setTodoPoints = function (todopoint, qid) {
            var point = 0;
            console.log(todopoint);

            _.each($scope.program.todos, function (todo) {
                //   todo.questId = qid;
                if (todo.questId != null) {
                    if (todo.questId == qid) {
                        todo.points = todopoint;
                        console.log(todo);
                    }
                }

            });
        };

        $scope.increaseDoPoints = function (quest) {
            quest.inspirePoints++;
            $scope.programEditFrm.$setDirty();
        };

        $scope.decreaseHintPoints = function (hints) {
            if (hints.points <= 0) return;
            hints.points--;
            $scope.programEditFrm.$setDirty();
        };

        $scope.increaseHintPoints = function (hints, challenge) {
            if (hints.points < challenge.points){
                hints.points++;
            }
            $scope.programEditFrm.$setDirty();
        };

        $scope.distributePoints = function (quest, index) {
            $('#d' + index).tooltip('destroy');

            var showError = function (index) {
                var tt = $('#d' + index);
                tt.tooltip({
                    html: true,
                    trigger: 'manual',
                    placement: 'left'
                }).tooltip('show');
                $timeout(function () {
                    tt.tooltip('destroy');
                }, 4000);
            };


            var r = /[0-9]+/;
            if (!quest.distributePoints || !r.test(quest.distributePoints)) return showError(index);

            var t = parseInt(quest.distributePoints);
            if (t < 1 || t > 1000) return showError(index);

            var len = quest.challenges.length;
            if (quest.challenges[quest.challenges.length - 1].type == 'finish') len--;

            var total = parseInt(quest.distributePoints);
            var pts = Math.floor(total / len);

            
            for (var i = 0; i < len; i++) {
                if (i == len - 1) {
                    quest.challenges[i].points = total;
                    //if (quest.challenges[i].questions.length > 0) {
                    //    if (quest.challenges[i].questions[0].hints.length > 0) {
                    //        _.each(quest.challenges[i].questions[0].hints, function (hint) {
                    //            hint.points = total;

                    //        });
                    //    }
                    //}
                }
                else {
                    quest.challenges[i].points = pts;
                    //if (quest.challenges[i].questions.length > 0) {
                    //    if (quest.challenges[i].questions[0].hints.length > 0) {
                    //        _.each(quest.challenges[i].questions[0].hints, function (hint) {
                    //            hint.points = total;

                    //        });
                    //    }
                    //}
                    
                    total -= pts;
                }
            }
            $scope.programEditFrm.$setDirty();
        };
        $scope.distributePointsChange = function (index) {
            $('#d' + index).tooltip('destroy');
        };

        $scope.resetVal = function () {
            $scope.val = {
                title: {
                    req: false
                },
                sequencing: {
                    type: {
                        req: false
                    },
                    interval: {
                        req: false
                    },
                    period: {
                        req: false
                    },
                    intervalType: {
                        req: false
                    },
                    startDate: {
                        req: false
                    }
                },
                challenges: {
                    req: false
                }
            };

            $scope.programImageVal = {
                size: false,
                type: false
            };
        };

        $scope.validate = function (silent, publish) {
            if (!silent) {
                $scope.resetVal();
            }

            var isValid = true;

            //If there is no program then no need to go through rest of valiation logic
            if (!$scope.program) {
                isValid = false;
            }
            else {
                if (publish && isValid && !silent) {
                    angular.forEach($scope.program.levels, function (level) {
                        if (isValid) {
                            angular.forEach(level.quests, function (quest) {
                                if (quest.challenges.length == 0) {
                                    isValid = false;
                                    if (!silent) {
                                        $scope.val.challenges.req = true;
                                    }
                                }
                            })
                        }
                    });

                    if (isValid) {
                        angular.forEach($scope.quests, function (quest) {
                            if (quest.challenges.length == 0) {
                                isValid = false;
                                if (!silent) {
                                    $scope.val.challenges.req = true;
                                }
                            }
                        });
                    }
                }

                if (!$scope.program.title) {
                    if (!silent) {
                        $scope.val.title.req = true;
                    }
                    isValid = false;
                }

                if (!$scope.program.sequencingTypeId) {
                    if (!silent) {
                        $scope.val.sequencing.type.req = true;
                    }
                    isValid = false;
                }

                if ($scope.program.sequencingTypeId == helpers.sequencingTypes.interval.id) {
                    if (!$scope.program.sequencingParameters.interval) {
                        if (!silent) {
                            $scope.val.sequencing.interval.req = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalPeriod) {
                        if (!silent) {
                            $scope.val.sequencing.period.req = true;
                        }
                        isValid = false;
                    }
                    if (!$scope.program.sequencingParameters.intervalStartTypeId) {
                        if (!silent) {
                            $scope.val.sequencing.intervalType.req = true;
                        }
                        isValid = false;
                    } else if ($scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onSpecificDate.id && !$scope.program.sequencingParameters.startDate) {
                        if (!silent) {
                            $scope.val.sequencing.startDate.req = true;
                        }
                        isValid = false;
                    }
                }
            }

            if (isValid && !silent) {
                if ($scope.program.sequencingParameters && $scope.program.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                    $scope.program.sequencingParameters.startDate = null;
                }
                _.each($scope.program.levels, function (level) {
                    if (level.sequencingParameters && level.sequencingParameters.intervalStartTypeId == helpers.sequencingTypeIntervalStartTypes.onStartDate.id) {
                        level.sequencingParameters.startDate = null;
                    }
                })
            }

            if (!isValid && !silent) {
                $scope.scrollToError();
            }


            return isValid;
        };

        $scope.$on('autoSaveNow', function () {
            $scope.autoSaveNow();
        });

        $scope.$watch(function () {
            return $scope.validate(true);
        }, function () {
            $scope.autoSaveNow();
        }, true);

        $scope.autoSaveNow = function () {
            if ($scope.validate(true) && !$scope.restoreId && $scope.programEditFrm.$dirty) {
                $scope.autoSave($scope.program).then(function (program) {
                    $scope.program.createdAt = program.createdAt;
                    $scope.program.history = program.history;
                    $scope.program.version = program.version;
                    $scope.program.id = program.id;
                    $scope.program.status = program.status;
                    $scope.program.published = program.published;
                });
            }
        };

        $scope.togglePublished = function (e) {
            if (!$scope.validate()) return;

            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Publish Program?',
                            text: helpers.getPublishText($scope.program),
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $scope.submit(e, null, true);
                });
        };

        window.onbeforeunload = function (e) {
            if ($scope.programEditFrm.$dirty) {
                return 'There are unsaved changes on this page!'
            }
        };

        $scope.submit = function (e, status, publish) {
            e.preventDefault();
            $scope.program.status = status ? status : 'ready';

            return $q(function (resolve, reject) {
                if ($scope.validate(false, status == 'preview' ? false : publish)) {

                    //If the program is being published, add the publish date, otherwise remove the publish date publish doesn't carry over from one version to the next
                    if (publish) {
                        $scope.program.published = (new Date()).toISOString();
                    } else {
                        if ($scope.program.published) {
                            $scope.program.wasPublished = true;
                        }
                        $scope.program.published = null;
                    }


                    //If the program is not of Interval sequencing type, then remove any parameters that were associated with that type.
                    if ($scope.program.sequencingTypeId != $scope.sequencingTypes.interval.id) {
                        $scope.program.sequencingParameters = null;
                    }

                    $scope.isSaving = true;

                    $scope.programEditFrm.$setPristine();
                    $http.post(authService.apiUrl + '/programs/', $scope.program)
                        .success(function (program) {
                            //If status is preview then we dont need to initialize the UI again because we will be redirected
                            if (!(status == 'preview')) {
                                if ($scope.restoreId > 0) {
                                    $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/quests';
                                } else {
                                    initPrograms([program]);
                                    $scope.program = program;
                                    $scope.setSelectedProgram($scope.program);
                                    $timeout(function () {
                                        $scope.isSaving = false;
                                    }, 300);
                                    resolve(program);
                                }
                            } else {
                                resolve(program);
                            }
                        });
                }
            });
        };

        $scope.$on('previewProgramTiles', function (e) {
            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/scoring';
                    $window.location = url;
                });
        });

        $scope.preview = function (e) {
            e.preventDefault();
            e.stopPropagation();

            $scope.submit(e, 'preview', true)
                .then(function (program) {
                    var url = '/user/program/' + program.slug + '/quests?preview=true';
                    url += '&previewRet=' + '/program/' + program.slug + '/edit/scoring';
                    $window.location = url;
                });
        };

        $scope.uploadProgramImage = function (files) {
            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            $scope.programImageVal.size = false;
            $scope.programImageVal.type = false;

            // Check type
            if (!helpers.validImageFile(file.name)) {
                $scope.programImageVal.type = true;
                return;
            }
            // Check size
            if (file.size > helpers.maxImageSize) {
                $scope.programImageVal.size = true;
                return;
            }

            $scope.busy = true;
            $scope.imageLoading = 'program';

            $upload.upload({
                    url: authService.apiUrl + '/ui/square',
                    fields: {sizes: [100, 250, 600]},
                    file: file
                })
                .progress(function (e) {
                    /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                     console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                })
                .success(function (data) {

                    var img = new Image();
                    img.onload = function () {
                        $scope.$apply(function () {
                            $scope.program.imageUrl = data.url;
                            $scope.imageLoading = null;
                            $scope.busy = false;
                        });
                    };
                    img.src = data.url + '/600x600';
                    $scope.programEditFrm.$setDirty();
                });
        };

        $scope.removeProgramImage = function (e) {
            e.preventDefault();
            $scope.program.imageUrl = null;
            $scope.programEditFrm.$setDirty();
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
                            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/scoring'
                        });

                    });
            } else {
                e.preventDefault();
                e.stopPropagation();
                $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit/scoring'
            }
        };
    }
]);

