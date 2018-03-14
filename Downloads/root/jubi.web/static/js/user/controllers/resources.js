module.controller('ResourcesController', ['$scope', '$q', '$http', '$window', 'authService', '$modal', 'helperService', '$timeout', '$rootScope', '$sce', 'ngAudio',
    function ($scope, $q, $http, $window, authService, $modal, helperService, $timeout, $rootScope, $sce, ngAudio) {
        $scope.isLoading = true;
        $scope.maxTileHeight = 0;
        this.init = function (slug) {
            $scope.slug = slug;
            $scope.userId = authService.user.id;
            load();
        };

        $scope.ui = {
            quests: null,
            mediaTypes: [
                { label: 'Audio', id: 'audio' },
                { label: 'Video', id: 'video' },
                { label: 'Document', id: 'resource' },
                { label: 'Link', id: 'link' },
                { label: 'Image', id: 'image' }
            ],
            filters: {
                quests: [],
                mediaTypes: [],
                search: null
            }
        };

        $scope.allProgramMedia = [];

        $scope.filtered = function (item) {
           
            //$scope.filteredMedia = (
            //    ($scope.ui.filters.quests.length == 0 || _.findWhere($scope.ui.filters.quests, { id: item.questId }) != null)
            //    && ($scope.ui.filters.mediaTypes.length == 0 || _.findWhere($scope.ui.filters.mediaTypes, { id: item.type }) != null)
            //    && (!$scope.ui.filters.search || ((!item.name && !item.url && !item.link) || (item.name + ' ' + item.url + ' ' + item.link).toUpperCase().indexOf($scope.ui.filters.search.toUpperCase()) != -1))
            //);
            //alert (item);
                return (
                    ($scope.ui.filters.quests.length == 0 || _.findWhere($scope.ui.filters.quests, { id: item.questId }) != null)
                    && ($scope.ui.filters.mediaTypes.length == 0 || _.findWhere($scope.ui.filters.mediaTypes, { id: item.type }) != null)
                    && (!$scope.ui.filters.search || ((!item.name && !item.url && !item.link) || (item.name + ' ' + item.url + ' ' + item.link).toUpperCase().indexOf($scope.ui.filters.search.toUpperCase()) != -1))
           )
                 

        };


      
      
   
  

        $scope.isUrl = function (input) {
            if (!input) return false;
            var upperInput = input.toUpperCase();
            return upperInput.indexOf('HTTP') != -1 || upperInput.indexOf('WWW') != -1;
        };

        $scope.getHeightStyle = function () {
            if ($scope.tileHeight) {
                return {
                    "height": $scope.tileHeight + 'px',
                    "overflow-y": 'auto'
                };
            } else {
                return {"height": 'auto'};
            }
        };

        $scope.getHeightStyleDividedBy = function (num) {
            if ($scope.tileHeight) {
                return {
                    'max-height': $scope.tileHeight / Number(num) + 'px',
                    'margin-left': 'auto',
                    'margin-right': 'auto',
                    'height': '100%'
                    //'width':'100%'
                }
            } else {
                return null;
            }
        };


        $scope.setTileHeight = function (width) {
            $scope.tileHeight = Number(width) * 1.2;
        };

        var load = function () {
            var url = authService.apiUrl + '/programs/' + $scope.slug + '/user-by-progress';
            $scope.previewRet = helperService.getQueryValue('previewRet');
            $scope.previewRetHash = helperService.getQueryValue('previewRetHash');
            $scope.preview = helperService.getQueryValue('preview');
            if ($scope.preview) url += '?preview=yes';

            $http.get(url)
                .success(function (program) {
                    $scope.programWithResources = program;
                    if ($scope.programWithResources) {
                        $scope.getAllProgramMedia();
                    }
                    $scope.hideLoading();
                });
        };



        $scope.getAllProgramMedia = function () {

            $scope.allProgramMedia = [];
            _.each($scope.programWithResources.levels, function (level) {
                _.each(level.quests, function (quest) {
                    //$scope.allProgramMedia.push(quest);
                    _.each(quest.challenges, function (challenge) {
                        _.each(challenge.media, function (media) {
                            var lmed = {};
                            var lmed = {
                                questId: quest.id,
                                challengeid: media.challengeid,
                                coverurl: media.coverurl,
                                createdat: media.createdat,
                                data: media.data,
                                description: media.description,
                                id: media.id,
                                name: media.name,
                                questid: media.questid,
                                ref: media.ref,
                                sequence: media.sequence,
                                source: media.source,
                                sourcedate: media.sourcedate,
                                status: media.status,
                                type: media.type,
                                updatedat: media.updatedat,
                                text: media.text ? media.text : null,
                                link: media.link ? media.link : null,
                                url: media.url ? media.url : null,
                                challTitle: challenge.title,
                                questTitle: quest.title,
                                iframe: media.iframe,
                                encodings: []
                            };
                            $scope.checkEncoding(lmed);
                            $scope.allProgramMedia.push(lmed);
                        });
                    });
                });
            });

            _.each($scope.programWithResources.quests, function (quest) {
                //$scope.allProgramMedia.push(quest);
                _.each(quest.challenges, function (challenge) {
                    _.each(challenge.media, function (media) {
                        var qmed = {};
                        var qmed = {
                            questId: quest.id,
                            challengeid: media.challengeid,
                            coverurl: media.coverurl,
                            createdat: media.createdat,
                            data: media.data,
                            description: media.description,
                            id: media.id,
                            name: media.name,
                            questid: media.questid,
                            ref: media.ref,
                            sequence: media.sequence,
                            source: media.source,
                            sourcedate: media.sourcedate,
                            status: media.status,
                            type: media.type,
                            updatedat: media.updatedat,
                            text: media.text ? media.text : null,
                            link: media.link ? media.link : null,
                            url: media.url ? media.url : null,
                            challTitle: challenge.title,
                            questTitle: quest.title,
                            iframe: media.iframe,
                            encodings: []
                        };
                        $scope.checkEncoding(qmed);
                        $scope.allProgramMedia.push(qmed);
                    });
                });
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

        $scope.hasMedia = function () {
            var hasMedia = false;
            var currentQuests = [];
            if ($scope.programWithResources) {
                var handleQuest = function (quest) {
                    if (!$scope.ui.quests && !_.findWhere(currentQuests, {id: quest.id})) {
                        currentQuests.push(quest);
                    }
                    _.each(quest.challenges, function (challenge) {
                        _.each(challenge.media, function (media) {
                            if (media.type != 'text' && (media.type != 'link' || (media.type == 'link' && !media.url))) {
                                hasMedia = true;

                                if (media.source == 'system' && !media.encodingsChecked) {
                                    media.encodingsChecked = true;
                                    $scope.checkEncoding(media);
                                }
                            }
                        });
                    });
                };
                _.each($scope.programWithResources.levels, function (level) {
                    _.each(level.quests, function (quest) {
                        handleQuest(quest);
                    });
                });
                _.each($scope.programWithResources.quests, function (quest) {
                    handleQuest(quest);
                });

                if (!$scope.ui.quests) {
                    $scope.ui.quests = currentQuests;
                }
            }

            return hasMedia;
        };

        $scope.showLoading = function () {
            $scope.isLoading = true;
        };

        $scope.hideLoading = function () {
            $scope.isLoading = false;
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

        $rootScope.$on('audioEnd', function (e, args) {
            var handleQuest = function (quest) {
                _.each(quest.challenges, function (challenge) {
                    _.each(challenge.media, function (media) {
                        if (media.type == 'audio') {
                            if (media.audio == args) {
                                media.isPlaying = false;
                            }
                        }
                    });
                });
            };

            _.each($scope.programWithResources.levels, function (level) {
                _.each(level.quests, function (quest) {
                    handleQuest(quest);
                });
            });
            _.each($scope.programWithResources.quests, function (quest) {
                handleQuest(quest);
            });

        });

        $scope.stopAllAudio = function (except) {
            var handleQuest = function (quest) {
                _.each(quest.challenges, function (challenge) {
                    _.each(challenge.media, function (media) {
                        if (media.type == 'audio' && media != except) {
                            media.isPlaying = false;

                            if(media.audio){
                                media.audio.stop();
                            }
                        }
                    });
                });
            };

            _.each($scope.programWithResources.levels, function (level) {
                _.each(level.quests, function (quest) {
                    handleQuest(quest);
                });
            });
            _.each($scope.programWithResources.quests, function (quest) {
                handleQuest(quest);
            });
        };

        $scope.playPauseAudio = function (media) {
            $scope.stopAllAudio(media);
            if (!media.audio) {
                media.audio = ngAudio.load(media.url);
                media.audio.play();
                media.isPlaying = true;
                return;
            }
            if (media.audio.paused) {
                media.audio.play();
                media.isPlaying = true;
            } else {
                media.audio.pause();
                media.isPlaying = false;
            }
        };

    }
]);