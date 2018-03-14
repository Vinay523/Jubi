'use strict';

var module = angular.module('Jubi.controllers');

module.controller('TodoController', ['$scope', 'helperService', 'authService', '$upload', '$timeout', '$modal', '$q', '$http', '$rootScope', 'ngAudio', '$sce',
    function ($scope, helpers, authService, $upload, $timeout, $modal, $q, $http, $rootScope, ngAudio, $sce) {
        $scope.addModal = false;

        $scope.bonusArray = [];

        $scope.validateTodo = function (userTodo) {
            $scope.resetVal();
            var hasError = false;

            // if (userTodo.dueDate && new Date(userTodo.dueDate) < $scope.today) {
            //     userTodo.todo.val.dueDate.min = true;
            //     hasError = true;
            // }

            if (Number(userTodo.addedBonusPoints) > 0 && Number(userTodo.addedBonusPoints) > $scope.getCurrentBonusPointsAvailable()) {
                userTodo.todo.val.bonusPoints.max = true;
                hasError = true;
            }
            return !hasError;
        };

        $scope.todoValTemplate = {
            dueDate: {
                min: false
            },
            bonusPoints: {
                max: false
            }
        };

        $scope.todoOpened = function () {
            if ($scope.selectedUserTodo.hasBeenCompleted && $scope.selectedUserTodo.status != 'completed' && $scope.todosModel.isBuddyValidating) {
                $http.post(authService.apiUrl + '/todo/mark-as-read/', { userTodo: $scope.selectedUserTodo, status: status })
                    .success(function (newTodo) {
                        $scope.selectedUserTodo.status = 'completed';
                    })
                    .error(function (err) {
                        reject(err);
                    });
            }
            $scope.calculateBonus();
        };

        $scope.todoClick = function () {
            if ($scope.selectedUserTodo && $scope.selectedUserTodo.todo && $scope.selectedUserTodo.todo.mediaChallenge && $scope.selectedUserTodo.todo.mediaChallenge.addMedia) {
                $scope.selectedUserTodo.todo.mediaChallenge.addMedia.in = false;
            }
        };

        $scope.calculateBonus = function () {

            if ($scope.selectedUserTodo.bonusPoints && $scope.selectedUserTodo.bonusPoints.length > 0) {
                _.each($scope.selectedUserTodo.bonusPoints, function (bonus) {
                    //if bonus array is empty then add. else find and +=
                    if ($scope.bonusArray.length > 0) {

                        //find cant find then add
                        var found = false;
                        var index = null;
                        _.each($scope.bonusArray, function (bAry, i) {
                            if (bAry.user.id == bonus.user.id) {
                                found = true;
                                index = i;
                            }
                        });

                        if (found) {
                            $scope.bonusArray[index].points += bonus.points
                        } else {

                            var bonusArraySpec = {
                                points: bonus.points,
                                user: bonus.user
                            };

                            $scope.bonusArray.push(bonusArraySpec);
                        }

                    } else {

                        var bonusArraySpec = {
                            points: bonus.points,
                            user: bonus.user
                        };
                        $scope.bonusArray.push(bonusArraySpec);
                    }

                });
            }
        };

        $scope.completeTodo = function (e, userTodo, status) {
            if ($scope.validateTodo(userTodo)) {
                $rootScope.closeTodoModal();
                userTodo.saveInProgress = true;
                if (!userTodo.todo.validate) {
                    if (userTodo.status != 'completed' && $scope.program) {
                        $scope.program.score.points.earned += userTodo.todo.points;
                    }
                    status = 'completed';
                }
                if ($scope.program) {
                    $scope.program.score.bonusPointsUsed += Number(userTodo.addedBonusPoints);
                }
                return $q(function (resolve, reject) {
                    $http.post(authService.apiUrl + '/todo/update/', { userTodo: userTodo, status: status })
                        .success(function (newTodo) {
                            userTodo.saveInProgress = false;
                            $rootScope.updateTodos(userTodo, newTodo);
                            resolve();
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            } else {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        $scope.deleteTodoVerificationComment = function (e, result, challenge) {
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Remove Comment?',
                            text: 'You are about to permenantly remove this comment. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    return $q(function (resolve, reject) {
                        $http.post(authService.apiUrl + '/todo/result/' + result.id + '/delete')
                            .success(function (newTodo) {
                                challenge.results = _.without(challenge.results, result);
                                resolve();
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                });
        };

        $scope.addMediaTemplate = {
            in: false,
            val: {
                req: false,
                fmt: false
            },
            link: null
        };

        $scope.resetVal = function () {
            if ($scope.selectedUserTodo.todo.mediaChallenge) {
                if (!$scope.selectedUserTodo.todo.mediaChallenge.addMedia) {
                    $scope.selectedUserTodo.todo.mediaChallenge.addMedia = angular.copy($scope.addMediaTemplate);
                }
                $scope.selectedUserTodo.todo.mediaChallenge.addMedia.val = {
                    req: false,
                    fmt: false
                };
                $scope.selectedUserTodo.todo.mediaChallenge.val = {
                    media: {
                        type: null,
                        size: null
                    }
                }
            }
            $scope.selectedUserTodo.todo.val = angular.copy($scope.todoValTemplate);
        };

        //for videogular audio intialization for audio sent from user to buddy. 
        if ($scope.selectedUserTodo.todo.mediaChallenge) {
            if ($scope.selectedUserTodo.todo.mediaChallenge.userMedia.length > 0) {
                _.each($scope.selectedUserTodo.todo.mediaChallenge.userMedia, function (media) {
                    if (media.type == 'audio') {
                        media.api = null;
                        media.sources = [{ src: $sce.trustAsResourceUrl(media.url), type: 'audio/mp3' }];
                    }
                });
            }
        }

        if ($scope.selectedUserTodo.todo.mediaChallenge) {
            $scope.selectedUserTodo.todo.mediaChallenge.addMedia = angular.copy($scope.addMediaTemplate);
        }

        $scope.resetVal();


        $scope.addMedia = function (e) {
            e.stopPropagation();
            if (!$scope.selectedUserTodo.todo.mediaChallenge.addMedia)
                $scope.selectedUserTodo.todo.mediaChallenge.addMedia = angular.copy($scope.addMediaTemplate);
            $scope.addModal = true;

            //var btnElm = angular.element(e.target);
            //var popupElm = btnElm.next('.add-media-popup');
            //  popupElm.css('left', btnElm.outerWidth() + (15 + 30));
            //angular.element('.add-media .val').addClass('ng-hide');
            // $scope.selectedUserTodo.todo.mediaChallenge.addMedia.in = !$scope.selectedUserTodo.todo.mediaChallenge.addMedia.in;
        };
        $scope.closeAddMediaModal = function () {
            if ($scope.addModal) {
                $scope.addModal = false;
            }
        }

        $scope.selectMediaLink = function (e, ref) {
            e.preventDefault();
            e.stopPropagation();

            $scope.resetVal();
            var isValid = true;
            if (!$scope.selectedUserTodo.todo.mediaChallenge.addMedia.link) {
                $scope.selectedUserTodo.todo.mediaChallenge.addMedia.val.req = true;
                isValid = false;
            }
            else {

                if (ref == 'YouTube') {
                    //<iframe width="640" height="360" src="https://www.youtube.com/embed/aSRC2KLNkd4" frameborder="0" allowfullscreen></iframe>
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test($scope.selectedUserTodo.todo.mediaChallenge.addMedia.link)) {
                        $scope.selectedUserTodo.todo.mediaChallenge.addMedia.val.fmt = true;
                        isValid = false;
                    }
                }
                else {
                    $scope.selectedUserTodo.todo.mediaChallenge.addMedia.val.src = true;
                    isValid = false;
                }
            }

            if (!isValid) return;

            if (ref == 'YouTube') {

                // Get the source url
                r = /src="([_\-a-z0-9:\/\.]+)"/gi;
                var m = r.exec($scope.selectedUserTodo.todo.mediaChallenge.addMedia.link);

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
                    userId: authService.user.id,
                    date: new Date(),
                    mimeType: 'video/*',
                    iframe: $scope.selectedUserTodo.todo.mediaChallenge.addMedia.link,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
                };
                $scope.selectedUserTodo.todo.mediaChallenge.userMedia.push(media);

                $scope.selectedUserTodo.todo.mediaChallenge.addMedia.in = false;
                $scope.selectedUserTodo.todo.mediaChallenge.addMedia.link = null;
            }
        };

        $scope.playerReady = function (media, api) {
            media.api = api;

        };

        $scope.formatTime = function (t) {
            var m = moment(t);
            var diff = (moment().valueOf() - m.valueOf()) / 1000;

            if (diff <= 60) return 'Just Now';
            //if (diff <= 60 * 60 * 24) return 'Earlier Today';
            //if (diff <= 60 * 60 * 24 * 2) return 'Yesterday';
            //if (diff <= 60 * 60 * 24 * 7) return 'Earlier This Week';
            return m.format('MMM D, YYYY @ h:mm a');
        };

        $scope.uploadDownloadContent = function (files, challenge) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            //if (!helpers.validUploadFile(file.name)) {
            //    $scope.selectedUserTodo.todo.mediaChallenge.val.media.type = true;
            //    return;
            //}

            // Check size
            if (file.size > helpers.maxFileSize) {
                $scope.selectedUserTodo.todo.mediaChallenge.val.media.size = true;
                return;
            }

            $scope.busy = true;
            $scope.selectedUserTodo.todo.mediaChallenge.isLoading = true;

            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
                .success(function (data) {
                    var userMedia = {
                        type: 'resource',
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref,
                        userId: authService.user.id,
                    };

                    challenge.userMedia.push(userMedia);

                    $timeout(function () {
                        $scope.selectedUserTodo.todo.mediaChallenge.isLoading = false;
                        //$scope.selectedUserTodo.todo.mediaChallenge.addMedia.in = false;
                        $scope.addModal = false;
                        $scope.busy = false;
                    }, 300);
                });
        };

        $scope.uploadMedia = function (files) {
            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            var mediaType;

            // Check type
            if (!helpers.validVideoFile(file.name)) {
                if (!helpers.validAudioFile(file.name)) {
                    if (!helpers.validImageFile(file.name)) {
                        $scope.uploadDownloadContent(files, $scope.selectedUserTodo.todo.mediaChallenge);
                        return;
                    } else {
                        mediaType = 'image';
                        // Check size
                        if (file.size > helpers.maxImageSize) {
                            $scope.selectedUserTodo.todo.mediaChallenge.val.media.size = true;
                            return;
                        }
                    }
                } else {
                    mediaType = 'audio';
                    // Check size
                    if (file.size > helpers.maxAudioSize) {
                        $scope.selectedUserTodo.todo.mediaChallenge.val.media.size = true;
                        return;
                    }
                }
            } else {
                mediaType = 'video';
                // Check size
                if (file.size > helpers.maxVideoSize) {
                    $scope.selectedUserTodo.todo.mediaChallenge.val.media.size = true;
                    return;
                }
            }

            $scope.busy = true;
            $scope.selectedUserTodo.todo.mediaChallenge.isLoading = true;

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
                    if (mediaType == 'audio') {
                        var media = {
                            userId: authService.user.id,
                            type: mediaType,
                            name: file.name,
                            date: file.lastModifiedDate,
                            mimeType: file.type,
                            url: data.url,
                            ref: data.ref,
                            source: 'system',
                            canDrag: false,
                            encoding: true,
                            api: null,
                            sources: [{ src: $sce.trustAsResourceUrl(data.url), type: 'audio/mp3' }]
                        };
                        $scope.selectedUserTodo.todo.mediaChallenge.userMedia.push(media);

                        $timeout(function () {
                            $scope.selectedUserTodo.todo.mediaChallenge.isLoading = false;

                            $scope.busy = false;
                        }, 300);
                    }
                    else {
                        var img = new Image();
                        img.onload = function () {
                            $scope.$apply(function () {
                                var media = {
                                    userId: authService.user.id,
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
                                $scope.selectedUserTodo.todo.mediaChallenge.userMedia.push(media);

                                $timeout(function () {
                                    $scope.selectedUserTodo.todo.mediaChallenge.isLoading = false;
                                    $scope.busy = false;
                                }, 300);
                            });
                        };
                        img.src = data.url;
                    }
                    //   $scope.selectedUserTodo.todo.mediaChallenge.addMedia.in = false;
                    $scope.addModal = false;
                });
        };

        $scope.playVideo = function (media) {
            if (media.source == 'youtube') {
                $modal.open({
                    templateUrl: 'youTubePlayer.html',
                    controller: youTubePlayerControllerObj.youTubePlayerController,
                    resolve: {
                        initData: function () {
                            return { iframe: media.iframe };
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

        $scope.removeMedia = function (e, media) {
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
                    $scope.selectedUserTodo.todo.mediaChallenge.userMedia = _.without($scope.selectedUserTodo.todo.mediaChallenge.userMedia, media)
                });
        };

        

    }]);





