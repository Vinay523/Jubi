'use strict';

var module = angular.module('Jubi.controllers');

module.controller('SystemConfigurationController', ['$scope', '$http', '$q', '$timeout', '$modal', '$window', 'authService',
    function ($scope, $http, $q, $timeout, $modal, $window, authService) {
        $scope.isLoading = true;

        var load = function () {
            return $q(function (resolve, reject) {
                var url = authService.apiUrl + '/authoring/configurations';

                $http.get(url)
                    .success(function (response) {
                        $scope.configurations = response;

                        $scope.todoVerificationQuestions = _.filter($scope.configurations, function (config) {
                            return config.key == ('TODO-VERIFICATION-QUESTION').toUpperCase();
                        });

                        $scope.inspirationStationDescriptions = _.filter($scope.configurations, function (config) {
                            switch (config.key) {
                                case $scope.model.inspiration.encourageDescription.key:
                                    $scope.model.inspiration.encourageDescription.value = config.value;
                                    break;
                                case $scope.model.inspiration.appreciateDescription.key:
                                    $scope.model.inspiration.appreciateDescription.value = config.value;
                                    break;
                                case $scope.model.inspiration.storyDescription.key:
                                    $scope.model.inspiration.storyDescription.value = config.value;
                                    break;
                            }
                        });

                        $scope.isLoading = false;

                        resolve();
                    })
                    .error(reject);
            });
        };

        $scope.todoVerificationQuestionTemplate = {
            value: null,
            key: 'TODO-VERIFICATION-QUESTION'
        };

        $scope.model = {
            inspiration: {
                encourageDescription: {
                    key: 'INSPIRATION-ENCOURAGE-HELP-TEXT',
                    value: null
                },
                appreciateDescription: {
                    key: 'INSPIRATION-APPRECIATE-HELP-TEXT',
                    value: null
                },
                storyDescription: {
                    key: 'INSPIRATION-STORY-HELP-TEXT',
                    value: null
                }
            }
        };

        $scope.getInspireHelpTextConfigs = function () {
            var configs = [{
                key: $scope.model.inspiration.encourageDescription.key,
                value: $scope.model.inspiration.encourageDescription.value
            }, {
                key: $scope.model.inspiration.appreciateDescription.key,
                value: $scope.model.inspiration.appreciateDescription.value
            }, {
                key: $scope.model.inspiration.storyDescription.key,
                value: $scope.model.inspiration.storyDescription.value
            }];
            return configs;
        };

        $scope.addTodoVerificationQuestion = function () {
            $scope.todoVerificationQuestions.push(angular.copy($scope.todoVerificationQuestionTemplate));
        };

        $scope.removeVerification = function (verification) {
            $scope.todoVerificationQuestions = _.without($scope.todoVerificationQuestions, verification);
        };

        $scope.saveConfigurations = function () {
            $scope.configurations = [];
            $scope.configurations = $scope.configurations.concat($scope.todoVerificationQuestions);
            $scope.configurations = $scope.configurations.concat($scope.getInspireHelpTextConfigs());


            $scope.isLoading = true;
            return $http.post(authService.apiUrl + '/authoring/configurations', $scope.configurations)
                .success(function (client) {
                    $scope.isLoading = false;
                })
                .error(function (err) {
                    $scope.isLoading = false;
                });
        };

        load().then(function () {
            $timeout(function () {
                $scope.isLoading = false;
            }, 250);
        });
    }]);


