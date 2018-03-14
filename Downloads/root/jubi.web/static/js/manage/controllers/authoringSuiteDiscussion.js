'use strict';

var controllers = angular.module('Jubi.controllers');


controllers.controller('AuthoringSuiteProgramDiscussionController', ['$scope', '$http', '$timeout', '$q', '$modal', '$upload', '$window', 'authService', 'helperService',
    function ($scope, $http, $timeout, $q, $modal, $upload, $window, authService, helpers) {

        $scope.program = null;
        $scope.forum = null;
        $scope.isSaving = false;

        var resetVal = function () {
            $scope.val = {
                newTopicPoints: {fmt: false},
                newCommentPoints: {fmt: false},
                likePoints: {fmt: false},
                topicCommentPoints: {fmt: false},
                itemLikePoints: {fmt: false},
                newTopicPointsMax: {fmt: false},
                newCommentPointsMax: {fmt: false},
                likePointsMax: {fmt: false},
                topicCommentPointsMax: {fmt: false},
                itemLikePointsMax: {fmt: false},
                newEncouragePoints: {fmt: false},
                newEncouragePointsMax: {fmt: false},
                newAppreciatePoints: {fmt: false},
                newAppreciatePointsMax: {fmt: false},
                newStoryPoints: {fmt: false},
                newStoryPointsMax: {fmt: false}
            };
            if (!$scope.forum) return;
            _.each($scope.forum.categories, function (category) {
                category.val = {
                    name: {req: false, dup: false}
                };
            });
        };
        resetVal();

        window.onbeforeunload = function (e) {
            if ($scope.programEditFrm.$dirty) {
                return 'There are unsaved changes on this page!'
            }
        };

        var load = function (slug) {
            return $q(function (resolve, reject) {
                $scope.loading.isLoading++;
                $http.get(authService.apiUrl + '/programs/' + slug)
                    .success(function (program) {
                        if (program.description) program.description = program.description.replace(/\n/g, '<br>');
                        $scope.program = program;

                        //Call to set program mode based on version
                        helpers.canEditEntity({}, program);


                        $http.get(authService.apiUrl + '/programs/' + slug + '/forum')
                            .success(function (forum) {
                                if (forum.newTopicPoints) forum.newTopicPoints = forum.newTopicPoints.toString();
                                if (forum.newCommentPoints) forum.newCommentPoints = forum.newCommentPoints.toString();
                                if (forum.likePoints) forum.likePoints = forum.likePoints.toString();
                                $scope.forum = forum;
                                resetVal();
                                $scope.stopLoading();
                                resolve();
                            })
                            .error(function (err) {
                                reject(err);
                            });

                        resolve(program);
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };

        this.init = function (slug) {
            load(slug);
        };

        $scope.addCategory = function () {
            $scope.forum.categories.push({
                id: new Date().getTime(),
                name: null
            });
            $scope.programEditFrm.$setDirty();
        };
        $scope.removeCategory = function (index, category) {
            $scope.validationInProgress = true;
            $http.get(authService.apiUrl + '/forum/category/' + category.id + '/has-topics')
                .success(function (hasTopics) {
                    $scope.validationInProgress = false;
                    if (hasTopics) {
                        $modal.open({
                            templateUrl: 'confirmModal.html',
                            controller: confirmModalControllerObj.confirmModalController,
                            size: 'sm',
                            resolve: {
                                initData: function () {
                                    return {
                                        title: 'Remove Topic?',
                                        text: 'You are about to remove a topic that has posts associated to it. All associated posts will be removed. Continue?',
                                        ok: 'Yes', cancel: 'No'
                                    }
                                }
                            }
                        }).result.then(
                            function () {
                                if ($scope.forum.categories.length <= 1) return;
                                $scope.forum.categories.splice(index, 1);
                                $scope.programEditFrm.$setDirty();
                            });
                    } else {
                        if ($scope.forum.categories.length <= 1) return;
                        $scope.forum.categories.splice(index, 1);
                        $scope.programEditFrm.$setDirty();
                    }
                });
        };

        $scope.submit = function (e) {
            e.preventDefault();
            resetVal();
            var isValid = true;

            if ($scope.forum.newTopicPoints) {
                if (!helpers.validInteger($scope.forum.newTopicPoints)) {
                    $scope.val.newTopicPoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newCommentPoints) {
                if (!helpers.validInteger($scope.forum.newCommentPoints)) {
                    $scope.val.newCommentPoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.likePoints) {
                if (!helpers.validInteger($scope.forum.likePoints)) {
                    $scope.val.likePoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.topicCommentPoints) {
                if (!helpers.validInteger($scope.forum.topicCommentPoints)) {
                    $scope.val.topicCommentPoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.itemLikePoints) {
                if (!helpers.validInteger($scope.forum.itemLikePoints)) {
                    $scope.val.itemLikePoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newTopicPointsMax) {
                if (!helpers.validInteger($scope.forum.newTopicPointsMax)) {
                    $scope.val.newTopicPointsMax.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newCommentPointsMax) {
                if (!helpers.validInteger($scope.forum.newCommentPointsMax)) {
                    $scope.val.newCommentPointsMax.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.likePointsMax) {
                if (!helpers.validInteger($scope.forum.likePointsMax)) {
                    $scope.val.likePointsMax.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.topicCommentPointsMax) {
                if (!helpers.validInteger($scope.forum.topicCommentPointsMax)) {
                    $scope.val.topicCommentPointsMax.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.itemLikePointsMax) {
                if (!helpers.validInteger($scope.forum.itemLikePointsMax)) {
                    $scope.val.itemLikePointsMax.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newEncouragePoints) {
                if (!helpers.validInteger($scope.forum.newEncouragePoints)) {
                    $scope.val.newEncouragePoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newEncouragePointsMax) {
                if (!helpers.validInteger($scope.forum.newEncouragePointsMax)) {
                    $scope.val.newEncouragePointsMax.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newAppreciatePoints) {
                if (!helpers.validInteger($scope.forum.newAppreciatePoints)) {
                    $scope.val.newAppreciatePoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newAppreciatePointsMax) {
                if (!helpers.validInteger($scope.forum.newAppreciatePointsMax)) {
                    $scope.val.newAppreciatePointsMax.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newStoryPoints) {
                if (!helpers.validInteger($scope.forum.newStoryPoints)) {
                    $scope.val.newStoryPoints.fmt = true;
                    isValid = false;
                }
            }
            if ($scope.forum.newStoryPointsMax) {
                if (!helpers.validInteger($scope.forum.newStoryPointsMax)) {
                    $scope.val.newStoryPointsMax.fmt = true;
                    isValid = false;
                }
            }

            _.each($scope.forum.categories, function (category) {
                if (!category.name || category.name.trim().length <= 0) {
                    category.val.name.req = true;
                    isValid = false;
                }
                var dup = _.find($scope.forum.categories, function (c) {
                    if (!c.name) return false;
                    return c.id != category.id && c.name.trim().toLowerCase() === category.name.trim().toLowerCase();
                });
                if (dup) {
                    category.val.name.dup = true;
                    isValid = false;
                }
            });

            if (!isValid) return;
            $scope.programEditFrm.$setPristine();
            $scope.isSaving = true;
            $http.post(authService.apiUrl + '/programs/' + $scope.program.slug + '/forum', $scope.forum)
                .success(function (forum) {
                    if (forum.newTopicPoints) forum.newTopicPoints = forum.newTopicPoints.toString();
                    if (forum.newCommentPoints) forum.newCommentPoints = forum.newCommentPoints.toString();
                    if (forum.likePoints) forum.likePoints = forum.likePoints.toString();
                    $scope.forum = forum;
                    resetVal();
                    $scope.isSaving = false;
                });
        };

        $scope.cancel = function (e) {
            e.preventDefault();
            $window.location = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit';
        }
    }]);



