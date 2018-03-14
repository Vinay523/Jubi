module.controller('TodoManagementController', ['$scope', '$q', '$http', '$window', 'authService', '$modal', 'helperService', '$timeout', '$rootScope', '$sce',
    function ($scope, $q, $http, $window, authService, $modal, helperService, $timeout, $rootScope,$sce) {
        $scope.isLoading = true;
        $scope.ui = {
            selectedTodoStatusFilter: null
        };

        $rootScope.$on('userTodoUpdated', function (e, data) {
            var oldUserTodo = _.findWhere($scope.todosModel.userTodos, {id: data.oldUserTodo.id});
            if(oldUserTodo) {
                $scope.todosModel.userTodos.splice($scope.todosModel.userTodos.indexOf(oldUserTodo), 1, data.newUserTodo);
            }
        });

        $scope.$watch(function () {
            return $scope.todosModel.userTodos;
        }, function () {
            if (!$scope.todosModel.userTodos) return;
            $timeout(function(){
                $scope.hideLoading();
            })
        });

        this.init = function (slug) {
            $scope.slug = slug;
            $scope.userId = authService.user.id;
        };

        $scope.clickTodo = function (todo) {
            $rootScope.setSelectedTodo(todo, true);
        };

        $scope.showLoading = function () {
            $scope.isLoading = true;
        };

        $scope.hideLoading = function () {
            $scope.isLoading = false;
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

        $scope.getStatusStringForUserTodo = function (userTodo) {
            if(userTodo.hasBeenCompleted && userTodo.status != 'completed'){
                return 'New Post'
            }
            switch (userTodo.status) {
                case 'submitted':
                    return 'Pending Verification';
                    break;
                case 'verified':
                    return 'Awaiting Response';
                    break;
                case 'completed':
                    return (userTodo.todo.validate ? 'Verified' : 'Honor System');
                    break;
            }
        };

        $scope.todoStatuses = [];
        $scope.todoStatusesObj = helperService.todoStatuses;
        for (var property in  $scope.todoStatusesObj) {
            if (property != 'locked' && property != 'unlocked') {
                $scope.todoStatuses.push({
                    status: property,
                    label: $scope.getStatusStringForUserTodo({status: property, todo: {validate: true}})
                });
            }
        }
        $scope.todoStatuses.push({
            status: 'Honor System',
            label: $scope.getStatusStringForUserTodo({status: property, todo: {validate: false}})
        });

        $scope.countTodosByStatus = function (status) {
            return _.filter($scope.todosModel.userTodos, function (userTodo) {
                if (status == 'Honor System') {
                    if (!userTodo.todo.validate) {
                        return true;
                    }
                }else if(status == 'completed'){
                    if (userTodo.todo.validate && userTodo.status == status) {
                        return true;
                    }
                }else if(userTodo.status == status){
                    return true;
                }
            }).length;
        };

        $scope.userTodosFilter = function (userTodo) {
            if (!$scope.ui.selectedTodoStatusFilter) {
                return $scope.todosModel.userTodos;
            } else {
                if ($scope.ui.selectedTodoStatusFilter == 'Honor System') {
                    if (!userTodo.todo.validate) {
                        return true;
                    }
                }else if($scope.ui.selectedTodoStatusFilter == 'completed'){
                    if (userTodo.todo.validate && userTodo.status == $scope.ui.selectedTodoStatusFilter) {
                        return true;
                    }
                }else if(userTodo.status == $scope.ui.selectedTodoStatusFilter){
                    return true;
                }
            }
        };

        $scope.playerReady = function (media, api) {
            media.api = api;

        };
    }
]);