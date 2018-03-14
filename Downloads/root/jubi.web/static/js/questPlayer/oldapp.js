'use strict';

var filters = angular.module('Jubi.filters', []);
var controllers = angular.module('Jubi.controllers', []);
var directives = angular.module('Jubi.directives', []);
var services = angular.module('Jubi.services', []);

var app = angular.module('Jubi', [
    'Jubi.filters',
    'Jubi.services',
    'Jubi.directives',
    'Jubi.controllers',
    'ui.bootstrap',
    'angularjs-dropdown-multiselect',
    'angularSpinner',
    'dndLists',
    'ngSanitize',
    'com.2fdevs.videogular',
    'angularFileUpload'
]);

services.factory(helperServiceObj);
services.factory(authServiceObj);
services.factory(controllerStateObj);

controllers.controller('RootController', ['$scope', '$q', '$http', '$timeout', '$window', 'authService', 'helperService', '$rootScope', '$modal', 'controllerState',
    function ($scope, $q, $http, $timeout, $window, authService, helperService, $rootScope, $modal, controllerState) {

        $scope.loading = {
            isLoading: 0
        };

        $scope.buddyLabel = authService.user.clients[0].buddyLabel;
        $scope.badgeLabel = authService.user.clients[0].badgeLabel;

        $scope.getBuddyLabel = function (camel) {
            if ($scope.buddyLabel) {
                if (camel) {
                    return $scope.buddyLabel.charAt(0).toUpperCase() + $scope.buddyLabel.slice(1);
                }
                return $scope.buddyLabel;
            } else {
                if (camel) {
                    return 'Buddy';
                }
                return 'buddy'
            }
        };

        $scope.getBadgeLabel = function (camel) {
            if ($scope.badgeLabel) {
                if (camel) {
                    return $scope.badgeLabel.charAt(0).toUpperCase() + $scope.badgeLabel.slice(1);
                }
                return $scope.badgeLabel;
            } else {
                if (camel) {
                    return 'Badge';
                }
                return 'badge'
            }
        };

        $scope.getAOrAnPlusBadgeLabel = function () {
            if ($scope.badgeLabel) {
                var startingChar = $scope.badgeLabel.split('')[0].toUpperCase();
                if (startingChar == 'A' || startingChar == 'E' || startingChar == 'I' || startingChar == 'O' || startingChar == 'U') {
                    return 'an ' + $scope.badgeLabel;
                } else {
                    return 'a ' + $scope.badgeLabel;
                }
                return $scope.badgeLabel;
            } else {
                return 'a badge'
            }
        };

        $scope.getHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': authService.user.clients[0].headerColor,
                    'color': authService.user.clients[0].headerFontColor,
                    'opacity': 1
                }
            }
        };

        $scope.getQuestPlayerHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return true;
            }
        }
        $scope.getQuestPlayerActivityHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': '#6a7a8a'
                }
            }
        }
       

        $scope.checkEncoding = function (media) {
            if (media.url) {
                $http.get(authService.apiUrl + '/uv/encoded?url=' + media.url)
                    .success(function (result) {
                        if (result.encodings.length <= 0) return $timeout(function () {
                            $scope.checkEncoding(media);
                        }, 1000);
                        media.encodings = result.encodings;
                    });
            }
        };

        $scope.getTopStyleForDiscussionCollapseButton = function () {
            var panel = $('#discussionSlideout');
            var height = panel.innerHeight() + (panel.scrollTop() * 2);
            return {
                'top': height / 2
            }
        };

        $scope.canNavToNextChallenge = function () {
            var canNav = false;
            if (controllerState.current == 'finish') {
                return;
            }
            else if ($scope.quest && $scope.currentChallenge && $scope.currentChallenge.result) {
                canNav = true;
            } else if ($scope.quest && controllerState.current == 'start' && $scope.quest.challenges.length > 0 && $scope.quest.challenges[0].result) {
                canNav = true;
            }
            return canNav;
        };

        $scope.navToNextChallenge = function () {
            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                $scope.close();
            } else {
                if (controllerState.current == 'start') {
                    controllerState.go('challenge', {
                        challengeIndex: 0,
                        challenge: $scope.quest.challenges[0]
                    });
                } else {
                    $scope.$broadcast('navToNextChallenge', $scope.currentChallenge);
                }
            }
        };

        $scope.canNavToPreviousChallenge = function () {
            if (controllerState.current == 'start') {
                return false;
            } else {
                return true;
            }
        };

        $scope.navToPreviousChallenge = function () {
            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                console.log($scope.quest.challenges)
                $scope.close();
            } else {
                if (controllerState.current == 'finish') {
                    //If there is a finish challenge, we need to subtract 2 from the index to skip past it, otherwise just 1
                    if(_.find($scope.quest.challenges, function(ch){ return ch.type == 'finish'})){
                        var offset = 2;
                    }else{
                        var offset = 1;
                    }

                    controllerState.go('challenge', {
                        challengeIndex: $scope.quest.challenges.length - offset,
                        challenge: $scope.quest.challenges[$scope.quest.challenges.length - offset]
                    });
                } else if ($scope.quest.challenges.indexOf($scope.currentChallenge) == 0) {
                    controllerState.go('start');
                    $scope.currentChallenge = null;
                } else {
                    $scope.$broadcast('navToPreviousChallenge', $scope.currentChallenge);
                }
            }
        };

        $scope.setCurrentChallenge = function (challenge) {
            $scope.currentChallenge = challenge;
        };


        $scope.saveCommentDraft = function (draft) {
            $scope.savedCommentDraft = draft;
        };

        $scope.clearCommentDraft = function () {
            $scope.savedCommentDraft = null;
        };

        $scope.inQuestPlayer = true;
        $scope.discussion = {
            topic: false
        };

        $scope.toggle = {
            asideDiscussion: true,
            showPointsAwarded: false
        };

        $scope.refreshDiscussion = function () {
            $scope.$broadcast('refreshDiscussion');
        };

        $rootScope.showPointsAwardedNotification = function (points) {
            $scope.toggle.showPointsAwarded = true;
            $scope.pointsAwarded = points;
            $timeout(function () {
                $scope.toggle.showPointsAwarded = false;
                $scope.poitsAwarded = null;
            }, 4250)
        };

        $scope.previewRet = null;
        $scope.previewRetHash = null;
        $scope.preview = null;
        $scope.program = null;
        $scope.quest = null;
        $scope.questionTypes = helperService.questionTypes;

        $scope.allCompletedQuests = function () {
            if ($scope.program) {
                if (!$scope.allQuests) {
                    $scope.allQuests = $scope.program.quests;
                    _.each($scope.program.levels, function (level) {
                        _.each(level.quests, function (quest) {
                            $scope.allQuests.push(quest);
                        })
                    });
                }

                return _.filter($scope.allQuests, function (quest) {
                    return quest.challengesComplete > 0;
                });
            }
        };


        this.init = function (programId, questId) {
            var url = authService.apiUrl + '/programs/' + programId + '/user';
            $scope.loading.isLoading++;
            $scope.previewRet = helperService.getQueryValue('previewRet');
            $scope.previewRetHash = helperService.getQueryValue('previewRetHash');
            $scope.preview = helperService.getQueryValue('preview');
            if ($scope.preview) url += '?preview=yes';


            $http.get(url)
                .success(function (program) {
                    //Get the forum with the categories for user in the inspiration triggers and also the discussion page
                    var prepForum = function (program) {
                        return $q(function (resolve, reject) {
                            if (program.forum) return resolve(program.forum);
                            $http.post(authService.apiUrl + '/forum/create', {programLinkId: program.linkId})
                                .success(function (forum) {
                                    resolve(forum);
                                }).error(reject);
                        })
                    };
                    prepForum(program).then(function (results) {
                        program.forum = results;
                        $q.all([
                            $http.get(authService.apiUrl + '/program/' + program.id + '/network-users/' + program.linkId),
                            $http.get(authService.apiUrl + '/forum/' + program.forum.id + '/categories'),
                            $http.get(authService.apiUrl + '/program-user-groups/' + program.linkId)
                        ]).then(function (results) {
                            $rootScope.networkUsers = results[0].data;
                            $rootScope.userGroups = results[2].data;

                            _.each($rootScope.networkUsers, function (nu) {
                                $rootScope.formatNetworkUser(nu);
                            });

                            _.each($rootScope.userGroups, function (g) {
                                $rootScope.formatUserGroup(g);
                            });


                            $rootScope.forumCategories = results[1].data;
                            $scope.program = program;
                            $scope.quest = $scope.getQuestById(questId);
                            $scope.stopLoading();
                        })
                    });
                })
                .error(function (err) {
                    reject(err);
                });
        };

        $rootScope.showCreateUserGroup = function (users) {
            $scope.usersPendingGroupCreation = users;
            $scope.userGroupModal = $modal.open({
                templateUrl: 'createUserGroup.html',
                scope: $scope,
                controller: infoModalControllerObj.infoModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            ok: 'Close'
                        }
                    }
                }
            })
        };

        $rootScope.closeCreateUserGroupModal = function () {
            $scope.usersPendingGroupCreation = null;
            if ($scope.userGroupModal) {
                $scope.userGroupModal.close();
            }
        };

        $rootScope.formatUserGroup = function (userGroup) {
            userGroup.label = userGroup.name;
            userGroup.user = {id: null};
            userGroup.type = 'User Groups';
            userGroup.isGroup = true;
            userGroup.tooltip = '';
            _.each(userGroup.programUsers, function (groupUser, i) {
                userGroup.tooltip += (groupUser.programUser.user.firstName + ' ' + groupUser.programUser.user.lastName + (i < userGroup.programUsers.length - 1 ? ', ' : ' '));
            })
        };

        $scope.getQuestPlayerStyle = function () {
            if ($scope.quest && $scope.quest.backgroundImageUrl) {
                return {'background-image': 'url(' + $scope.quest.backgroundImageUrl + ')'};
            } else if ($scope.quest && $scope.quest.featuredImageUrl) {
                return {'background-image': 'url(' + $scope.quest.featuredImageUrl + ')'};
            } else if ($scope.quest) {
                return {'background-image': '/img/no-picture.jpg'};
            }
        };

        $rootScope.formatNetworkUser = function (networkUser) {
            networkUser.label = networkUser.user.firstName + ' ' + networkUser.user.lastName;
        };

        $rootScope.$on('userGroupAdded', function (e, item) {
            $rootScope.formatUserGroup(item);
            $rootScope.networkUsers.unshift(item);
        });

        $scope.getNetworkUsers = function () {
            return $scope.networkUsers;
        };

        //Searches through the levels quests and the program quests to find the quest by id
        $scope.getQuestById = function (questId) {
            var foundQuest = null;
            _.find($scope.program.levels, function (level) {
                var quest = _.find(level.quests, function (quest) {
                    if (quest.id == questId) {
                        foundQuest = quest;
                        return true;
                    }
                });
                if (quest) {
                    return true;
                }
            });
            if (!foundQuest) {
                foundQuest = _.findWhere($scope.program.quests, {id: questId});
            }
            return foundQuest;
        };

        $scope.stopLoading = function () {
            if ($scope.loading.isLoading == 1)
                return $timeout(function () {
                    $scope.loading.isLoading--;
                }, 300);
            $scope.loading.isLoading--;
        };

        $scope.close = function () {
            var url;
            if ($scope.preview && $scope.previewRet && $scope.preview.indexOf('quest/') != -1) {
                url = '/manage/authoring-suite';
                if ($scope.previewRet) url += $scope.previewRet;
                if ($scope.previewRetHash) url += '#' + $scope.previewRetHash;
                $window.location = url;
            } else {
                url = '/user/program/' + $scope.program.slug + '/quests';
                if ($scope.preview) url += '?preview=' + $scope.preview;
                if ($scope.previe && $scope.previewRet) url += '&previewRet=' + $scope.previewRet;
                $window.location = url;
            }
        };

        $scope.toHtml = function (text) {
            return text.replace(/\n/g, '<br>');
        };

        $scope.bodyClick = function () {
            $scope.$broadcast('bodyClick');
        };

        $scope.canManage = function () {
            return authService.canManage();
        };

        $scope.getCanvasHeight = function () {
            return $window.innerHeight;
        };


        //Ensures that angular recacuates the canvas height on window resize, can't use watch for resize events
        angular.element(window).on('resize', function () {
            $scope.$apply(function () {
                $scope.getTopStyleForDiscussionCollapseButton();
            })
        });

        $.fn.scrollEnd = function (callback, timeout) {
            $(this).scroll(function () {
                var $this = $(this);
                if ($this.data('scrollTimeout')) {
                    clearTimeout($this.data('scrollTimeout'));
                }
                $this.data('scrollTimeout', setTimeout(callback, timeout));
            });
        };

        $('#discussionSlideout').scrollEnd(function () {
            $scope.$apply(function () {
                $scope.getTopStyleForDiscussionCollapseButton();
            })
        }, 100);

    }]);

controllers.controller('QuestPlayerController', ['$scope', '$q', '$http', '$timeout', 'controllerState', 'authService', 'helperService',
    function ($scope, $q, $http, $timeout, controllerState, authService, helperService) {
        $scope.inState = null;

        controllerState.scope($scope);
        controllerState.otherwise('start');
        controllerState.onEnter = function (state) {
            $timeout(function () {
                $scope.inState = state;
            });
        };


        $scope.$watch(function () {
            return $scope.quest;
        }, function () {
            if (!$scope.quest) return;

            if ($scope.getFirstIncompleteQuestIndex() != -1) {
                controllerState.route();
            } else {
                controllerState.go('finish');
            }

            $scope.stopLoading();
        });

        $scope.start = function () {
            var index = $scope.getFirstIncompleteQuestIndex();
            if (index >= 0) {
                controllerState.go('challenge', {
                    challengeIndex: index,
                    challenge: $scope.quest.challenges[index]
                });
            }
            else {
                controllerState.go('finish');
            }
        };

        $scope.getFirstIncompleteQuestIndex = function () {
            var index = -1;
            for (var i = 0; i < $scope.quest.challenges.length; i++) {
                if (!$scope.quest.challenges[i].complete && $scope.quest.challenges[i].type != 'finish') {
                    index = i;
                    break;
                }
            }

            return index;
        }
    }]);

controllers.controller('QuestPlayerStartController', ['$scope', '$q', '$http', '$timeout', 'controllerState', 'authService',
    function ($scope, $q, $http, $timeout, controllerState, authService) {
        controllerState.state('start', {url: '/start'});
    }]);

controllers.controller('QuestPlayerChallengeController', ['$scope', '$q', '$http', '$timeout', '$sce', 'controllerState', 'authService', 'helperService', '$rootScope',
    function ($scope, $q, $http, $timeout, $sce, controllerState, authService, helperService, $rootScope) {
        $scope.challengeIndex = 0;
        $scope.challenge = null;
        $scope.canContinue = false;

        var shuffle = function (array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
        };

        var initState = function (state, params) {
            resetVal();
            if (params && typeof params.challengeIndex !== 'undefined') {
                $scope.challengeIndex = parseInt(params.challengeIndex);
                $scope.challenge = params.challenge ?
                    params.challenge : $scope.quest.challenges[$scope.challengeIndex];
                $scope.setCurrentChallenge($scope.challenge);
                $scope.canContinue = ($scope.challenge.questions.length <= 0);

                angular.forEach($scope.challenge.questions, function (question) {
                    if (question.type.id == helperService.questionTypes.fillBlank.id ||
                        question.type.id == helperService.questionTypes.shortAnswer.id) {
                        question.result = null;
                    } else if (question.type.id == helperService.questionTypes.narrative.id) {
                        if (!$scope.challenge.result && !question.result) {
                            question.result = null;
                        } else {
                            question.result = $scope.challenge.result.items[0].data;
                        }
                    } else if (question.type.id == helperService.questionTypes.fillBlank.id) {
                        angular.forEach(question.answers, function (answer) {
                            answer.result = null;
                        });
                    }
                    else if (question.type.id == helperService.questionTypes.poll.id) {
                        angular.forEach(question.answers, function (answer) {
                            answer.selected = false;
                        });
                    }
                    else if (question.type.id == helperService.questionTypes.pollMultiSelect.id) {
                        question.selectCount = 0;
                        angular.forEach(question.answers, function (answer) {
                            if (answer.correct) question.selectCount++;
                            answer.selected = false;
                        });
                    }
                    else if (question.type.id == helperService.questionTypes.matching.id) {
                        if (!question.formatted) {
                            var a = null;
                            var answers = [];
                            var matchingItems = [];
                            angular.forEach(question.answers, function (answer) {
                                if (!a) {
                                    a = {
                                        id: answer.id,
                                        answer: answer.answer,
                                        match: null
                                    }
                                }
                                else {
                                    a.matchId = answer.id;
                                    a.match = answer.answer;
                                    answers.push(a);

                                    matchingItems.push({
                                        matchId: a.matchId,
                                        match: a.match
                                    });

                                    a = null;
                                }
                            });
                            question.answers = answers;

                            var done = false;
                            var count = 0;
                            while (!done && count < 10) {
                                // Randomize the matching items
                                shuffle(matchingItems);

                                var diffs = 0;
                                // Count differences
                                angular.forEach(question.answers, function (answer, i) {
                                    if (matchingItems[i].matchId != answer.matchId) diffs++;
                                });
                                // Must be at least 50% different
                                if (diffs >= Math.ceil(matchingItems.length * 0.5)) done = true;
                                count++;
                            }
                            question.matchingItems = matchingItems;
                            question.selectedMatchItem = null;
                            question.formatted = true;
                        }
                    }
                    else if (question.type.id == helperService.questionTypes.sequencing.id) {

                        // Load the match item array
                        var seqItems = [];
                        angular.forEach(question.answers, function (answer) {
                            seqItems.push({
                                id: answer.id,
                                answer: answer.answer
                            });
                        });
                        var done = false;
                        var count = 0;
                        while (!done && count < 10) {
                            // Randomize the seq items
                            shuffle(seqItems);

                            var diffs = 0;
                            // Count differences
                            angular.forEach(question.answers, function (answer, i) {
                                if (seqItems[i].id != answer.id) diffs++;
                            });
                            // Must be at least 50% different
                            if (diffs >= Math.ceil(seqItems.length * 0.5)) done = true;
                            count++;
                        }
                        question.seqItems = seqItems;
                        question.selectedSeqItem = null;
                    }
                    else if (question.type.id == helperService.questionTypes.sentenceBuilder.id) {

                        // Load the item array
                        var items = [];
                        angular.forEach(question.answers, function (answer) {
                            items.push({
                                id: answer.id,
                                answer: answer.answer,
                                inResult: false
                            });
                        });
                        var done = false;
                        var count = 0;
                        while (!done && count < 10) {
                            // Randomize the items
                            shuffle(items);

                            var diffs = 0;
                            // Count differences
                            angular.forEach(question.answers, function (answer, i) {
                                if (items[i].id != answer.id) diffs++;
                            });
                            // Must be at least 50% different
                            if (diffs >= Math.ceil(items.length * 0.5)) done = true;
                            count++;
                        }
                        question.items = items;
                        question.resultItems = [];
                        question.result = null;
                    }
                    else if (question.type.id == helperService.questionTypes.contrasting.id) {
                        question.similarityResults = [];
                        question.differenceResults = [];
                        angular.forEach(question.answers, function (answer) {
                            answer.inResult = false;
                            if (answer.correct) question.similarityResults.push({result: null});
                            else question.differenceResults.push({result: null});
                        });
                    }
                    else if (question.type.id == helperService.questionTypes.grouping.id) {
                        var a = null;
                        var answers = [];
                        if (!question.groupItems) {
                            question.groupItems = [];
                            angular.forEach(question.answers, function (answer) {
                                if (answer.answer[0] !== '@') {
                                    a = {
                                        answer: answer.answer,
                                        items: [],
                                        resultItems: []
                                    };
                                    answers.push(a);
                                }
                                else {
                                    var gi = {
                                        item: answer.answer.replace('@', '')
                                    };
                                    a.items.push(gi);
                                    question.groupItems.push(gi);
                                }
                            });
                            question.answers = answers;

                            // Randomize the group items
                            shuffle(question.groupItems);
                        }
                    }
                });

                angular.forEach($scope.challenge.media, function (media) {
                    if (media.type == 'video') {
                        if (media.source == 'youtube') {
                            if (typeof media.iframe == 'string') {
                                media.iframe = $sce.trustAsHtml(media.iframe);
                            }
                        }
                        else {
                            media.playing = false;
                            if (typeof media.url == 'string') {
                                media.sources = [];

                                var url = authService.apiUrl + '/sv/get-available-formats/' + media.ref;

                                $http.get(url).success(function(response){
                                    if(response.indexOf('.mp4') != -1){
                                        media.sources.push({src: $sce.trustAsResourceUrl(media.url + '.mp4'), type: 'video/mp4'});
                                    }
                                    if(response.indexOf('.webm') != -1){
                                        media.sources.push({src: $sce.trustAsResourceUrl(media.url + '.webm'), type: 'video/webm'});
                                    }
                                    if(response.indexOf('.ogv') != -1){
                                        media.sources.push({src: $sce.trustAsResourceUrl(media.url + '.ogv'), type: 'video/ogg'});
                                    }
                                    media.formatsLoaded = true;
                                });
                            }
                        }
                    }
                    else if (media.type == 'audio') {
                        media.api = null;
                        if (typeof media.url == 'string') {
                            media.sources = [
                                {src: $sce.trustAsResourceUrl(media.url), type: 'audio/mp3'}
                            ];
                        }
                    }
                });
            }
            $timeout(function () {
                angular.element('#target-anchor a').attr('target', '_blank');
            });
        };

        controllerState
            .state('challenge', {
                url: '/challenge/:challengeIndex',
                onEnter: initState
            });

        var resetVal = function () {
            $scope.val = {
                wrong: false,
                correct: false
            };
            $scope.canContinue = false;
        };
        resetVal();

        $scope.checkLabel = function (challenge) {
            if (!challenge) return null;
            if (challenge.questions.length == 1) return 'Check Answer';
            return 'Check Answers';
        };

        var validate = function (challenge) {
            var correct = true;

            angular.forEach(challenge.questions, function (question) {
                switch (question.type.id) {
                    case  helperService.questionTypes.singleSelect.id:
                        if (!question.selected) correct = false;
                        else correct = question.answers[parseInt(question.selected)].correct;
                        break;
                    case  helperService.questionTypes.multiSelect.id:
                        correct = true;
                        angular.forEach(question.answers, function (val, key) {
                            if (val.isSelected !== undefined && val.isSelected === true) {
                                if (!val.correct)
                                    correct = false;
                            }
                            else if (val.correct === true)
                                correct = false;

                        });
                        break;
                    case  helperService.questionTypes.poll.id:
                        correct = false;
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].selected) {
                                correct = true;
                                break;
                            }
                        }
                        break;
                    case  helperService.questionTypes.pollMultiSelect.id:
                        var cnt = 0;
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].selected) cnt++;
                        }
                        correct = (question.selectCount == 0 && cnt > 0) || (cnt == question.selectCount);
                        break;
                    case  helperService.questionTypes.narrative.id:
                        if (!question.result) correct = false;
                        break;
                    case  helperService.questionTypes.fillBlank.id:
                        correct = true;
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].correct) {
                                if (!question.answers[i].result) {
                                    correct = false;
                                    break;
                                }
                                if (question.answers[i].result.replace(/[^a-z0-9]/gi, '').toLowerCase() !=
                                    question.answers[i].answer.replace(/[^a-z0-9]/gi, '').toLowerCase()) {
                                    correct = false;
                                    break;
                                }
                            }
                        }
                        break;
                    case  helperService.questionTypes.matching.id:
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].matchId != question.matchingItems[i].matchId) {
                                correct = false;
                                break;
                            }
                        }
                        break;
                    case  helperService.questionTypes.shortAnswer.id:
                        correct = false;
                        if (!question.result) break;

                        var check = question.result.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase();
                        for (var i = 0; i < question.answers.length; i++) {
                            if (check === question.answers[i].answer.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase()) {
                                question.matchAnswerId = question.answers[i].answer.id;
                                correct = true;
                                break;
                            }
                        }
                        break;
                    case  helperService.questionTypes.contrasting.id:
                        correct = true;

                        angular.forEach(question.answers, function (answer) {
                            answer.inResult = false;
                        });

                        for (var i = 0; i < question.similarityResults.length; i++) {
                            if (!question.similarityResults[i].result) {
                                correct = false;
                                break;
                            }
                            var found = false;
                            var check = question.similarityResults[i].result.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase();
                            for (var j = 0; j < question.answers.length; j++) {
                                if (!question.answers[j].correct) continue;

                                if (question.answers[j].answer.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase() === check) {
                                    if (question.answers[j].inResult) break;
                                    question.answers[j].inResult = true;
                                    found = true;
                                    break;
                                }
                            }
                            correct = found;
                            if (!correct) break;
                        }
                        if (!correct) break;
                        for (var i = 0; i < question.differenceResults.length; i++) {
                            if (!question.differenceResults[i].result) {
                                correct = false;
                                break;
                            }
                            var found = false;
                            var check = question.differenceResults[i].result.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase();
                            for (var j = 0; j < question.answers.length; j++) {
                                if (question.answers[j].correct) break;

                                if (question.answers[j].answer.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase() === check) {
                                    if (question.answers[j].inResult) break;
                                    question.answers[j].inResult = true;
                                    found = true;
                                    break;
                                }
                            }
                            correct = found;
                            if (!correct) break;
                        }
                        break;
                    case  helperService.questionTypes.sentenceBuilder.id:
                        if (question.resultItems.length != question.answers.length) {
                            correct = false;
                        }
                        else {
                            for (var i = 0; i < question.answers.length; i++) {
                                if (question.answers[i].id != question.resultItems[i].id) {
                                    correct = false;
                                    break;
                                }
                            }
                        }
                        break;
                    case  helperService.questionTypes.freeContrasting.id:
                        break;
                    case  helperService.questionTypes.sequencing.id:
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].id != question.seqItems[i].id) {
                                correct = false;
                                break;
                            }
                        }
                        break;
                    case  helperService.questionTypes.grouping.id:

                        correct = true;
                        for (var i = 0; i < question.answers.length; i++) {
                            var answer = question.answers[i];


                            for (var j = 0; j < answer.items.length; j++) {
                                var item = answer.items[j];

                                var found = false;
                                for (var k = 0; k < answer.resultItems.length; k++) {
                                    if (answer.resultItems[k].item === item.item) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    correct = false;
                                    break;
                                }
                                if (!correct) break;
                            }
                            if (!correct) break;
                        }
                        break;

                }
            });

            return correct;
        };

        var updateScore = function (challenge) {
            // Set the complete flag
            challenge.complete = true;
            challenge.score.points.earned = challenge.score.points.total;

            // Update the quest!
            $scope.quest.challengesComplete++;
            $scope.quest.score.points.earned += challenge.score.points.earned;

            // Update the program
            $scope.program.score.points.earned += challenge.score.points.earned;
            if ($scope.quest.challengesComplete == $scope.quest.challenges.length) $scope.program.questsComplete++;
        };

        var recordResult = function (challenge) {

            return $q(function (resolve, reject) {
                var resultItems = [];

                angular.forEach(challenge.questions, function (question) {
                    switch (question.type.id) {
                        case  helperService.questionTypes.singleSelect.id:
                            resultItems.push({
                                questionId: question.id,
                                answerId: question.answers[parseInt(question.selected)].id,
                                data: null
                            });
                            break;
                        case  helperService.questionTypes.multiSelect.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({questionId: question.id, answerId: answer.id, data: null});
                            });
                            break;
                        case  helperService.questionTypes.poll.id:
                            var selAnswer;
                            for (var i = 0; i < question.answers.length; i++) {
                                if (question.answers[i].selected) {
                                    selAnswer = question.answers[i];
                                    break;
                                }
                            }
                            resultItems.push({questionId: question.id, answerId: selAnswer.id, data: null});
                            break;
                        case  helperService.questionTypes.pollMultiSelect.id:
                            angular.forEach(question.answers, function (answer) {
                                if (answer.selected) {
                                    resultItems.push({questionId: question.id, answerId: answer.id, data: null});
                                }
                            });
                            break;
                        case  helperService.questionTypes.narrative.id:
                            resultItems.push({questionId: question.id, answerId: null, data: question.result});
                            break;
                        case  helperService.questionTypes.fillBlank.id:
                            angular.forEach(question.answers, function (answer) {
                                if (answer.correct) {
                                    resultItems.push({
                                        questionId: question.id,
                                        answerId: answer.id,
                                        data: answer.result
                                    });
                                }
                            });
                            break;
                        case  helperService.questionTypes.matching.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({questionId: question.id, answerId: answer.id, data: null});
                            });
                            break;
                        case  helperService.questionTypes.shortAnswer.id:
                            resultItems.push({
                                questionId: question.id,
                                answerId: question.matchAnswerId,
                                data: question.result
                            });
                            break;
                        case  helperService.questionTypes.contrasting.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({questionId: question.id, answerId: answer.id, data: null});
                            });
                            break;
                        case  helperService.questionTypes.sentenceBuilder.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({questionId: question.id, answerId: answer.id, data: null});
                            });
                            break;
                        case  helperService.questionTypes.freeContrasting.id:
                            resultItems.push({questionId: question.id, answerId: null, data: null});
                            break;
                        case  helperService.questionTypes.sequencing.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({questionId: question.id, answerId: answer.id, data: null});
                            });
                            break;
                        case  helperService.questionTypes.grouping.id:
                            resultItems.push({questionId: question.id, answerId: null, data: null});
                            break;

                    }
                });

                // Record challenge result
                $http.post(authService.apiUrl + '/challenges/' + challenge.id + '/complete', {resultItems: resultItems})
                    .success(function () {
                        updateScore(challenge);
                        challenge.result = {
                            items: resultItems
                        };
                        $rootScope.showPointsAwardedNotification(challenge.points);
                        $scope.refreshDiscussion();
                        resolve();
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });

        };

        $scope.submit = function (e, challenge) {
            e.preventDefault();
            resetVal();
            $timeout(function () {
                // Is answer correct?
                if (validate(challenge)) {
                    // Record the result
                    recordResult(challenge)
                        .then(function () {
                            $scope.val.correct = true;
                            $scope.canContinue = true;
                            $rootScope.showPointsAwardedNotification(challenge.points);
                        });
                }
                else $scope.val.wrong = true;
            }, 0)
        };

        $scope.$on('navToNextChallenge', function (e, args) {
            nextChallenge(args[0]);
        });

        $scope.$on('navToPreviousChallenge', function (e, args) {
            previousChallenge(args[0]);
        });

        var nextChallenge = function (challenge) {
            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                $scope.close();
            } else {
                var next = $scope.challengeIndex + 1;
                challenge = (next <= $scope.quest.challenges.length - 1) ?
                    $scope.quest.challenges[next] : null;

                // Are we done with the quest?
                if (!challenge || challenge.type == 'finish') {
                    // Goto finish challenge!
                    controllerState.go('finish');
                }
                else {
                    // Goto next challenge!
                    controllerState.go('challenge', {
                        challengeIndex: next,
                        challenge: $scope.quest.challenges[next]
                    });
                }
            }
        };

        var previousChallenge = function (challenge) {
            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                $scope.close();
            } else {
                var next = $scope.challengeIndex - 1;
                challenge = (next < 0) ?
                    $scope.quest.challenges[next] : null;

                // Goto next challenge!
                controllerState.go('challenge', {
                    challengeIndex: next,
                    challenge: $scope.quest.challenges[next]
                });

            }
        };

        $scope.continue = function (challenge) {
            // Does challenge have any questions? Result was handled in submit.
            if (challenge.questions.length > 0) {
                return nextChallenge(challenge);
            } else {
                recordResult(challenge)
                    .then(function () {
                        nextChallenge(challenge);
                    });
            }
        };

        $scope.playerReady = function (media, api) {
            media.api = api;
        };
        $scope.playVideo = function (media) {
            if (!media.api) return;
            media.playing = true;
            media.api.play();
        };

        $scope.matchItemDrop = function (event, index, item, external, type, itemType, question) {
            question.selectedMatchItem = item;
            return item;
        };
        $scope.matchItemMoveUp = function (e, question, index, matchItem) {
            e.preventDefault();
            e.stopPropagation();
            if (index <= 0) return;

            // Remove from
            question.matchingItems.splice(index, 1);
            index--;
            question.matchingItems.splice(index, 0, matchItem);
            question.selectedMatchItem = matchItem;
        };
        $scope.matchItemMoveDown = function (e, question, index, matchItem) {
            e.preventDefault();
            e.stopPropagation();

            if (index >= question.matchingItems.length - 1) return;

            // Remove from
            question.matchingItems.splice(index, 1);
            index++;
            question.matchingItems.splice(index, 0, matchItem);
            question.selectedMatchItem = matchItem;
        };

        $scope.seqItemDrop = function (event, index, item, external, type, itemType, question) {
            question.selectedSeqItem = item;
            return item;
        };
        $scope.seqItemMoveUp = function (e, question, index, seqItem) {
            e.preventDefault();
            e.stopPropagation();
            if (index <= 0) return;

            // Remove from
            question.seqItems.splice(index, 1);
            index--;
            question.seqItems.splice(index, 0, seqItem);
            question.selectedSeqItem = seqItem;
        };
        $scope.seqItemMoveDown = function (e, question, index, seqItem) {
            e.preventDefault();
            e.stopPropagation();

            if (index >= question.seqItems.length - 1) return;

            // Remove from
            question.seqItems.splice(index, 1);
            index++;
            question.seqItems.splice(index, 0, seqItem);
            question.selectedSeqItem = seqItem;
        };

        $scope.groupResultItemDrop = function (event, index, item, answer) {
            answer.selectedResultItem = item;
            return item;
        };
        $scope.groupItemResultRemove = function (question, answer, index, item) {
            answer.resultItems.splice(index, 1);
            question.groupItems.push(item);
        };
        $scope.groupItemDrop = function (event, index, item, question) {
            question.selectedGroupItem = item;
            return item;
        };

        $scope.builderItemClick = function (e, question, index, item) {
            e.preventDefault();
            if (item.inResult) return;
            question.resultItems.push(item);
            item.inResult = true;

            question.result = null;
            angular.forEach(question.resultItems, function (item) {
                if (!question.result) question.result = item.answer;
                else question.result += ' ' + item.answer;
            });

        };

        $scope.builderClear = function (e, question) {
            e.preventDefault();
            question.result = null;
            question.resultItems = [];
            angular.forEach(question.items, function (item) {
                item.inResult = false;
            });
        };

        $scope.$on('bodyClick', function () {
            if (!$scope.challenge) return;

            angular.forEach($scope.challenge.questions, function (question) {
                if (question.type.id == helperService.questionTypes.matching.id) {
                    question.selectedMatchItem = null;
                }
                else if (question.type.id == helperService.questionTypes.sequencing.id) {
                    question.selectedSeqItem = null;
                }
                else if (question.type.id == helperService.questionTypes.grouping.id) {
                    question.selectedGroupItem = null;
                    angular.forEach(question.answers, function (answer) {
                        answer.selectedResultItem = null;
                    });
                }
            });
        });

    }]);

controllers.controller('QuestPlayerFinishController', ['$scope', '$q', '$http', '$timeout', '$upload', '$window', 'controllerState', 'authService', 'helperService',
    function ($scope, $q, $http, $timeout, $upload, $window, controllerState, authService, helperService) {
        $scope.challenge = null;
        $scope.badge = null;
        $scope.upload = {
            active: false,
            status: null,
            fade: false
        };

        var initState = function () {

            if ($scope.quest != null && $scope.quest.challenges != null && $scope.quest.challenges.length > 0) {
                var c = $scope.quest.challenges[$scope.quest.challenges.length - 1];
                if (c.type == 'finish') {
                    $scope.challenge = c;
                }
            }

            getAwardedBadges().then(function (badges) {
                if (badges.length > 0) {
                    $scope.badge = badges[0];
                }
            });

            $timeout(function () {
                $('#target-anchor a').attr('target', '_blank');
            });
        };

        controllerState
            .state('finish', {
                url: '/finish',
                onEnter: function (state, params) {
                    initState(state, params);
                }
            });

        var getAwardedBadges = function () {
            return $q(function (resolve, reject) {
                var url = authService.apiUrl + '/badges/award-badges';
                if ($scope.preview) url += '?preview=true';
                $http.post(url, {questId: $scope.quest.id})
                    .success(function (badges) {
                        resolve(badges);
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };

        var resetVal = function () {
            $scope.val = {
                upload: {
                    type: false,
                    size: false
                }
            }
        };
        resetVal();


        var fadeUploadStatus = function () {
            $timeout(function () {
                $scope.upload.fade = true;
                $timeout(function () {
                    $scope.upload.status = null;
                }, 1000);
            }, 4000);
        };
        $scope.uploadFile = function (files) {
            resetVal();
            $scope.upload.status = null;
            $scope.upload.fade = false;

            if (!files || files.length <= 0) return;
            var file = files[0];

            // Check type
            if (!helperService.validUploadFile(file.name)) {
                $scope.val.upload.type = true;
                return;
            }

            // Check size
            if (file.size > helperService.maxFileSize) {
                $scope.val.upload.size = true;
                return;
            }


            $scope.upload.active = true;
            $upload.upload({url: authService.apiUrl + '/ur', file: file})
                .success(function () {
                    $scope.upload.active = false;
                    $scope.upload.status = 'ok';
                    fadeUploadStatus();
                })
                .error(function () {
                    $scope.upload.active = false;
                    $scope.upload.status = 'err';
                    fadeUploadStatus();
                });
        };

    }]);

