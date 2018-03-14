'use strict';
var module = angular.module('Jubi.controllers');

module.controller('TopicsController', ['$scope', '$q', '$http', '$window', 'authService', '$modal', '$rootScope', '$timeout', 'helperService', '$upload', 'ngAudio', '$sce', '$filter', 'controllerState', '$cookies',
    function ($scope, $q, $http, $window, authService, $modal, $rootScope, $timeout, helperService, $upload, ngAudio, $sce, $filter, controllerState, $cookies) {
     
        $scope.inState = null;
        controllerState.scope($scope);
        controllerState.otherwise('forum');
        controllerState.onEnter = function (state) {
            $timeout(function () {
                $scope.inState = state;

            });
        };

        var init = function () {
            controllerState.route();
        }


        //$scope.$on('backToForumTriggered', function () {
        //    //alert('Caught');
        //    $scope.inState = 'forum';
        //})

    }

]);

module.controller('ForumController', ['$scope', '$q', '$http', '$window', 'authService', '$modal', '$rootScope', '$timeout', 'helperService', '$upload', 'ngAudio', '$sce', '$filter', 'controllerState', '$cookies',
    function ($scope, $q, $http, $window, authService, $modal, $rootScope, $timeout, helperService, $upload, ngAudio, $sce, $filter, controllerState, $cookies) {
        var localStorageAvailable;
        try {
            $window.localStorage.setItem('testKey', 'test');
            $window.localStorage.removeItem('testKey');
            localStorageAvailable = true;
        } catch (e) {
            localStorageAvailable = false;
        }
        $('body').bind('click', function (e) {
            if ($(e.target).closest('#showDropdown').length == 0) {
                if ($scope.showDropdown) {
                    $scope.showDropdown = false;
                    $scope.$apply();
                }
            }
            if ($(e.target).closest('#cat').length == 0) {
                $scope.catShow = false;
                $scope.$apply();
            }
            if ($(e.target).closest('#showActivityDropdown').length == 0) {
                $scope.showActivityDropdown = false;
                $scope.$apply();
            }
        });
        $scope.topicsClick = function () {
            $scope.ui.addMedia.in = false;
        };
        $scope.topic = null;
        $scope.addMediaValTemplate = {
            type: false,
            size: false,
            fmt: false,
            req: false
        };
        $scope.valTemplate = {
            title: { req: false },
            category: { req: false },
            content: { req: false },
            challenge: { req: false }
        };
        $scope.ui = {
            addMedia: {
                in: false,
                link: null
            },
            inCreate: false,
            selectedCategoryFilter: null
        };
        $scope.resetVal = function () {
            $scope.ui.val = angular.copy($scope.valTemplate);
            $scope.ui.val.addMedia = angular.copy($scope.addMediaValTemplate);
        };

        $scope.viewBy = 10;
        $scope.viewByOptions = [{ value: 10 }, { value: 20 }, { value: 30 }, { value: 50 }, { value: 100 }];
        $scope.itemsPerPage = 10;
        $scope.userId = authService.user.id;
        $scope.isClientAdmin = authService.canAdmin();
        $scope.filteredData = [];
        $scope.programUsers = [];
        $scope.userSelectedLabel = [];
        $scope.topics = [];
        $scope.matchingTopics = [];
        $scope.categories = [];
        $scope.activities = [];
        $scope.selectedNetworkUsers = [];
        /*spinner load checker*/
        $scope.isLoading = false;
        $scope.model = {
            title: null,
            content: null,
            category: null,
            networkUsers: [],
            sharing: 'all',
            media: []
        };
        $scope.selectedCategoryName = {
            name: null
        };
        $scope.selectedCategoryNameinArry = {
            name: null
        };
        $scope.selectedActivityNameinArry = {
            title: null
        };

        $scope.$on('refreshDiscussion', function () {
            load(true);
        });

        $scope.showLoading = function () {
            $scope.isLoading = true;
        };
        $scope.showLoading();
        $scope.hideLoading = function () {
            if (!$scope.inQuestPlayer) {
                $scope.stopLoading();
                $scope.isLoading = false;
            } else {
                $scope.isLoading = false;
            }
        };

        this.init = function (slug) {
            $scope.slug = slug;
        };

        controllerState.state('forum', {
            url: '/',
            onEnter: load
        });

        var load = function (val) {

            $http.get(authService.apiUrl + '/program/' + $scope.program.id + '/forum/' + $scope.program.forum.id + '/user-content').success(function (result) {
                $scope.forum = result.topics;
                $scope.publishedProgramDate = new Date($scope.program.firstPublished);

                //get categories 
                $scope.categories = $rootScope.forumCategories;

                _.each($scope.categories, function (category) {
                    var countObj = _.countBy($scope.forum.items, function (forumItem) {
                        return (forumItem.categoryId == category.id);
                    });
                    if (!countObj.true) {
                        category.topicCount = 0;
                    } else {
                        category.topicCount = countObj.true;
                    }
                });

                //get activities and check if its completed by user. Latest Topic on top.
                $scope.activities = [];
                $scope.selectedActivityArry = [];

                if ($scope.program.levels.length > 0) {
                    _.each($scope.program.levels, function (level) {
                        _.each(level.quests, function (quest) {
                            if (quest.type == 'L') {
                                if (authService.user.roles[0].id > 3) {// check if current user is Client User. If So check if activity is completed.
                                    if (quest.challengesComplete == quest.challengeCount) {
                                        $scope.activities.push(quest.title);
                                    }
                                } else {
                                    $scope.activities.push(quest.title);
                                }
                            }
                            if (quest.type == 'I') {
                                if (authService.user.roles[0].id > 3) {// check if current user is Client User. If So check if activity is completed.
                                    if (quest.complete == true) {
                                        $scope.activities.push(quest.title);
                                    }
                                } else {
                                    $scope.activities.push(quest.title);
                                }
                            }
                        });
                    });
                }
                if ($scope.program.quests.length > 0) {
                    _.each($scope.program.quests, function (quest) {
                        if (quest.type == 'L') {
                            if (authService.user.roles[0].id > 3) {// check if current user is Client User. If So check if activity is completed.
                                if (quest.challengesComplete == quest.challengeCount) {
                                    $scope.activities.push(quest.title);
                                }
                            } else {
                                $scope.activities.push(quest.title);
                            }
                        }
                        if (quest.type == 'I') {
                            if (authService.user.roles[0].id > 3) {// check if current user is Client User. If So check if activity is completed.
                                if (quest.complete == true) {
                                    $scope.activities.push(quest.title);
                                }
                            } else {
                                $scope.activities.push(quest.title);
                            }
                        }
                    });
                }
                $scope.activities.reverse();
                for (var j = 0; j < $scope.activities.length; j++) {
                    $scope.selectedActivityArry.push({
                        'value': $scope.activities[j],
                        selected: false
                    });
                }

                //get network user associated with program.
                $scope.filteredData.push($scope.categories[0].name);
                $scope.ui.networkUsers = $rootScope.networkUsers;

                /*to fetch users for new discussion filters*/
                $scope.ownNetworkUser = _.find($scope.ui.networkUsers, function (networkUser) {
                    return networkUser.user.id == authService.user.id;
                });
                $scope.ui.networkUsers = _.without($scope.ui.networkUsers, $scope.ownNetworkUser);
                $scope.programUsers = $scope.ui.networkUsers;
                $scope.selectedUserArry = $scope.programUsers;

                _.each($scope.programUsers, function (users) {
                    users.selected = false;
                });

                $scope.ui.networkUsers = $rootScope.userGroups.concat($scope.ui.networkUsers);

                $scope.networkUsersOriginal = angular.copy($scope.ui.networkUsers);
                $scope.model.category = $scope.categories[0];
                $scope.topics = $scope.forum.items;
                //console.log("Page Load Topic Length: " + $scope.topics.length);
                _.each($scope.topics, function (topic) {
                    var postingUser = _.find(topic.users, function (networkUser) {
                        return networkUser.user.id == topic.createdBy.id;
                    });
                    topic.users = _.without(topic.users, postingUser);
                });

                if (val) {
                    $scope.resetAllFilters();
                }

                $scope.currentPage = 1;
                $scope.itemsPerPage = $scope.viewBy;
                $scope.totalItems = $scope.topics.length;
                $scope.maxPageSize = 7;

                //Check for saved filter data and trigger it. 
                // for consistency purposes topicPageFilter and commentPageFilter will be used. 
                
                if (localStorageAvailable) {
                    var filterName = 'topicPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(filterName)) {
                        var currentProg = JSON.parse(localStorage.getItem(filterName));
                        if (currentProg.programTitle == $scope.program.title) {
                            filterDataExist(currentProg);
                        }
                    }
                } else {
                    //localStroage not availablke
                    var filterName = 'topicPageFilter'.concat($scope.program.id);
                    var commentCookie = $cookies.get(filterName);
                    if (commentCookie) {
                        filterDataExist(JSON.parse(commentCookie));
                    }
                }
                controllerState.route();
                $scope.hideLoading();
            });

        };

        $scope.setItemsPerPage = function (num) {
            $scope.itemsPerPage = num;
            $scope.currentPage = 1; //reset to first page
        }

        $rootScope.$on('userGroupAdded', function (e, item) {
            $rootScope.formatUserGroup(item);
            $scope.ui.networkUsers.unshift(item);
        });

        $rootScope.$on('userGroupRemoved', function (e, item) {
            var groups = _.filter($scope.ui.networkUsers, function (user) {
                return user.isGroup == true && user.id == item.id;
            });
            _.each(groups, function (group) {
                $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
            });
        });

        $scope.userSelected = function (networkUser, refObj, originalSelectedbj, handleBinding) {
            if ($scope.model.networkUsers.length == 0) {
                $scope.model.networkUsers.push($scope.ownNetworkUser);
            }
            var selectedNetworkUser = _.findWhere($scope.ui.networkUsers, { id: networkUser.id });
            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, selectedNetworkUser);
            $scope.model.networkUsers.push(selectedNetworkUser);

            if (handleBinding) {
                $scope.selectedNetworkUsers.push({ id: networkUser.id });
            }
        };

        $scope.createUserGroup = function () {

            var usersForGroup = _.filter($scope.model.networkUsers, function (networkUser) {
                return networkUser.userId != authService.user.id;
            });
            $rootScope.showCreateUserGroup(usersForGroup);
        };

        /*discussion forum- new functionality*/
        $scope.createUserGroups = function () {
            var usersForGroup = _.filter($scope.shareUserArry, function (networkUser) {
                return networkUser.userId != authService.user.id;
            });
            $rootScope.showCreateUserGroup(usersForGroup);
        };

        $scope.removeGroup = function (group) {
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

        $scope.groupSelected = function (group) {
            _.each(group.programUsers, function (groupUser) {
                if (groupUser.programUser.user.id != authService.user.id) {
                    if (_.findWhere($scope.selectedNetworkUsers, { id: groupUser.programUser.id }) == null
                        && _.findWhere($scope.ui.networkUsers, { id: groupUser.programUser.id }) != null) {
                        $scope.userSelected(groupUser.programUser, null, groupUser.programUser, true);
                    }
                }
            })
        };

        $scope.removeNetworkUser = function (networkUser) {
            var selectedNetworkUser = _.findWhere($scope.networkUsersOriginal, { id: networkUser.id });
            $scope.ui.networkUsers.push(selectedNetworkUser);
            $scope.model.networkUsers = _.without($scope.model.networkUsers, _.findWhere($scope.model.networkUsers, { id: networkUser.id }));
            $scope.selectedNetworkUsers = _.without($scope.selectedNetworkUsers, _.findWhere($scope.selectedNetworkUsers, { id: networkUser.id }));

            if ($scope.model.networkUsers.length == 1) {
                $scope.model.networkUsers = _.without($scope.model.networkUsers, $scope.ownNetworkUser);
            }
        };

        $scope.removeAllUsers = function () {
            $scope.ui.networkUsers = angular.copy($scope.networkUsersOriginal);
            $scope.model.networkUsers = [];
            $scope.selectedNetworkUsers = [];
        };

        $scope.isInSelectedCategory = function (item) {
            if ($scope.ui.selectedCategoryFilter) {
                return (item.categoryId == $scope.ui.selectedCategoryFilter);
            } else {
                return true;
            }
        };

        $scope.$watch(function () {

            return $rootScope.forumCategories;
        }, function () {
            if (!$rootScope.forumCategories) return;
            //JUBI 799 discussion will not load when user enters quest player level. Must click on Discussion Button to trigger the request. 
            // if they access discussions on the QuestBoard page then it triggers. 
            load(false);
            //if (!window.location.hash) {
            //    load();
            //}

        });

        $scope.clickTopic = function (topic) {
            $scope.showLoading();
            $scope.filterData.selectedTopicId = topic.id;
            if (!$scope.inQuestPlayer) {

                $http.get(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + topic.id)
                    .success(function (topicComments) {

                        controllerState.go('forumTopic', {
                            slug: $scope.program.slug,
                            topicId: topic.id,
                            topic: topicComments
                        })
                    });
               $scope.hideLoading();
            }
            else {
                $scope.discussion.topic = topic;
                $scope.discussion.slug = $scope.program.slug;
                //when in aside disucssion, $scope.$watch is not being triggered. so apply the local storage create directly.

                $scope.filterData.programTitle = $scope.program.title;
                if (localStorageAvailable) {
                    //local storage available
                    var filterName = 'topicPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(filterName)) {
                        localStorage.removeItem(filterName);
                    }
                    localStorage.setItem(filterName, JSON.stringify($scope.filterData));
                } else {
                    //local storage not available. use Cookies
                    var filterName = 'topicPageFilter'.concat($scope.program.id);
                    if ($cookies.get(filterName)) {
                        $cookies.remove(filterName);
                    }
                    $cookies.put(filterName, JSON.stringify($scope.filterData));
                }

                $http.get(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + topic.id)
                    .success(function (topicComments) {
                        //get the current url and save it. 
                        var curUrl = window.location.href;

                        controllerState.go('forumTopic', {
                            slug: $scope.program.slug,
                            topicId: topic.id,
                            topic: topicComments
                        });
                        window.location.href = curUrl;
                    });
                $scope.$parent.stopLoading();
                $scope.hideLoading();
            }
        };

        $scope.newTopic = function () {
            $scope.ui.inCreate = true;

        };

        $scope.cancelTopicCreate = function () {
            $scope.ui.inCreate = false;
            $scope.topicSubmitting = false;
            $scope.matchingTopics = [];
            if ($scope.clearCommentDraft) $scope.clearCommentDraft();
            $scope.model = {
                title: null,
                content: null,
                category: null,
                networkUsers: [],
                sharing: 'all',
                media: []
            };
            $scope.resetVal();
        };

        $scope.submitTopic = function (e) {
            e.preventDefault();
            $scope.resetVal();
            var isValid = true;

            if (!$scope.model.title || $scope.model.title.trim().length <= 0) {
                $scope.ui.val.title.req = true;
                isValid = false;
            }
            if (!$scope.model.content || $scope.model.content.trim().length <= 0) {
                $scope.ui.val.content.req = true;
                isValid = false;
            }
            if (!$scope.model.category) {
                $scope.ui.val.category.req = true;
                isValid = false;
            }
            if (!$scope.model.challenge && $scope.model.quest && $scope.model.quest.challengesComplete < $scope.model.quest.challengeCount) {
                $scope.ui.val.challenge.req = true;
                isValid = false;
            }

            if (!isValid) return;

            $scope.submitError = null;

            $scope.topicSubmitting = true;

            if ($scope.matchingTopics.length > 0) {
                $scope.model.allowDuplicate = true;
            } else {
                $scope.model.allowDuplicate = false;
            }


            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/', $scope.model)
                .success(function (result) {
                    if (result.matchingItems.length > 0) {
                        if ($scope.saveCommentDraft) {
                            $scope.saveCommentDraft($scope.model.content);
                        }
                        $scope.matchingTopics = result.matchingItems;
                        $scope.matchingItemWithSameTitle = false;
                        _.filter($scope.matchingTopics, function (topic) {
                            if (topic.title == $scope.model.title) {
                                $scope.matchingItemWithSameTitle = true;
                            }
                        });

                        $scope.topicSubmitting = false;
                    } else {
                        $scope.matchingItemWithSameTitle = false;
                        load(true);
                        $scope.cancelTopicCreate();
                        if ($scope.result) {
                            if (!$scope.program.forum.newTopicPointsMax || ($scope.result.discussionScore.newTopicPoints + $scope.program.forum.newTopicPoints) <= $scope.program.forum.newTopicPointsMax) {
                                $scope.program.score.points.earned += $scope.program.forum.newTopicPoints;
                                $scope.result.discussionScore.newTopicPoints += $scope.program.forum.newTopicPoints;
                            }
                        }
                    }
                }).error(function (err) {
                    $scope.topicSubmitting = false;
                    $scope.submitError = err;
                });
        };

        $scope.deleteForumItem = function (e, item, isTopic) {
            e.stopPropagation();
            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Delete Topic?',
                            text: 'Are you sure you want to delete this ' + (isTopic ? 'topic' : 'comment') + '?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.delete(authService.apiUrl + '/forum/' + $scope.program.forum.id + (isTopic ? '/topics/' : '/comments/') + item.id)
                        .success(function () {
                            $scope.topics = _.without($scope.topics, item);
                        }).error(function (err) {
                            $scope.submitError = err;
                        })
                })
        };

        $scope.getCompletedChallenges = function (quest) {
            return _.filter(quest.challenges, function (challenge) {
                return challenge.complete;
            })
        };

        $rootScope.$on('addDiscussionTopic', function (e, args) {
            $scope.topics.unshift(args.newTopic);
        });

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

            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
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
                    $scope.model.media = _.without($scope.model.media, media)
                });
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

        /*new discussion functionality*/
        $scope.ownNetworkUser = authService.user.id; //users in network
        $scope.selectedCategoryNameinArry.name = null; // need to set category before filter 
        $scope.selectedActivityNameinArry.title = null;
        $scope.actShow = false;
        $scope.topicSearch = null;
        $scope.catShow = false;
        $scope.searchTopic = null;
        var hasData = false;
        var hasDates = false;
        $scope.programGroups = null;
        $scope.userfilterView = [];
        $scope.applyButton = false;
        $scope.resetButton = false;
       
        $scope.filterData = {
            programTitle: null,
            selectedTopicId: null,
            topic: null,
            date: {
                startDate: null,
                endDate: null
            },
            individuals: [],
            category: null,
            activity: []
        }

        $scope.$watch('filterData', function () {
            if ($scope.forum) {
                $scope.topics = $scope.finalFilter($scope.forum.items);
                $scope.currentPage = 1;
                $scope.totalItems = $scope.topics.length;
                $scope.filterData.programTitle = $scope.program.title;

                if (localStorageAvailable) {
                    //local storage available
                    var filterName = 'topicPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(filterName)) {
                        localStorage.removeItem(filterName);
                    }
                    localStorage.setItem(filterName, JSON.stringify($scope.filterData));
                } else {
                    //local storage not available. use Cookies
                    var filterName = 'topicPageFilter'.concat($scope.program.id);
                    if ($cookies.get(filterName)) {
                        $cookies.remove(filterName);
                    }
                    $cookies.put(filterName, JSON.stringify($scope.filterData));
                }
                
            }
        }, true);

        $scope.$watch('inState', function () {
            if ($scope.$parent.inState == 'forum') {
                $scope.filterData.selectedTopicId = null;
            }
        },true);

        /*On clicking filter button Show Filter UI and run category script*/
        $scope.toggle.filtersShow = false;

        $scope.filterButtonClick = function () {
            $scope.toggle.filtersShow = !$scope.toggle.filtersShow;
            angular.element('.forum-topic-list button.filterButton').toggleClass('active');
            $scope.dateFilter();
        };

        /*UI Filter Change Function*/
        $scope.dateFilter = function () {
            $scope.activityShow = false;
            $scope.dateShow = true;
            $scope.categoryShow = false;
            $scope.authorShow = false;
            $scope.topicShow = false;
            $scope.catShow = false;
        };
        $scope.categoryFilter = function () {

            $scope.dateShow = false;
            $scope.categoryShow = true;
            $scope.activityShow = false;
            $scope.authorShow = false;
            $scope.topicShow = false;
            $scope.catShow = false;
        };
        $scope.authorFilter = function () {

            $scope.dateShow = false;
            $scope.categoryShow = false;
            $scope.authorShow = true;
            $scope.activityShow = false;
            $scope.topicShow = false;
            $scope.catShow = false;
        };
        $scope.activityFilter = function () {

            $scope.dateShow = false;
            $scope.categoryShow = false;
            $scope.authorShow = false;
            $scope.activityShow = true;
            $scope.topicShow = false;
            $scope.catShow = false;
        };
        $scope.topicFilter = function () {
            $scope.activityShow = false;
            $scope.dateShow = false;
            $scope.categoryShow = false;
            $scope.authorShow = false;
            $scope.topicShow = true;
            $scope.catShow = false;

        };
        $scope.showActivityDropdown = false;
        $scope.selectedActivityArry = [];
        $scope.searchActivityArry = [];
        $scope.showActDropdown = function (event) {

            //$scope.selectedActivityArry = [];
            ////console.log($scope.activities);
            //for (var j = 0; j < $scope.activities.length; j++) {
            //    $scope.selectedActivityArry.push({
            //        'value': $scope.activities[j],
            //        selected: false
            //    });

            //}
            angular.element('input#searchactivity').val('');
            $scope.searchActivityArry = $scope.selectedActivityArry;
            $scope.showActivityDropdown = !$scope.showActivityDropdown;
        };
        /* Category Filter */
        $scope.showCatDropdown = function () {
            $scope.catShow = !$scope.catShow;
        };

        /*Category change updates in filtering field*/
        $scope.changeCategory = function (category) {
            $scope.selectedCategoryNameinArry.name = category.name;

            if ($scope.filterData.category == null) {
                $scope.filterData.category = $scope.selectedCategoryNameinArry.name;

                $scope.userfilterView.push($scope.selectedCategoryNameinArry.name);
            }
            else {
                var index = $scope.userfilterView.indexOf($scope.filterData.category);
                $scope.userfilterView.splice(index, 1);
                $scope.filterData.category = $scope.selectedCategoryNameinArry.name;
                $scope.userfilterView.push($scope.selectedCategoryNameinArry.name);
            }
        };

        $scope.categoryReset = function () {
            var index = $scope.userfilterView.indexOf($scope.filterData.category);
            $scope.userfilterView.splice(index, 1);
            $scope.filterData.category = null;
            $scope.selectedCategoryNameinArry.name = null;
        };

        /*Dates*/
        $scope.startDate = null;// we need to apply the programs published date to startDate so that it comes pre filled. 
        $scope.$watch('publishedProgramDate', function () {
            $scope.startDate = $scope.publishedProgramDate;
        }, true);

        $scope.endDate = new Date();
        $scope.dates = null;
        $scope.todayDate = new Date();
        $scope.isOpen = false;

        $scope.datesChanged = function (date, type) {
            if (type == 'start') {
                //var m = moment(date);
                if (date) {
                    $scope.startDate = date;
                    // $scope.minDate = $scope.getMinDate();
                }
            } else {
                if (date) {
                    $scope.endDate = date;
                }
            }
        };

        $scope.dateApply = function () {

            $scope.filterData.date.startDate = $scope.startDate;
            $scope.filterData.date.endDate = $scope.endDate;

            var currentDate = $filter('date')($scope.filterData.date.startDate, 'MM/d/yy');
            var dueDate = $filter('date')($scope.filterData.date.endDate, 'MM/d/yy');
            if ($scope.dates == null) {
                $scope.dates = currentDate + ' - ' + dueDate;
                $scope.userfilterView.push($scope.dates);
                //console.log($scope.userfilterView);
                hasDates = true;
            }
            else {
                var index = $scope.userfilterView.indexOf($scope.dates);
                $scope.userfilterView.splice(index, 1);
                $scope.dates = currentDate + ' - ' + dueDate;
                $scope.userfilterView.push($scope.dates);
                //console.log($scope.userfilterView);
            }

        };

        /*Reset dates*/
        $scope.resetDate = function () {
            if (hasDates == true) {
                var index = $scope.userfilterView.indexOf($scope.dates);
                $scope.userfilterView.splice(index, 1);
                $scope.dates = null;

                $scope.filterData.date.startDate = null;
                $scope.filterData.date.endDate = null;

                //$scope.filterData.date.startDate = $scope.publishedProgramDate;
                //$scope.filterData.date.endDate = new Date();

                //Md-datepicker uses the bound value by reference (for performance reasons). so when we change the date it still sees it as same object and doesnt update. 
                //so need to create a clone, set the new value to that and then point startDate and endDate to the clone. 
                //now this might be a issue with the angular version thats currently being used but the viewValue (input) is not being updated but the model is. 
                //to fix this issue, we will directly apply the value to the input. we need to get the specific month, date, year since its an dateTime Object

                var startm = new Date(+$scope.publishedProgramDate);
                startm.setDate(startm.getDate());
                $scope.startDate = startm;

                var endm = new Date(+$scope.todayDate);
                endm.setDate(endm.getDate());
                $scope.endDate = endm;

                angular.element('#date1 input.md-datepicker-input').val($scope.startDate.getMonth() + 1 + '/' + $scope.startDate.getDate() + '/' + $scope.startDate.getFullYear());
                angular.element('#date2 input.md-datepicker-input').val($scope.endDate.getMonth() + 1 + '/' + $scope.endDate.getDate() + '/' + $scope.endDate.getFullYear());
            }
            hasDates = false;
        };

        /*topics apply and topic reset*/
        $scope.topicApply = function (searchTopic) {
            //no need to check if topic search is null, because it is initiated as null. Also you have reset button to erase from filtered data array. 
            //need to check is already exists in array
            $scope.topicSearch = searchTopic;

            if ($scope.filterData.topic != null) {
                var index = $scope.userfilterView.indexOf($scope.filterData.topic);
                $scope.userfilterView.splice(index, 1);
            }
            hasData = true;
            $scope.userfilterView.push($scope.topicSearch);
            $scope.filterData.topic = searchTopic;

        };

        $scope.resetTopic = function (searchTopic) {
            if ($scope.topicSearch != null) {
                if (hasData == true) {
                    $scope.topicSearch = null;
                    searchTopic = $scope.topicSearch; // This is used in frontend where returned null value will be assigned to searchTopic to make input null
                    hasData = false;
                    var index = $scope.userfilterView.indexOf($scope.topicSearch);
                    $scope.userfilterView.splice(index, 1);
                    $scope.filterData.topic = null;
                }
            }
            $scope.topicSearch = null;
            searchTopic = $scope.topicSearch;// why this line? not needed 
            $scope.applyButton = false;
            $scope.resetButton = false;

            return searchTopic;
        };

        /* Individual Filter */
        $scope.showDropdown = false;
        var hasIndividual = false;
        $scope.showDropdownmenu = function (event) {
            $scope.selectedUserArry = $scope.programUsers;
            angular.element('input#searchuser').val('');
            $scope.showDropdown = !$scope.showDropdown;

        };

        /*Individuals/ Groups*/
        $scope.selectedUserArry = [];
        $scope.shareUserArry = [];
        $scope.individualLength = null;

        // i checked with jubi platform v1 and in there when group is selected, the users are selected in the dropdown but the group itself is not selected. 
        //perhaps we need to do the same thing. that way we can simplify the code. 
        //If however larry wants the group to be selected and be unselected if users are removed then we need to create a new funtion,
        //then attach that to a $scope.$watch so that anytime a user is removed and group is selected we trigger the check and remove seleted group is needed. 
        $scope.toggleGroup = function (group) {
            //console.log(group);

            if (group.selected == true) {

                _.each(group.programUsers, function (val) {
                    _.each($scope.selectedUserArry, function (user) {
                        if (val.programUser.id == user.id) {
                            user.selected = true;
                            $scope.toggleUser(user);
                        }
                    });
                });

            }
            else {
                // first clear the arry of all users.
                //  then find grous that are selected and then pass them to individual function again.
                $scope.shareUserArry = [];
                $scope.filterData.individuals = [];

                if ($scope.shareUserArry.length == 0) {
                    var index = $scope.userfilterView.indexOf($scope.shareUserArry.length);
                    $scope.userfilterView.splice(index, 1);
                    hasIndividual = false;
                    $scope.individualLength = null;
                }
                _.each($scope.selectedUserArry, function (user) {
                    user.selected = false;

                });

                _.each($rootScope.userGroups, function (group) {
                    if (group.selected == true) {
                        _.each(group.programUsers, function (val) {
                            _.each($scope.selectedUserArry, function (user) {
                                if (val.programUser.id == user.id) {
                                    user.selected = true;
                                    $scope.toggleUser(user);
                                }
                            });
                        });

                    }

                });
            }

        };
        $scope.toggleUser = function (val) {
            if (val.selected == true) {
                if ($scope.shareUserArry.indexOf(val) == -1) {
                    $scope.shareUserArry.push(val);
                }
                //if ($scope.shareUserArry.length == 1) {
                //    $scope.userfilterView.push($scope.shareUserArry.length);
                //}
                //if ($scope.shareUserArry.length > 1) return;
            }
            else {
                
                var index = $scope.shareUserArry.indexOf(val);
                if (index != -1) {
                    $scope.shareUserArry.splice(index, 1);
                    $scope.filterData.individuals.splice(index, 1);
                    //update userFilterView
                    $scope.userfilterView.splice($scope.userfilterView.indexOf($scope.individualLength), 1);

                }

            }
        };

        /*Remove user from shareuserarry label*/
        //when users removed, we first check if its the last user, if yes then update the filterData so apply need not be clicked. 
        //else we only remove the user from shareuserArray and wait for the user to click on apply. 
        $scope.removeShareUser = function (label) {
            var index = $scope.shareUserArry.indexOf(label);

            if ($scope.shareUserArry.length > 1) {
                $scope.shareUserArry.splice(index, 1);
                label.selected = false;
                //await for user to press apply btn
            } else {
                //this is last user so no need for apply btn click.
                $scope.shareUserArry.splice(index, 1);
                label.selected = false;

                //update userFilterView
                $scope.userfilterView.splice($scope.userfilterView.indexOf($scope.individualLength), 1);

                $scope.individualLength = $scope.shareUserArry.length;

                //reset all selected groups to false
                _.each($rootScope.userGroups, function (group) {
                    group.selected = false;
                });

                //update filterData
                $scope.filterData.individuals = [];
                _.each($scope.shareUserArry, function (user) {
                    $scope.filterData.individuals.push(user);
                });
            }

        };

        $scope.individualApply = function () {
            //apply button will need to be clicked if shareUser lengh > 1. so that we apply it to userView Array and also trigger filter.

            //remove individual Length from userFilterView
            if ($scope.individualLength && $scope.individualLength != 0) {
                $scope.userfilterView.splice($scope.userfilterView.indexOf($scope.individualLength), 1);
            }

            if ($scope.shareUserArry.length > 0) {
                $scope.individualLength = $scope.shareUserArry.length;

                //add to userFilterView
                $scope.userfilterView.push($scope.individualLength);
                //console.log('/*$scope.userfilterView*/');
                //console.log($scope.userfilterView);

                $scope.filterData.individuals = [];
                _.each($scope.shareUserArry, function (user) {
                    $scope.filterData.individuals.push(user);
                });


                //not sure i understand what this does. Manisha if this is not needed, then pls clear it
                //if (hasIndividual == false) {
                //    $scope.userfilterView.push($scope.shareUserArry.length);

                //    hasIndividual = true;
                //}
                //else {
                //    return false;
                //}
            }
        };

        $scope.searchUser = function (val) {
            $scope.selectedUserArry = [];
            if ($scope.programUsers) {
                _.each($scope.programUsers, function (item) {
                    if (item.label.toLowerCase().includes(val.toLowerCase())) {
                        $scope.selectedUserArry.push(item);
                    }
                });
            }
        };

        $scope.showUsersName = function () {
            $scope.filterDropdown = true;
        };

        $scope.showApply = function () {
            $scope.applyButton = true;
            $scope.resetButton = true;
        };
        /*Activity change*/
        $scope.shareActivityArry = [];
        $scope.activityLength = null;
        $scope.toggleActivity = function (val) {
            if (val.selected == true) {
                if ($scope.shareActivityArry.indexOf(val) == -1) {
                    $scope.shareActivityArry.push(val);
                }
            }
            else {
                var index = _.findIndex($scope.shareActivityArry, function (activity) {
                    return activity.value == val.value;
                });
                   // $scope.shareActivityArry.indexOf(val);
                if (index != -1) {
                    $scope.shareActivityArry.splice(index, 1);
                }
            }
            if ($scope.shareActivityArry.length == 0) {
                $scope.shareActivityArry.splice(index, 1);
                //update userFilterView
                $scope.userfilterView.splice($scope.userfilterView.indexOf($scope.activityLength), 1);
                $scope.activityLength = $scope.shareActivityArry.length;

                //update filterData
                $scope.filterData.activity = [];
                _.each($scope.shareActivityArry, function (user) {
                    $scope.filterData.activity.push(user);
                });
            }
        };

        /*remove activity*/
        $scope.removeShareActivity = function (label) {
            var index = $scope.shareActivityArry.indexOf(label);

            if ($scope.shareActivityArry.length > 1) {
                $scope.shareActivityArry.splice(index, 1);
                label.selected = false;

            } else {

                $scope.shareActivityArry.splice(index, 1);
                label.selected = false;

                //update userFilterView
                $scope.userfilterView.splice($scope.userfilterView.indexOf($scope.activityLength), 1);

                $scope.activityLength = $scope.shareActivityArry.length;


                //update filterData
                $scope.filterData.activity = [];
                _.each($scope.shareActivityArry, function (user) {
                    $scope.filterData.activity.push(user);
                });
            }

        };
        /*search activity*/
        $scope.searchActivity = function (val) {
            $scope.selectedActivityArry = [];
            if ($scope.searchActivityArry) {
                _.each($scope.searchActivityArry, function (item) {
                    if (item.value.toLowerCase().includes(val)) {
                        $scope.selectedActivityArry.push(item);
                    }
                });
            }
        };
        /*Activity apply*/

        $scope.activityApply = function () {

            if ($scope.activityLength && $scope.activityLength != 0) {
                var index = $scope.userfilterView.indexOf($scope.activityLength);
                $scope.userfilterView.splice(index, 1);
            }

            if ($scope.shareActivityArry.length > 0) {
                $scope.activityLength = $scope.shareActivityArry.length;
                $scope.userfilterView.push($scope.activityLength);
                $scope.filterData.activity = [];
                _.each($scope.shareActivityArry, function (activity) {
                    $scope.filterData.activity.push(activity);
                });
            }

        };

        // function which is called by the filter when ng-repeat is running. Filter will pass the records one at a time into function and display

        $scope.finalFilter = function (topics) {

            var filteredResult = topics;

            //dates
            /**
                moment(date, 'format'). L is a pre-configured format of MM-DD-YYYY.
                moment().isBetween(moment-like, moment-like, String, String); is used to test if date is between the start and end.
                1st parameter is the from Date
                2nd parameter is the to Date
                3rd parameter string is used to limit the granularity to a unit, in this case day. CAN BE NULL
                4th parameter is to indicate the inclusivity. [ or ] is used to indicate inclusion, ( or ) is used to indicate exclusion.
                since we want to check if the date created is >= from date and <= to date, we use [].
                http://momentjs.com/docs/#/query/is-between/   for more information.
            **/
            if ($scope.filterData.date.startDate != null) {
                $scope.isSelectedDate = function (item) {
                    var date = new Date(item.createdAt); //convert dateTime string to Date object.
                    var datecreated = moment(date, 'L'); // convert date to moment. 
                    var filterStart = moment($scope.filterData.date.startDate, 'L');
                    var filterEnd = moment($scope.filterData.date.endDate, 'L');

                    if (datecreated.isBetween(filterStart, filterEnd, "day", "[]")) {
                        //console.log('datecreated' + datecreated + 'filterStart' + filterStart + 'filterEnd' + filterEnd);
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                var dateFiltered = [];
                _.each(filteredResult, function (forumItem) {
                    if ($scope.isSelectedDate(forumItem)) {
                        dateFiltered.push(forumItem);
                    }
                });

                filteredResult = dateFiltered;
            }

            // individuals
            var indFiltered = [];
            if ($scope.filterData.individuals.length > 0) {
                _.each($scope.filterData.individuals, function (user) {
                    //for every topic see if user.id matched the created.by
                    _.each(filteredResult, function (topic) {
                        if (topic.createdBy.id == user.user.id) {
                            indFiltered.push(topic);
                        }
                    });
                });
                filteredResult = indFiltered;
            }

            //topics
            var topicFiltered = [];
            if ($scope.filterData.topic != null) {
                $scope.isSelectedTopic = function (item) {
                    var selectedTitle = item.title;
                    if (selectedTitle.toLowerCase().indexOf($scope.filterData.topic.toLowerCase()) != -1) {
                        return item;
                    }
                    else {
                        return false;
                    }

                };
                _.each(filteredResult, function (forumItem) {
                    if ($scope.isSelectedTopic(forumItem)) {
                        topicFiltered.push(forumItem);
                    }

                });
                filteredResult = topicFiltered;
            }

            //categories
            var catFiltered = [];
            if ($scope.filterData.category != null) {
                $scope.isSelectedCategory = function (item) {
                    if ($scope.selectedCategoryNameinArry.name) {
                        return (item.category.name == $scope.selectedCategoryNameinArry.name);
                    }
                    else {
                        return false;
                    }
                };
                _.each(filteredResult, function (forumItem) {
                    if ($scope.isSelectedCategory(forumItem)) {
                        catFiltered.push(forumItem)
                    }
                });

                filteredResult = catFiltered;
            }
            //activities
            var actFiltered = [];

            if ($scope.filterData.activity.length > 0) {
                _.each($scope.filterData.activity, function (user) {
                    _.each(filteredResult, function (forumItem) {
                        if (forumItem.quest != null) {
                            if (forumItem.quest.title == user.value) {
                                actFiltered.push(forumItem)
                            }
                        }
                    });
                });

                filteredResult = actFiltered;
            }
            //console.log("Topic lenght: " + filteredResult.length);
            return filteredResult;
        };

        $scope.resetAllFilters = function () {
            $scope.filterData = {

                topic: null,
                date: {
                    startDate: null,
                    endDate: null
                },
                individuals: [],
                category: null,
                activity: []
            };


            $scope.categoryReset();
            $scope.resetDate();
            var searchTopic = $scope.topicSearch;

            searchTopic = $scope.resetTopic(searchTopic);
            angular.element('input.searchTopic').val("");
            $scope.userfilterView = [];

            //clear Selectuser to filter
            $scope.shareUserArry = [];
            $scope.individualLength = null;
            hasIndividual = false;
            //clear all selected individual and Group
            _.each($scope.selectedUserArry, function (user) {
                user.selected = false;
            });
            //group
            _.each($rootScope.userGroups, function (group) {
                group.selected = false;
            });
            /*clear activities*/
            $scope.shareActivityArry = [];
            $scope.activityLength = null;
            _.each($scope.selectedActivityArry, function (user) {
                user.selected = false;
            });
            //close filter sub menu
            $scope.toggle.filtersShow = false;
            //clear local storage
            localStorage.removeItem('topicPageFilter');
            angular.element('.forum-topic-list button.filterButton').removeClass('active');
        };

        //this funtion will recieve saved filterData and then proceed to set the filter and view.
        var filterDataExist = function (data) {

            if (data.topic != null) {
                $scope.filterData.topic = data.topic;
                $scope.searchTopic = data.topic;
                $scope.topicApply(data.topic);
            }
            if (data.date.startDate != null) {
                $scope.startDate = new Date(data.date.startDate);
                $scope.endDate = new Date(data.date.endDate);
                $scope.filterData.date.startDate = data.date.startDate;
                $scope.filterData.date.endDate = data.date.endDate;
                $scope.dateApply();
            }
            if (data.individuals.length > 0) {
                $scope.filterData.individuals = data.individuals;
                $scope.shareUserArry = data.individuals;
              //  $scope.selectedUserArry
                _.each(data.individuals, function (ind) {
                    _.each($scope.selectedUserArry, function (user) {
                        if (ind.userId == user.userId) {
                            user.selected = true;
                        }
                    });
                });
                $scope.individualApply();
            }
            if (data.activity.length > 0) {
                $scope.filterData.activity = data.activity;
                $scope.shareActivityArry = data.activity;
                $scope.activityLength = data.activity.length;
                $scope.userfilterView.push($scope.activityLength);
                //_.each($scope.selectedActivityArry, function (selAct) {
                //    selAct.selected = true;
                //});
                _.each(data.activity, function (act) {
                    _.each($scope.selectedActivityArry, function (selAct) {
                        if (act.value === selAct.value) {
                            selAct.selected = true;
                        }
                    });
                }); 
            }
            if (data.category != null) {
                $scope.selectedCategoryNameinArry.name = data.category;
                $scope.filterData.category = data.category;
                $scope.userfilterView.push(data.category);
            }
            
            if (data.topic != null || data.date.startDate != null || data.individuals.length > 0 || data.activity.length > 0 || data.category != null) {
                $scope.toggle.filtersShow = true;
                angular.element('.forum-topic-list button.filterButton').addClass('active');
                $scope.dateFilter();
            }

            /**************************if Comment filter exists then trigger the next part*************************************************/

            if (data.selectedTopicId != null) {

                var userSelectedTopic = _.find($scope.topics, function (topic) {
                    return topic.id == data.selectedTopicId;
                });

                $scope.clickTopic(userSelectedTopic);
            }

        };
    }
]);

module.controller('ForumTopicController', ['$scope', '$q', '$http', '$window', '$timeout', 'authService', '$modal', 'helperService', '$upload', '$rootScope', 'ngAudio', '$sce', '$filter', 'controllerState', '$cookies',
    function ($scope, $q, $http, $window, $timeout, authService, $modal, helperService, $upload, $rootScope, ngAudio, $sce, $filter, controllerState, $cookies) {
        var topicId = 0;
        var localStorageAvailable;
        try {
            $window.localStorage.setItem('testKey', 'test');
            $window.localStorage.removeItem('testKey');
            localStorageAvailable = true;
        } catch (e) {
            localStorageAvailable = false;
        }
        $scope.topicClick = function () {
            $scope.ui.addMedia.in = false;
        };

        $scope.user = authService.user;
        $scope.topic = null;
        $scope.model = {
            comment: null,
            media: []
        };
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
        $scope.userId = authService.user.id;
        $scope.isClientAdmin = authService.canAdmin();

        $scope.resetVal = function () {
            $scope.ui.val = {
                content: angular.copy($scope.contentValTemplate),
                addMedia: angular.copy($scope.addMediaValTemplate)
            };
        };
        $scope.resetVal();
        $scope.showLoading = function () {
            $scope.isLoading = true;
        };
        $scope.showLoading();
        $scope.hideLoading = function () {
            if (!$scope.inQuestPlayer) {
                $scope.stopLoading();
                $scope.isLoading = false;
            } else {
                $scope.isLoading = false;
            }
        };

        $scope.backToForum = function (e) {
            if ($scope.inQuestPlayer) {
                $scope.resetAllFilters();
                //$scope.$emit('backToForumTriggered');
                
                //if user switchs back to topic view then comment filter data will be deleted.
                if (localStorageAvailable) {
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(filterName)) {
                        localStorage.removeItem(filterName);
                    }

                    // next remove the SelectedTopicID from topicFilter data
                    var tfilterName = 'topicPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(tfilterName)) {
                        var filterD = JSON.parse(localStorage.getItem(tfilterName));
                        localStorage.removeItem(tfilterName);
                        filterD.selectedTopicId = null; //set the filterData selectedTopicId to null
                        localStorage.setItem(tfilterName, JSON.stringify(filterD));
                    }
                } else {
                    //local Storage not supported. Use Cookie. 
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    if ($cookies.get(filterName)) {
                        $cookies.remove(filterName);
                    }
                    // next remove the SelectedTopicID from topicFilter data
                    var tfilterName = 'topicPageFilter'.concat($scope.program.id);
                    if ($cookies.get(tfilterName)) {
                        var filterD = JSON.parse($cookies.get(tfilterName));
                        $cookies.remove(tfilterName);
                        filterD.selectedTopicId = null; //set the filterData selectedTopicId to null
                        $cookies.put(tfilterName, JSON.stringify(filterD));
                    }
                }

                $scope.discussion.topic = null;
            } else {
                //e.preventDefault();
                //e.stopPropagation();
                $scope.resetAllFilters();
                if (localStorageAvailable) {
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(filterName)) {
                        localStorage.removeItem(filterName);
                    }
                } else {
                    //local Storage not supported. Use Cookie. 
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    if ($cookies.get(filterName)) {
                        $cookies.remove(filterName);
                    }
                }
                //console.log(localStorage.getItem('topicPageFilter'));          
                controllerState.go('forum');
                controllerState.route();
                //$window.location = '/user/program/' + $scope.program.slug + '/discussion';
            }
            $scope.hideLoading();
        };

        
        var finishLoad = function (topic) {
            if ($scope.savedCommentDraft) {
                $scope.model.comment = $scope.savedCommentDraft;
            }
            if (topic.content) topic.content = topic.content.replace(/\n/g, '<br>');

            _.each(topic.media, function (media) {
                if (media.type == 'video') $scope.checkEncoding(media);

                if (media.type == 'audio') {
                    media.api = null;
                    media.sources = [{ src: $sce.trustAsResourceUrl(media.url), type: 'audio/mp3' }];
                }
            });

            _.each(topic.children, function (child) {
                //process the child.content
                if (child.content) {
                    //child.content = child.content.replace(/\<p><\/p>/g, '');
                    child.content = child.content.replace(/\\/g, '<br><br>');

                }
                _.each(child.media, function (media) {
                    if (media.type == 'video') $scope.checkEncoding(media);
                });
            });

            topic.iLike = false;
            topic.iDislike = false;
            for (var i = 0; i < topic.likes.length; i++) {
                if (topic.likes[i].createdBy.id == authService.user.id) {
                    topic.iLike = true;
                    break;
                }
            }
            for (i = 0; i < topic.dislikes.length; i++) {
                if (topic.dislikes[i].createdBy.id == authService.user.id) {
                    topic.iDislike = true;
                    break;
                }
            }
            _.each(topic.children, function (comment) {

                if (comment.content) comment.content = comment.content.replace(/\n/g, "<p></p>");

                comment.iLike = false;
                comment.iDislike = false;
                for (var i = 0; i < comment.likes.length; i++) {
                    if (comment.likes[i].createdBy.id == authService.user.id) {
                        comment.iLike = true;
                        break;
                    }
                }
                for (i = 0; i < comment.dislikes.length; i++) {
                    if (comment.dislikes[i].createdBy.id == authService.user.id) {
                        comment.iDislike = true;
                        break;
                    }
                }
            });

            //$timeout(function () {
            //    $scope.getCommentDivHeight();
            //}, 1500);

            return topic;
        };

        $scope.commentUserArry = [];
        $scope.childrenUserArry = [];
        $scope.selectedUserArry = [];
        $scope.cookieArray = [];

        var init = function (slug, initTopicId) {
            $scope.hideLoading();
            if ($scope.program.slug) slug = $scope.program.slug;
            if ($scope.topic) initTopicId = $scope.topic.id;
            topicId = initTopicId;
         };

        var commentsLoad = function (state, param) {

            if (param) {
                init(param.slug, param.topicId);
            }
            if (param.topic) {

                $scope.topic = finishLoad(param.topic);
                $scope.commentArry = $scope.topic.children;
                //console.log("Topic Comment Length on Load: " + $scope.commentArry.length);
                $scope.commentDate = new Date($scope.topic.createdAt);
                $scope.startDate = $scope.commentDate;
                $scope.commentUserArry = $rootScope.networkUsers;
                $scope.childrenUserArry = $rootScope.networkUsers;
              
            _.each($scope.childrenUserArry, function (user) {
                user.selected = false;
            });
           
                //_.each($scope.topic.children, function (child) {
                //    child.label = child.createdBy.firstName + ' ' + child.createdBy.lastName;
                //    child.selected = false;
                //    var a = { id: child.createdById, label: child.label, selected: child.selected };
                //    {
                //        $scope.selectedUserArry.push(a);
                //    }
                //    var b = $filter('unique')($scope.selectedUserArry, 'label');
                //    $scope.childrenUserArry = b;
                //    if ($scope.commentUserArry.indexOf(child) == -1) {
                //        $scope.commentUserArry.push(child);
                //     //   $scope.childrenUserArry.push(child);
                //    }
                //});

            if (localStorageAvailable) {
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(filterName)) {
                        var selectedTopic = JSON.parse(localStorage.getItem(filterName));
                        if ($scope.topic.id == selectedTopic.selectedTopicId) {
                            filterDataExist(selectedTopic);
                            $scope.toggle.childFiltersShow = true;
                            angular.element('.forum-content button.filterButton').addClass('active');
                            $scope.dateFilter();
                        }
                    }
                
                } else {
                     //local Storage not supported. Use Cookie. 
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    var commentCookie = $cookies.get(filterName);
                    if (commentCookie) {
                        filterDataExist(JSON.parse(commentCookie));
                        $scope.toggle.childFiltersShow = true;
                        angular.element('.forum-content button.filterButton').addClass('active');
                        $scope.dateFilter();
                    }
                    
                }
            }
        };

        controllerState.state('forumTopic', {
            url: '/:topicId',
            parent: 'forum',
            onEnter: commentsLoad

        })

        $scope.$watch(function () {
            return $scope.program;
        }, function () {
            if (!$scope.program) return;
            // load(true);
        });

        $scope.submitComment = function (e) {

            e.preventDefault();
            $scope.resetVal();
            var isValid = true;

            if (!$scope.model.comment || $scope.model.comment.trim().length <= 0) {
                $scope.ui.val.content.req = true;
                isValid = false;
            }

            if (!isValid) return;

            $scope.commentSubmitting = true;

            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + topicId + '/comments', $scope.model)
                .success(function (topic) {
                    if ($scope.result) {
                        $scope.program.score.points.earned += $scope.program.forum.newCommentPoints;
                        $scope.result.discussionScore.newCommentPoints += $scope.program.forum.newCommentPoints;
                    }

                    if ($rootScope.updatePointAwardValuesToConsiderMax) {
                        $rootScope.updatePointAwardValuesToConsiderMax();
                    }

                    $scope.topic = finishLoad(topic);
                    $scope.commentArry = $scope.topic.children;
                    $scope.model.comment = null;
                    $scope.model.media = [];
                    $scope.commentSubmitting = false;
                });
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

        $scope.likeItem = function (item) {
            if (item.iLike) return;
            item.iLike = true;
            item.iDislike = false;

            item.likes.push({
                id: 0,
                createdBy: { id: authService.user.id }
            });
            for (var i = 0; i < item.dislikes.length; i++) {
                if (item.dislikes[i].createdBy.id == authService.user.id) {
                    if (item.createdBy.id != authService.user.id) {
                        $scope.program.score.points.earned -= $scope.program.forum.likePoints;
                        $scope.result.discussionScore.likePoints -= $scope.program.forum.likePoints;
                    }
                    item.dislikes.splice(i, 1);
                    break;
                }
            }

            if (item.createdBy.id != authService.user.id) {
                if (!$scope.program.forum.likePointsMax || ($scope.result.discussionScore.likePoints + $scope.program.forum.likePoints) <= $scope.program.forum.likePointsMax) {
                    $scope.program.score.points.earned += $scope.program.forum.likePoints;
                    $scope.result.discussionScore.likePoints += $scope.program.forum.likePoints;
                }
            }

            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/like', { forumItemId: item.id });
        };

        $scope.dislikeItem = function (item) {
            if (item.iDislike) return;
            item.iDislike = true;
            item.iLike = false;

            item.dislikes.push({
                id: 0,
                createdBy: { id: authService.user.id }
            });

            for (var i = 0; i < item.likes.length; i++) {
                if (item.likes[i].createdBy.id == authService.user.id) {
                    if (item.createdBy.id != authService.user.id) {
                        $scope.program.score.points.earned -= $scope.program.forum.likePoints;
                        $scope.result.discussionScore.likePoints -= $scope.program.forum.likePoints;
                    }
                    item.likes.splice(i, 1);
                    break;
                }
            }

            if (item.createdBy.id != authService.user.id) {
                if (!$scope.program.forum.likePointsMax || ($scope.result.discussionScore.likePoints + $scope.program.forum.likePoints) <= $scope.program.forum.likePointsMax) {
                    $scope.program.score.points.earned += $scope.program.forum.likePoints;
                    $scope.result.discussionScore.likePoints += $scope.program.forum.likePoints;
                }
            }

            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/dislike', { forumItemId: item.id });
        };

        $scope.deleteForumItem = function (e, item, isTopic) {
            e.stopPropagation();
            e.preventDefault();

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Delete Topic?',
                            text: 'Are you sure you want to delete this ' + (isTopic ? 'topic' : 'comment') + '?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    if (isTopic) {
                        $scope.showLoading();
                    }

                    $http.delete(authService.apiUrl + '/forum/' + $scope.program.forum.id + (isTopic ? '/topics/' : '/comments/') + item.id)
                        .success(function () {
                            if (isTopic) {
                                $scope.backToForum();
                            } else {
                                $scope.topic.children = _.without($scope.topic.children, item);
                                $scope.commentArry = $scope.topic.children;
                            }

                        }).error(function (err) {
                            $scope.topicSubmitting = false;
                            $scope.submitError = err;
                        })
                })
        };


        $scope.refresh = function () {
            load(true);
        };

        $window.onload = function () {
            controllerState.go('forum');
        };


        $scope.addMedia = function (e) {
            e.stopPropagation();
            var btnElm = angular.element(e.target);
            var popupElm = btnElm.next('.add-media-popup');
            popupElm.css('left', btnElm.outerWidth() + (15 + 30));
            angular.element('.add-media .val').addClass('ng-hide');
            $scope.ui.addMedia.in = !$scope.ui.addMedia.in;

            if ($scope.ui.addMedia.in) {
                $timeout(function () {
                    var $b = angular.element('#forum-content-body');
                    $b.scrollTop($b[0].scrollHeight);
                })
            }
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

            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
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
                    $scope.model.media = _.without($scope.model.media, media)
                });
        };


        /*UI Filter Change Function*/
        $scope.userfilterView = [];
        $scope.topicSearch = null;
        $scope.searchTopic = null;
        var hasData = false;
        var hasDates = false;
        $scope.applyButton = false;
        $scope.resetButton = false;
        var hasIndividual = false;   
        $scope.individualLength = null;
        $scope.toggle.childFiltersShow = false;

        $scope.childFilterButtonClick = function () {
            $scope.toggle.childFiltersShow = !$scope.toggle.childFiltersShow;
            angular.element('.forum-content button.filterButton').toggleClass('active');
            $scope.dateFilter();
        };

        $scope.commentFilterData = {
            programTitle: null,
            selectedTopicId: null,
            topic: null,
            date: {
                startDate: null,
                endDate: null
            },
            individuals: []
        }

        $scope.$watch('commentFilterData', function () {
            if ($scope.topic) {
                $scope.commentArry = $scope.finalFilter($scope.topic.children);
                $scope.commentFilterData.programTitle = $scope.program.title;
                $scope.commentFilterData.selectedTopicId = $scope.topic.id;

                /*to differentiate between localstorage and cookies commentpagefilter*/
                if (localStorageAvailable) {
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    if (localStorage.getItem(filterName)) {
                        localStorage.removeItem(filterName);
                    }
                    localStorage.setItem(filterName, JSON.stringify($scope.commentFilterData));
                } else {
                    //local Storage not supported. Use Cookie. 
                    var filterName = 'commentPageFilter'.concat($scope.program.id);
                    if ($cookies.get(filterName)) {
                        $cookies.remove(filterName);
                    }
                    $cookies.put(filterName, JSON.stringify($scope.commentFilterData));
                }
            }
        }, true);

        $('body').bind('click', function (e) {
            if ($(e.target).closest('#showDropdown').length == 0) {
                if ($scope.showDropdown) {
                    $scope.showDropdown = false;
                    $scope.$apply();
                }
            }
        });
        $scope.dateFilter = function () {

            $scope.dateShow = true;

            $scope.authorShow = false;
            $scope.topicShow = false;

        };

        $scope.authorFilter = function () {

            $scope.dateShow = false;

            $scope.authorShow = true;

            $scope.topicShow = false;

        };

        $scope.topicFilter = function () {

            $scope.dateShow = false;

            $scope.authorShow = false;
            $scope.topicShow = true;


        };
        // $scope.childrenUserArry = [];
        $scope.sharechildrenUserArry = [];
        $scope.commentArry = [];

        $scope.showDropdownmenu = function (event) {

            //    $scope.selectedUserArry = $scope.programUsers;
            angular.element('input#searchuser').val('');
            $scope.showDropdown = !$scope.showDropdown;
            //console.log($scope.topic);

        };

        $scope.childtoggleGroup = function (group) {
            //console.log(group);

            if (group.selected == true) {
                _.each(group.programUsers, function (val) {
                    _.each($scope.childrenUserArry, function (user) {
                        if (val.programUser.user.id == user.userId) {
                            user.selected = true;
                            $scope.childtoggleUser(user);
                        }
                    });
                });
            }
            else {
                // first clear the arry of all users.
                //  then find grous that are selected and then pass them to individual function again.
                $scope.sharechildrenUserArry = [];
                $scope.commentFilterData.individuals = [];
                if ($scope.sharechildrenUserArry.length == 0) {
                    var index = $scope.userfilterView.indexOf($scope.sharechildrenUserArry.length);
                    $scope.userfilterView.splice(index, 1);
                    hasIndividual = false;
                    $scope.individualLength = null;
                }
                _.each($scope.childrenUserArry, function (user) {
                    user.selected = false;
                });

                _.each($rootScope.userGroups, function (group) {
                    if (group.selected == true) {
                        _.each(group.programUsers, function (val) {
                            _.each($scope.childrenUserArry, function (user) {
                                if (val.programUser.id == user.id) {
                                    user.selected = true;
                                    $scope.childtoggleUser(user);
                                }
                            });
                        });

                    }

                });
            }
        };

        $scope.childtoggleUser = function (item) {

            if (item.selected == true) {
                if ($scope.sharechildrenUserArry.indexOf(item) == -1) {
                    $scope.sharechildrenUserArry.push(item);
                }
            }
            else {

                var index = $scope.sharechildrenUserArry.indexOf(item);
                if (index != -1) {
                    $scope.sharechildrenUserArry.splice(index, 1);

                }
                if ($scope.sharechildrenUserArry.length == 0) {
                    $scope.commentArry = $scope.topic.children;
                }
                $scope.commentFilterData.individuals = [];
                _.each($scope.sharechildrenUserArry, function (user) {
                    $scope.commentFilterData.individuals.push(user);
                });
            }
        };

        $scope.removeShareUser = function (label) {
            var index = $scope.sharechildrenUserArry.indexOf(label);

            if ($scope.sharechildrenUserArry.length > 1) {
                $scope.sharechildrenUserArry.splice(index, 1);
                label.selected = false;
                //_.each($scope.topic.children, function (child) {

                //    if (label.label == child.label) {
                //        if ($scope.commentArry.indexOf(child) != -1) {

                //            $scope.commentArry.splice($scope.commentArry.indexOf(child), 1);
                //        }
                //    }

                //});
            } else {

                $scope.sharechildrenUserArry.splice(index, 1);
                label.selected = false;
                //_.each($scope.topic.children, function (child) {

                //    if (label.label == child.label) {
                //        if ($scope.commentArry.indexOf(child) != -1) {

                //            $scope.commentArry.splice($scope.commentArry.indexOf(child), 1);
                //            $scope.commentFilterData.individuals.splice($scope.commentArry.indexOf(child), 1);
                //        }
                //    }

                //});
                if ($scope.sharechildrenUserArry.length == 0) {
                    $scope.commentArry = $scope.topic.children;
                    var index = $scope.userfilterView.indexOf($scope.sharechildrenUserArry.length);
                    $scope.userfilterView.splice(index, 1);
                    hasIndividual = false;
                    $scope.individualLength = null;
                    _.each($rootScope.userGroups, function (group) {
                        group.selected = false;
                    });
                }

                //update filterData
                $scope.commentFilterData.individuals = [];
                _.each($scope.sharechildrenUserArry, function (user) {
                    $scope.commentFilterData.individuals.push(user);
                });

            }

        };

        $scope.individualApply = function () {
            //apply button will need to be clicked if shareUser lengh > 1. so that we apply it to userView Array and also trigger filter.
            if ($scope.individualLength && $scope.individualLength != 0) {
                $scope.userfilterView.splice($scope.userfilterView.indexOf($scope.individualLength), 1);
            }

            if ($scope.sharechildrenUserArry.length > 0) {
                $scope.individualLength = $scope.sharechildrenUserArry.length;

                //add to userFilterView
                $scope.userfilterView.push($scope.individualLength);


                $scope.commentFilterData.individuals = [];
                _.each($scope.sharechildrenUserArry, function (user) {
                    $scope.commentFilterData.individuals.push(user);
                });


            }



            if ($scope.sharechildrenUserArry.length > 1) {
                _.each($scope.topic.children, function (child) {
                    _.each($scope.sharechildrenUserArry, function (item) {

                        if (item.id == child.id) {
                            if ($scope.commentArry.indexOf(child) != -1) {
                                $scope.commentArry = [];
                                $scope.commentArry.push(child);
                            }

                        }
                    });
                });
            }


        };
        var usersForGroup = [];
        $scope.submitGroup = function (e) {
            if ($scope.validate()) {
                $scope.submitted = true;
                return $q(function (resolve, reject) {
                    $http.post(authService.apiUrl + '/program-user-group/create/', $scope.model)
                        .success(function (group) {
                            resolve();
                            $rootScope.$emit('userGroupAdded', group);
                            $rootScope.closeCreateUserGroupModal();
                        })
                        .error(function (err) {
                            reject(err);
                            $scope.err = err;
                            $scope.submitted = false;
                            if (err.indexOf('Cannot have duplicate group names') != -1) {
                                $scope.ui.val.name.dup = true;
                            }
                        });
                });
            }
        };

        $scope.createUserGroups = function () {
            _.each($rootScope.networkUsers, function (user) {
                _.each($scope.sharechildrenUserArry, function (networkUser) {
                    if (networkUser.userId == user.userId) {
                        usersForGroup.push(user);
                    }
                });
            });
            $rootScope.showCreateUserGroup(usersForGroup);
        };
        $scope.removeGroup = function (group) {
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


        /*Dates*/
        $scope.$watch('commentDate', function () {
            $scope.startDate = $scope.commentDate;
        }, true);
        $scope.endDate = new Date();
        $scope.todayDate = new Date();
        $scope.isOpen = false;

        $scope.datesChanged = function (date, type) {
            if (type == 'start') {
                if (date) {
                    $scope.startDate = date;
                }
            } else {
                if (date) {
                    $scope.endDate = date;
                }
            }
        };

        $scope.dateApply = function () {

            $scope.commentFilterData.date.startDate = $scope.startDate;
            $scope.commentFilterData.date.endDate = $scope.endDate;

            var currentDate = $filter('date')($scope.commentFilterData.date.startDate, 'MM/d/yy');
            var dueDate = $filter('date')($scope.commentFilterData.date.endDate, 'MM/d/yy');
            if ($scope.dates == null) {
                $scope.dates = currentDate + ' - ' + dueDate;
                $scope.userfilterView.push($scope.dates);
                //console.log($scope.userfilterView);
                hasDates = true;
            }
            else {
                var index = $scope.userfilterView.indexOf($scope.dates);
                $scope.userfilterView.splice(index, 1);
                $scope.dates = currentDate + ' - ' + dueDate;
                $scope.userfilterView.push($scope.dates);
                //console.log($scope.userfilterView);
            }
        };

        /*Reset dates*/
        $scope.resetDate = function () {
            if (hasDates == true) {
                var index = $scope.userfilterView.indexOf($scope.dates);
                $scope.userfilterView.splice(index, 1);
                $scope.dates = null;

                $scope.commentFilterData.date.startDate = null;
                $scope.commentFilterData.date.endDate = null;
                $scope.startDate = null;
                $scope.endDate = null;
                $scope.$broadcast('md-calendar-change', $scope.startDate);

                //$scope.commentFilterData.date.startDate = $scope.commentDate;
                //$scope.commentFilterData.date.endDate = new Date();

                //Md-datepicker uses the bound value by reference (for performance reasons). so when we change the date it still sees it as same object and doesnt update. 
                //so need to create a clone, set the new value to that and then point startDate and endDate to the clone. 
                //now this might be a issue with the angular version thats currently being used but the viewValue (input) is not being updated but the model is. 
                //to fix this issue, we will directly apply the value to the input. we need to get the specific month, date, year since its an dateTime Object

                var startm = new Date(+$scope.commentDate);
                startm.setDate(startm.getDate());
                $scope.startDate = startm;

                var endm = new Date(+$scope.todayDate);
                endm.setDate(endm.getDate());
                $scope.endDate = endm;

                angular.element('#date3 input.md-datepicker-input').val($scope.startDate.getMonth() + 1 + '/' + $scope.startDate.getDate() + '/' + $scope.startDate.getFullYear());
                angular.element('#date4 input.md-datepicker-input').val($scope.endDate.getMonth() + 1 + '/' + $scope.endDate.getDate() + '/' + $scope.endDate.getFullYear());
            }
            hasDates = false;
        };

        $scope.showApply = function () {
            $scope.applyButton = true;
            $scope.resetButton = true;
        };

        /*Individual Dates*/
        $scope.searchUser = function (val) {
            $scope.childrenUserArry = [];

            if ($scope.commentUserArry.length > 0) {
                _.each($scope.commentUserArry, function (item) {
                    if (item.label.toLowerCase().includes(val.toLowerCase())) {
                        $scope.childrenUserArry.push(item);
                    }
                });
            }
        };


        /*topics apply and topic reset*/
        $scope.topicApply = function (searchTopic) {
            //no need to check if topic search is null, because it is initiated as null. Also you have reset button to erase from filtered data array. 
            //need to check is already exists in array
            $scope.topicSearch = searchTopic;

            if ($scope.commentFilterData.topic != null) {
                var index = $scope.userfilterView.indexOf($scope.commentFilterData.topic);
                $scope.userfilterView.splice(index, 1);
            }
            hasData = true;
            $scope.userfilterView.push($scope.topicSearch);
            $scope.commentFilterData.topic = searchTopic;

        };

        $scope.resetTopic = function (searchTopic) {
            if ($scope.topicSearch != null) {
                if (hasData == true) {
                    $scope.topicSearch = null;
                    searchTopic = $scope.topicSearch; // This is used in frontend where returned null value will be assigned to searchTopic to make input null
                    hasData = false;
                    var index = $scope.userfilterView.indexOf($scope.topicSearch);
                    $scope.userfilterView.splice(index, 1);
                    $scope.commentFilterData.topic = null;
                }
            }
            $scope.topicSearch = null;
            searchTopic = $scope.topicSearch;// why this line? not needed 
            $scope.applyButton = false;
            $scope.resetButton = false;

            return searchTopic;
        };

        $scope.finalFilter = function (topics) {

            var filteredResult = topics;

            //dates
            /**
                moment(date, 'format'). L is a pre-configured format of MM-DD-YYYY.
                moment().isBetween(moment-like, moment-like, String, String); is used to test if date is between the start and end.
                1st parameter is the from Date
                2nd parameter is the to Date
                3rd parameter string is used to limit the granularity to a unit, in this case day. CAN BE NULL
                4th parameter is to indicate the inclusivity. [ or ] is used to indicate inclusion, ( or ) is used to indicate exclusion.
                since we want to check if the date created is >= from date and <= to date, we use [].
                http://momentjs.com/docs/#/query/is-between/   for more information.
            **/
            if ($scope.commentFilterData.date.startDate != null) {
                $scope.isSelectedDate = function (item) {
                    var date = new Date(item.createdAt); //convert dateTime string to Date object.
                    var datecreated = moment(date, 'L'); // convert date to moment. 
                    var filterStart = moment($scope.commentFilterData.date.startDate, 'L');
                    var filterEnd = moment($scope.commentFilterData.date.endDate, 'L');

                    if (datecreated.isBetween(filterStart, filterEnd, "day", "[]")) {
                        //   console.log('datecreated' + datecreated + 'filterStart' + filterStart + 'filterEnd' + filterEnd);
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                var dateFiltered = [];
                _.each(filteredResult, function (forumItem) {
                    if ($scope.isSelectedDate(forumItem)) {
                        dateFiltered.push(forumItem);
                    }
                });

                filteredResult = dateFiltered;
            }

            // individuals
            var indFiltered = [];
            if ($scope.commentFilterData.individuals.length > 0) {

                _.each($scope.commentFilterData.individuals, function (user) {
                    //for every topic see if user.id matched the created.by
                    _.each(filteredResult, function (topic) {
                        topic.label = topic.createdBy.firstName + ' ' + topic.createdBy.lastName;
                        if (topic.label == user.label) {
                            indFiltered.push(topic);
                        }
                    });
                });

                filteredResult = indFiltered;
            }

            //topics
            var topicFiltered = [];
            if ($scope.commentFilterData.topic != null) {
                $scope.isSelectedTopic = function (item) {
                    var selectedTitle = item.content;
                    if (selectedTitle.toLowerCase().indexOf($scope.commentFilterData.topic.toLowerCase())!= -1) {
                        return item;
                    }
                    else {
                        return false;
                    }

                };
                _.each(filteredResult, function (forumItem) {
                    if ($scope.isSelectedTopic(forumItem)) {
                        topicFiltered.push(forumItem);
                    }

                });
                filteredResult = topicFiltered;
            }
            //console.log("Topic Comments lenght: " + filteredResult.length);
            return filteredResult;
        };

        $scope.resetAllFilters = function () {
            $scope.commentFilterData = {

                topic: null,
                date: {
                    startDate: null,
                    endDate: null
                },
                individuals: []
            };


            $scope.resetDate();
            var searchTopic = $scope.topicSearch;

            searchTopic = $scope.resetTopic(searchTopic);
            angular.element('input.searchTopic').val("");
            $scope.userfilterView = [];

            //clear Selectuser to filter
            $scope.sharechildrenUserArry = [];
            $scope.individualLength = null;
            hasIndividual = false;
            //clear all selected individual and Group
            _.each($scope.childrenUserArry, function (user) {
                user.selected = false;
            });
            //group
            _.each($rootScope.userGroups, function (group) {
                group.selected = false;
            });
            _.each($rootScope.childUserGroups, function (group) {
                group.selected = false;
            });

            //close filter sub menu
            $scope.toggle.childFiltersShow = false;
          $cookies.remove('commentPageFilter');
            

            angular.element('.forum-content button.filterButton').removeClass('active');
        };

        var filterDataExist = function (data) {
          
                if (data.topic != null) {
                    $scope.commentFilterData.topic = data.topic;
                    $scope.searchTopic = data.topic;
                    $scope.topicApply(data.topic);
                }
                if (data.date.startDate != null) {
                    $scope.startDate = new Date(data.date.startDate);
                    $scope.endDate = new Date(data.date.endDate);
                    $scope.commentFilterData.date.startDate = data.date.startDate;
                    $scope.commentFilterData.date.endDate = data.date.endDate;
                    $scope.dateApply();
                }
                if (data.individuals.length > 0) {
                    $scope.commentFilterData.individuals = data.individuals;
                    $scope.sharechildrenUserArry = data.individuals;
                    //$scope.selectedUserArry
                    _.each(data.individuals, function (ind) {
                        _.each($scope.childrenUserArry, function (user) {
                            if (ind.userId == user.userId) {
                                user.selected = true;
                            }
                        });
                    });
                    $scope.individualApply();
                }


                if (data.topic != null || data.date.startDate != null || data.individuals.length > 0) {
                    $scope.toggle.childfiltersShow = true;
                    angular.element('.forum-content button.filterButton').addClass('active');
                    $scope.dateFilter();
                }
            
        };
    }
]);