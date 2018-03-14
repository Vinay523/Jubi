'use strict';

var module = angular.module('Jubi.controllers');

module.controller('EncourageController', ['$scope', '$http', '$timeout', '$q', '$window', 'authService', 'helperService', '$rootScope', '$upload', '$modal',
    function ($scope, $http, $timeout, $q, $window, authService, helperService, $rootScope, $upload, $modal) {
        $scope.addMediaValTemplate = {
            type: false,
            size: false,
            fmt: false,
            req: false
        };

        $scope.contentValTemplate = {
            req: false
        };
        $scope.ui = {
            addMedia: {
                in: false,
                link: null
            }
        };

        $scope.model = {
            title: null,
            content: null,
            category: null,
            networkUsers: [],
            sharing: 'all',
            media: []
        };
        $scope.commentModel = {
            comment: null
        };
        $scope.inspireClick = function () {
            $scope.ui.addMedia.in = false;
        };
        $scope.selectedNetworkUsers = [];
        $scope.ui.networkUsers = $rootScope.networkUsers;
        $scope.ui.networkUsers = $rootScope.userGroups.concat($scope.ui.networkUsers);
        $scope.categories = $rootScope.forumCategories;
        $scope.helpText = $rootScope.inspirationHelpTexts.encourageDescription;
        $scope.model.networkUsers = [];
        $scope.ownNetworkUser = _.find($scope.ui.networkUsers, function (networkUser) {
            return networkUser.user.id == authService.user.id;
        });
        $scope.ui.networkUsers = _.without($scope.ui.networkUsers, $scope.ownNetworkUser);
        $scope.networkUsersOriginal = angular.copy($scope.ui.networkUsers);

        $rootScope.$on('userGroupAdded', function(e, item){
            $rootScope.formatUserGroup(item);
            $scope.ui.networkUsers.unshift(item);
        });

        $rootScope.$on('userGroupRemoved', function (e, item) {
            var groups = _.filter($scope.ui.networkUsers, function(user){
                return user.isGroup == true && user.id == item.id;
            });
            _.each(groups, function(group){
                $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
            });
        });


        $scope.userSelected = function (networkUser, refObj, originalSelectedbj, handleBinding) {
            if ($scope.model.networkUsers.length == 0) {
                $scope.model.networkUsers.push($scope.ownNetworkUser);
            }
            var selectedNetworkUser = _.findWhere($scope.ui.networkUsers, {id: networkUser.id});
            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, selectedNetworkUser);
            $scope.model.networkUsers.push(selectedNetworkUser);

            if(handleBinding){
                $scope.selectedNetworkUsers.push({id: networkUser.id});
            }
        };

        $scope.createUserGroup = function(){
            var usersForGroup = _.filter($scope.model.networkUsers, function(networkUser){
                return networkUser.userId != authService.user.id;
            });
            $rootScope.showCreateUserGroup(usersForGroup);
        };

        $scope.removeGroup = function(group){
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Delete Group?',
                            text: 'Are you sure you want to delete this user group?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.post(authService.apiUrl + '/program-user-group/' + group.id + '/delete')
                        .success(function () {
                            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
                            $rootScope.$emit('userGroupRemoved', group);
                        }).error(function (err) {
                            $scope.submitError = err;
                        })
                })
        };

        $scope.groupSelected = function(group){
            _.each(group.programUsers, function(groupUser){
                if(groupUser.programUser.user.id != authService.user.id) {
                    if(_.findWhere($scope.selectedNetworkUsers, {id: groupUser.programUser.id}) == null) {
                        $scope.userSelected(groupUser.programUser, null, groupUser.programUser, true);
                    }
                }
            })
        };

        $scope.removeNetworkUser = function (networkUser) {
            var selectedNetworkUser = _.findWhere($scope.networkUsersOriginal, {id: networkUser.id});
            $scope.ui.networkUsers.push(selectedNetworkUser);
            $scope.model.networkUsers = _.without($scope.model.networkUsers, _.findWhere($scope.model.networkUsers, {id: networkUser.id}));
            $scope.selectedNetworkUsers = _.without($scope.selectedNetworkUsers, _.findWhere($scope.selectedNetworkUsers, {id: networkUser.id}));

            if ($scope.model.networkUsers.length == 1) {
                $scope.model.networkUsers = _.without($scope.model.networkUsers, $scope.ownNetworkUser);
            }
        };

        $scope.removeAllUsers = function () {
            $scope.ui.networkUsers = angular.copy($scope.networkUsersOriginal);
            $scope.model.networkUsers = [];
            $scope.selectedNetworkUsers = [];
        };

        $scope.submitTopic = function (e) {
            e.preventDefault();
            $scope.resetVal();

            var isValid = true;

            if (!$scope.commentModel.comment || $scope.commentModel.comment.trim().length <= 0) {
                $scope.ui.val.content.req = true;
                isValid = false;
            }

            if (!isValid) return;

            $scope.submitError = null;
            $scope.topicSubmitting = true;

            $scope.model.title = 'Encouragement from ' + authService.user.firstName + ' ' + authService.user.lastName;
            $scope.model.category = _.findWhere($scope.categories, {name: 'Inspiration'});
            $scope.model.allowDuplicate = true;
            $scope.model.subType = 'encouragement';

            $rootScope.closeInspireModal();
            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/', $scope.model)
                .success(function (result) {
                    $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + result.topic.id + '/comments', $scope.commentModel)
                        .success(function (topic) {
                            $rootScope.$emit('addDiscussionTopic', {newTopic: topic});
                            $scope.program.score.points.earned += ($scope.program.forum.newEncouragePoints + $scope.program.forum.newCommentPoints);
                            $scope.result.discussionScore.newEncouragePoints += $scope.program.forum.newEncouragePoints;
                            $scope.result.discussionScore.newCommentPoints += $scope.program.forum.newCommentPoints;
                            $rootScope.updatePointAwardValuesToConsiderMax();
                        });
                })
        };


        $scope.resetVal = function () {
            $scope.ui.val = {
                content: angular.copy($scope.contentValTemplate),
                addMedia: angular.copy($scope.addMediaValTemplate)
            }
        };

        $scope.resetVal();


        $scope.addMedia = function (e) {
            e.stopPropagation();
            var btnElm = angular.element(e.target);
            var popupElm = btnElm.next('.add-media-popup');
            popupElm.css('left', btnElm.outerWidth() + (15 + 30));
            angular.element('.add-media .val').addClass('ng-hide');
            $scope.ui.addMedia.in = !$scope.ui.addMedia.in;
        };


        $scope.selectMediaLink = function (e, ref) {
            e.preventDefault();
            e.stopPropagation();

            $scope.resetVal();
            var isValid = true;
            if (!$scope.ui.addMedia.link) {
                $scope.ui.val.addMedia.req = true;
                isValid = false;
            }
            else {
                if (ref == 'YouTube') {
                    //<iframe width="640" height="360" src="https://www.youtube.com/embed/aSRC2KLNkd4" frameborder="0" allowfullscreen></iframe>
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test($scope.ui.addMedia.link)) {
                        $scope.ui.val.addMedia.fmt = true;
                        isValid = false;
                    }
                }
                else {
                    $scope.ui.val.addMedia.src = true;
                    isValid = false;
                }
            }

            if (!isValid) return;

            if (ref == 'YouTube') {

                // Get the source url
                r = /src="([_\-a-z0-9:\/\.]+)/gi;
                var m = r.exec($scope.ui.addMedia.link);

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
                    iframe: $scope.ui.addMedia.link,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
                };
                $scope.model.media.push(media);

                $scope.ui.addMedia.in = false;
                $scope.ui.addMedia.link = null;
            }
        };

        $scope.uploadDownloadContent = function (files) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            //if (!helpers.validUploadFile(file.name)) {
            //    $scope.selectedUserTodo.todo.mediaChallenge.val.media.type = true;
            //    return;
            //}

            // Check size
            if (file.size > helperService.maxFileSize) {
                $scope.ui.val.addMedia.size = true;
                return;
            }

            $scope.busy = true;
            $scope.ui.addMedia.isLoading = true;

            $upload.upload({url: authService.apiUrl + '/ur', file: file})
                .success(function (data) {
                    var userMedia = {
                        type: 'resource',
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref
                    };

                    $scope.model.media.push(userMedia);

                    $timeout(function () {
                        $scope.ui.addMedia.isLoading = false;
                        $scope.ui.addMedia.in = false;
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
            if (!helperService.validVideoFile(file.name)) {
                if (!helperService.validAudioFile(file.name)) {
                    if (!helperService.validImageFile(file.name)) {
                        $scope.uploadDownloadContent(files);
                        return;
                    } else {
                        mediaType = 'image';
                        // Check size
                        if (file.size > helperService.maxImageSize) {
                            $scope.ui.val.addMedia.size = true;
                            return;
                        }
                    }
                } else {
                    mediaType = 'audio';
                    // Check size
                    if (file.size > helperService.maxAudioSize) {
                        $scope.ui.val.addMedia.size = true;
                        return;
                    }
                }
            } else {
                mediaType = 'video';
                // Check size
                if (file.size > helperService.maxVideoSize) {
                    $scope.ui.val.addMedia.size = true;
                    return;
                }
            }

            $scope.busy = true;
            $scope.ui.addMedia.isLoading = true;

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
                            encoding: true
                        };
                        $scope.model.media.push(media);

                        $timeout(function () {
                            $scope.ui.addMedia.isLoading = false;
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
                                $scope.model.media.push(media);

                                $timeout(function () {
                                    $scope.ui.addMedia.isLoading = false;
                                    $scope.busy = false;
                                }, 300);
                            });
                        };
                        img.src = data.url;
                    }
                    $scope.ui.addMedia.in = false;
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
                    $scope.model.media = _.without($scope.model.media, media)
                });
        };
    }]);


module.controller('StoryController', ['$scope', '$http', '$timeout', '$q', '$window', 'authService', 'helperService', '$rootScope', '$upload', '$modal',
    function ($scope, $http, $timeout, $q, $window, authService, helperService, $rootScope, $upload, $modal) {
        $scope.addMediaValTemplate = {
            type: false,
            size: false,
            fmt: false,
            req: false
        };
        $scope.contentValTemplate = {
            opening: {
                req: false
            },
            events: {
                req: false
            },
            closing: {
                req: false
            }
        };
        $scope.ui = {
            addMedia: {
                in: false,
                link: null
            }
        };

        $scope.model = {
            title: null,
            content: null,
            category: null,
            networkUsers: [],
            bonusPoints: 0,
            sharing: 'all',
            media: []
        };
        $scope.commentModel = {
            opening: null,
            events: null,
            closing: null
        };
        $scope.inspireClick = function () {
            $scope.ui.addMedia.in = false;
        };
        $scope.selectedNetworkUsers = [];
        $scope.ui.networkUsers = $rootScope.networkUsers;
        $scope.ui.networkUsers = $rootScope.userGroups.concat($scope.ui.networkUsers);
        $scope.categories = $rootScope.forumCategories;
        $scope.helpText = $rootScope.inspirationHelpTexts.storyDescription;
        $scope.model.networkUsers = [];
        $scope.ownNetworkUser = _.find($scope.ui.networkUsers, function (networkUser) {
            return networkUser.user.id == authService.user.id;
        });
        $scope.ui.networkUsers = _.without($scope.ui.networkUsers, $scope.ownNetworkUser);
        $scope.networkUsersOriginal = angular.copy($scope.ui.networkUsers);

        $rootScope.$on('userGroupAdded', function(e, item){
            $rootScope.formatUserGroup(item);
            $scope.ui.networkUsers.unshift(item);
        });

        $rootScope.$on('userGroupRemoved', function (e, item) {
            var groups = _.filter($scope.ui.networkUsers, function(user){
                return user.isGroup == true && user.id == item.id;
            });
            _.each(groups, function(group){
                $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
            });
        });


        $scope.userSelected = function (networkUser, refObj, originalSelectedbj, handleBinding) {
            if ($scope.model.networkUsers.length == 0) {
                $scope.model.networkUsers.push($scope.ownNetworkUser);
            }
            var selectedNetworkUser = _.findWhere($scope.ui.networkUsers, {id: networkUser.id});
            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, selectedNetworkUser);
            $scope.model.networkUsers.push(selectedNetworkUser);

            if(handleBinding){
                $scope.selectedNetworkUsers.push({id: networkUser.id});
            }
        };

        $scope.createUserGroup = function(){
            var usersForGroup = _.filter($scope.model.networkUsers, function(networkUser){
                return networkUser.userId != authService.user.id;
            });
            $rootScope.showCreateUserGroup(usersForGroup);
        };

        $scope.removeGroup = function(group){
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Delete Group?',
                            text: 'Are you sure you want to delete this user group?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.post(authService.apiUrl + '/program-user-group/' + group.id + '/delete')
                        .success(function () {
                            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
                            $rootScope.$emit('userGroupRemoved', group);
                        }).error(function (err) {
                            $scope.submitError = err;
                        })
                })
        };

        $scope.groupSelected = function(group){
            _.each(group.programUsers, function(groupUser){
                if(groupUser.programUser.user.id != authService.user.id) {
                    if(_.findWhere($scope.selectedNetworkUsers, {id: groupUser.programUser.id}) == null) {
                        $scope.userSelected(groupUser.programUser, null, groupUser.programUser, true);
                    }
                }
            })
        };

        $scope.removeNetworkUser = function (networkUser) {
            var selectedNetworkUser = _.findWhere($scope.networkUsersOriginal, {id: networkUser.id});
            $scope.ui.networkUsers.push(selectedNetworkUser);
            $scope.model.networkUsers = _.without($scope.model.networkUsers, _.findWhere($scope.model.networkUsers, {id: networkUser.id}));
            $scope.selectedNetworkUsers = _.without($scope.selectedNetworkUsers, _.findWhere($scope.selectedNetworkUsers, {id: networkUser.id}));

            if ($scope.model.networkUsers.length == 1) {
                $scope.model.networkUsers = _.without($scope.model.networkUsers, $scope.ownNetworkUser);
            }
        };

        $scope.removeAllUsers = function () {
            $scope.ui.networkUsers = angular.copy($scope.networkUsersOriginal);
            $scope.model.networkUsers = [];
            $scope.selectedNetworkUsers = [];
        };

        $scope.submitTopic = function (e) {
            e.preventDefault();
            $scope.resetVal();
            var isValid = true;

            if (!$scope.commentModel.opening || $scope.commentModel.opening.trim().length <= 0) {
                $scope.ui.val.content.opening.req = true;
                isValid = false;
            }
            if (!$scope.commentModel.events || $scope.commentModel.events.trim().length <= 0) {
                $scope.ui.val.content.events.req = true;
                isValid = false;
            }
            if (!$scope.commentModel.closing || $scope.commentModel.closing.trim().length <= 0) {
                $scope.ui.val.content.closing.req = true;
                isValid = false;
            }

            if (!isValid) return;

            $scope.submitError = null;
            $scope.topicSubmitting = true;

            $scope.model.title = 'Story by ' + authService.user.firstName + ' ' + authService.user.lastName;
            $scope.model.category = _.findWhere($scope.categories, {name: 'Inspiration'});
            $scope.model.allowDuplicate = true;
            $scope.model.subType = 'story';

            $rootScope.closeInspireModal();
            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/', $scope.model)
                .success(function (result) {
                    var commentModel = {
                        comment: $scope.commentModel.opening + '\n' + $scope.commentModel.events + '\n' + $scope.commentModel.closing
                    };
                    $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + result.topic.id + '/comments', commentModel)
                        .success(function (topic) {
                            $rootScope.$emit('addDiscussionTopic', {newTopic: topic});
                            $scope.program.score.points.earned += ($scope.program.forum.newStoryPoints + $scope.program.forum.newCommentPoints);
                            $scope.result.discussionScore.newStoryPoints += $scope.program.forum.newStoryPoints;
                            $scope.result.discussionScore.newCommentPoints += $scope.program.forum.newCommentPoints;
                            $rootScope.updatePointAwardValuesToConsiderMax();
                        });
                })
        };

        $scope.resetVal = function () {
            $scope.ui.val = {
                content: angular.copy($scope.contentValTemplate),
                addMedia: angular.copy($scope.addMediaValTemplate)
            }
        };

        $scope.resetVal();


        $scope.addMedia = function (e) {
            e.stopPropagation();
            var btnElm = angular.element(e.target);
            var popupElm = btnElm.next('.add-media-popup');
            popupElm.css('left', btnElm.outerWidth() + (15 + 30));
            angular.element('.add-media .val').addClass('ng-hide');
            $scope.ui.addMedia.in = !$scope.ui.addMedia.in;
        };


        $scope.selectMediaLink = function (e, ref) {
            e.preventDefault();
            e.stopPropagation();

            $scope.resetVal();
            var isValid = true;
            if (!$scope.ui.addMedia.link) {
                $scope.ui.val.addMedia.req = true;
                isValid = false;
            }
            else {
                if (ref == 'YouTube') {
                    //<iframe width="640" height="360" src="https://www.youtube.com/embed/aSRC2KLNkd4" frameborder="0" allowfullscreen></iframe>
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test($scope.ui.addMedia.link)) {
                        $scope.ui.val.addMedia.fmt = true;
                        isValid = false;
                    }
                }
                else {
                    $scope.ui.val.addMedia.src = true;
                    isValid = false;
                }
            }

            if (!isValid) return;

            if (ref == 'YouTube') {

                // Get the source url
                r = /src="([_\-a-z0-9:\/\.]+)"/gi;
                var m = r.exec($scope.ui.addMedia.link);

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
                    iframe: $scope.ui.addMedia.link,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
                };
                $scope.model.media.push(media);

                $scope.ui.addMedia.in = false;
                $scope.ui.addMedia.link = null;
            }
        };

        $scope.uploadDownloadContent = function (files) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            //if (!helpers.validUploadFile(file.name)) {
            //    $scope.selectedUserTodo.todo.mediaChallenge.val.media.type = true;
            //    return;
            //}

            // Check size
            if (file.size > helperService.maxFileSize) {
                $scope.ui.val.addMedia.size = true;
                return;
            }

            $scope.busy = true;
            $scope.ui.addMedia.isLoading = true;

            $upload.upload({url: authService.apiUrl + '/ur', file: file})
                .success(function (data) {
                    var userMedia = {
                        type: 'resource',
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref
                    };

                    $scope.model.media.push(userMedia);

                    $timeout(function () {
                        $scope.ui.addMedia.isLoading = false;
                        $scope.ui.addMedia.in = false;
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
            if (!helperService.validVideoFile(file.name)) {
                if (!helperService.validAudioFile(file.name)) {
                    if (!helperService.validImageFile(file.name)) {
                        $scope.uploadDownloadContent(files);
                        return;
                    } else {
                        mediaType = 'image';
                        // Check size
                        if (file.size > helperService.maxImageSize) {
                            $scope.ui.val.addMedia.size = true;
                            return;
                        }
                    }
                } else {
                    mediaType = 'audio';
                    // Check size
                    if (file.size > helperService.maxAudioSize) {
                        $scope.ui.val.addMedia.size = true;
                        return;
                    }
                }
            } else {
                mediaType = 'video';
                // Check size
                if (file.size > helperService.maxVideoSize) {
                    $scope.ui.val.addMedia.size = true;
                    return;
                }
            }

            $scope.busy = true;
            $scope.ui.addMedia.isLoading = true;

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
                            encoding: true
                        };
                        $scope.model.media.push(media);

                        $timeout(function () {
                            $scope.ui.addMedia.isLoading = false;
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
                                $scope.model.media.push(media);

                                $timeout(function () {
                                    $scope.ui.addMedia.isLoading = false;
                                    $scope.busy = false;
                                }, 300);
                            });
                        };
                        img.src = data.url;
                    }
                    $scope.ui.addMedia.in = false;
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
                    $scope.model.media = _.without($scope.model.media, media)
                });
        };
    }]);


module.controller('AppreciateController', ['$scope', '$http', '$timeout', '$q', '$window', 'authService', 'helperService', '$rootScope', '$upload', '$modal',
    function ($scope, $http, $timeout, $q, $window, authService, helperService, $rootScope, $upload, $modal) {
        $scope.addMediaValTemplate = {
            type: false,
            size: false,
            fmt: false,
            req: false
        };
        $scope.contentValTemplate = {
            req: false
        };
        $scope.ui = {
            addMedia: {
                in: false,
                link: null
            }
        };

        $scope.model = {
            title: null,
            content: null,
            category: null,
            networkUsers: [],
            sharing: 'all',
            media: []
        };
        $scope.commentModel = {
            comment: null
        };
        $scope.inspireClick = function () {
            $scope.ui.addMedia.in = false;
        };
        $scope.selectedNetworkUsers = [];
        $scope.ui.networkUsers = $rootScope.networkUsers;
        $scope.ui.networkUsers = $rootScope.userGroups.concat($scope.ui.networkUsers);
        $scope.categories = $rootScope.forumCategories;
        $scope.helpText = $rootScope.inspirationHelpTexts.appreciateDescription;
        $scope.model.networkUsers = [];
        $scope.ownNetworkUser = _.find($scope.ui.networkUsers, function (networkUser) {
            return networkUser.user.id == authService.user.id;
        });
        $scope.ui.networkUsers = _.without($scope.ui.networkUsers, $scope.ownNetworkUser);
        $scope.networkUsersOriginal = angular.copy($scope.ui.networkUsers);

        $rootScope.$on('userGroupAdded', function(e, item){
            $rootScope.formatUserGroup(item);
            $scope.ui.networkUsers.unshift(item);
        });

        $rootScope.$on('userGroupRemoved', function (e, item) {
            var groups = _.filter($scope.ui.networkUsers, function(user){
                return user.isGroup == true && user.id == item.id;
            });
            _.each(groups, function(group){
                $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
            });
        });

        $scope.userSelected = function (networkUser, refObj, originalSelectedbj, handleBinding) {
            if ($scope.model.networkUsers.length == 0) {
                $scope.model.networkUsers.push($scope.ownNetworkUser);
            }
            var selectedNetworkUser = _.findWhere($scope.ui.networkUsers, {id: networkUser.id});
            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, selectedNetworkUser);
            $scope.model.networkUsers.push(selectedNetworkUser);

            if(handleBinding){
                $scope.selectedNetworkUsers.push({id: networkUser.id});
            }
        };

        $scope.createUserGroup = function(){
            var usersForGroup = _.filter($scope.model.networkUsers, function(networkUser){
                return networkUser.userId != authService.user.id;
            });
            $rootScope.showCreateUserGroup(usersForGroup);
        };

        $scope.removeGroup = function(group){
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Delete Group?',
                            text: 'Are you sure you want to delete this user group?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.post(authService.apiUrl + '/program-user-group/' + group.id + '/delete')
                        .success(function () {
                            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
                            $rootScope.$emit('userGroupRemoved', group);
                        }).error(function (err) {
                            $scope.submitError = err;
                        })
                })
        };

        $scope.groupSelected = function(group){
            _.each(group.programUsers, function(groupUser){
                if(groupUser.programUser.user.id != authService.user.id) {
                    if(_.findWhere($scope.selectedNetworkUsers, {id: groupUser.programUser.id}) == null) {
                        $scope.userSelected(groupUser.programUser, null, groupUser.programUser, true);
                    }
                }
            })
        };

        $scope.removeNetworkUser = function (networkUser) {
            var selectedNetworkUser = _.findWhere($scope.networkUsersOriginal, {id: networkUser.id});
            $scope.ui.networkUsers.push(selectedNetworkUser);
            $scope.model.networkUsers = _.without($scope.model.networkUsers, _.findWhere($scope.model.networkUsers, {id: networkUser.id}));
            $scope.selectedNetworkUsers = _.without($scope.selectedNetworkUsers, _.findWhere($scope.selectedNetworkUsers, {id: networkUser.id}));

            if ($scope.model.networkUsers.length == 1) {
                $scope.model.networkUsers = _.without($scope.model.networkUsers, $scope.ownNetworkUser);
            }
        };

        $scope.removeAllUsers = function () {
            $scope.ui.networkUsers = angular.copy($scope.networkUsersOriginal);
            $scope.model.networkUsers = [];
            $scope.selectedNetworkUsers = [];
        };


        $scope.submitTopic = function (e) {
            e.preventDefault();
            $scope.resetVal();

            var isValid = true;

            if (!$scope.commentModel.comment || $scope.commentModel.comment.trim().length <= 0) {
                $scope.ui.val.content.req = true;
                isValid = false;
            }

            if(Number($scope.model.bonusPoints) > 0 &&  Number($scope.model.bonusPoints)  > $scope.getCurrentBonusPointsAvailable()){
                $scope.ui.val.bonusPoints.max = true;
                isValid = false;
            }

            if (!isValid) return;

            $scope.submitError = null;
            $scope.topicSubmitting = true;

            $scope.model.title = 'Appreciated by ' + authService.user.firstName + ' ' + authService.user.lastName;
            $scope.model.category = _.findWhere($scope.categories, {name: 'Inspiration'});
            $scope.model.allowDuplicate = true;
            $scope.model.subType = 'appreciation';

            $rootScope.closeInspireModal();
            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/', $scope.model)
                .success(function (result) {
                    $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + result.topic.id + '/comments', $scope.commentModel)
                        .success(function (topic) {
                            $rootScope.$emit('addDiscussionTopic', {newTopic: topic});
                            $scope.program.score.points.earned += ($scope.program.forum.newAppreciatePoints + $scope.program.forum.newCommentPoints);
                            $scope.result.discussionScore.newAppreciatePoints += $scope.program.forum.newAppreciatePoints;
                            $scope.result.discussionScore.newCommentPoints += $scope.program.forum.newCommentPoints;
                            $scope.program.score.bonusPointsUsed += Number($scope.model.bonusPoints);
                            $rootScope.updatePointAwardValuesToConsiderMax();
                        });
                });
        };


        $scope.resetVal = function () {
            $scope.ui.val = {
                content: angular.copy($scope.contentValTemplate),
                bonusPoints: {
                    max: false
                },
                addMedia: angular.copy($scope.addMediaValTemplate)
            }
        };

        $scope.resetVal();


        $scope.addMedia = function (e) {
            e.stopPropagation();
            var btnElm = angular.element(e.target);
            var popupElm = btnElm.next('.add-media-popup');
            popupElm.css('left', btnElm.outerWidth() + (15 + 30));
            angular.element('.add-media .val').addClass('ng-hide');
            $scope.ui.addMedia.in = !$scope.ui.addMedia.in;
        };


        $scope.selectMediaLink = function (e, ref) {
            e.preventDefault();
            e.stopPropagation();

            $scope.resetVal();
            var isValid = true;
            if (!$scope.ui.addMedia.link) {
                $scope.ui.val.addMedia.req = true;
                isValid = false;
            }
            else {
                if (ref == 'YouTube') {
                    //<iframe width="640" height="360" src="https://www.youtube.com/embed/aSRC2KLNkd4" frameborder="0" allowfullscreen></iframe>
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test($scope.ui.addMedia.link)) {
                        $scope.ui.val.addMedia.fmt = true;
                        isValid = false;
                    }
                }
                else {
                    $scope.ui.val.addMedia.src = true;
                    isValid = false;
                }
            }

            if (!isValid) return;

            if (ref == 'YouTube') {

                // Get the source url
                r = /src="([_\-a-z0-9:\/\.]+)"/gi;
                var m = r.exec($scope.ui.addMedia.link);

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
                    iframe: $scope.ui.addMedia.link,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
                };
                $scope.model.media.push(media);

                $scope.ui.addMedia.in = false;
                $scope.ui.addMedia.link = null;
            }
        };

        $scope.uploadDownloadContent = function (files) {

            $scope.resetVal();
            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            //if (!helpers.validUploadFile(file.name)) {
            //    $scope.selectedUserTodo.todo.mediaChallenge.val.media.type = true;
            //    return;
            //}

            // Check size
            if (file.size > helperService.maxFileSize) {
                $scope.ui.val.addMedia.size = true;
                return;
            }

            $scope.busy = true;
            $scope.ui.addMedia.isLoading = true;

            $upload.upload({url: authService.apiUrl + '/ur', file: file})
                .success(function (data) {
                    var userMedia = {
                        type: 'resource',
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref
                    };

                    $scope.model.media.push(userMedia);

                    $timeout(function () {
                        $scope.ui.addMedia.isLoading = false;
                        $scope.ui.addMedia.in = false;
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
            if (!helperService.validVideoFile(file.name)) {
                if (!helperService.validAudioFile(file.name)) {
                    if (!helperService.validImageFile(file.name)) {
                        $scope.uploadDownloadContent(files);
                        return;
                    } else {
                        mediaType = 'image';
                        // Check size
                        if (file.size > helperService.maxImageSize) {
                            $scope.ui.val.addMedia.size = true;
                            return;
                        }
                    }
                } else {
                    mediaType = 'audio';
                    // Check size
                    if (file.size > helperService.maxAudioSize) {
                        $scope.ui.val.addMedia.size = true;
                        return;
                    }
                }
            } else {
                mediaType = 'video';
                // Check size
                if (file.size > helperService.maxVideoSize) {
                    $scope.ui.val.addMedia.size = true;
                    return;
                }
            }

            $scope.busy = true;
            $scope.ui.addMedia.isLoading = true;

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
                            encoding: true
                        };
                        $scope.model.media.push(media);

                        $timeout(function () {
                            $scope.ui.addMedia.isLoading = false;
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
                                $scope.model.media.push(media);

                                $timeout(function () {
                                    $scope.ui.addMedia.isLoading = false;
                                    $scope.busy = false;
                                }, 300);
                            });
                        };
                        img.src = data.url;
                    }
                    $scope.ui.addMedia.in = false;
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
                    $scope.model.media = _.without($scope.model.media, media)
                });
        };
    }]);