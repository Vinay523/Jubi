var confirmModalControllerObj = {};
confirmModalControllerObj.confirmModalController = ['$scope', '$modalInstance', 'initData',
    function($scope, $modalInstance, initData){
        $scope.title = initData.title;
        $scope.text = initData.text;
        $scope.okLabel = initData.ok || 'OK';
        $scope.cancelLabel = initData.cancel || 'Cancel';
        $scope.ok = function () { $modalInstance.close(); };
        $scope.cancel = function () { $modalInstance.dismiss(); };
        $scope.keyDown = function (e) { if (e.keyCode == 13) $scope.ok(); };
    }];

var infoModalControllerObj = {};
infoModalControllerObj.infoModalController = ['$scope', '$modalInstance', 'initData',
    function($scope, $modalInstance, initData){
        $scope.title = initData.title;
        $scope.text = initData.text;
        $scope.okLabel = initData.ok || 'OK';
        $scope.ok = function () { $modalInstance.dismiss(); };
        $scope.keyDown = function (e) { if (e.keyCode == 13) $scope.ok(); };
    }];


var videoPlayerControllerObj = {};
videoPlayerControllerObj.videoPlayerController = ['$scope', '$modalInstance', 'video', 'initData',
    function($scope, $modalInstance, video, initData){

        var init = function() {
            var source = video.multiSource();
            angular.forEach(initData.encodings, function(encoding) {
                if (encoding == 'video/mp4') source.addSource('mp4', initData.url + '.mp4');
                else if (encoding == 'video/ogv') source.addSource('ogg', initData.url + '.ogv');
                else if (encoding == 'video/webm') source.addSource('webm', initData.url + '.webm');
            });
            source.save(true);
        };
        init();
        $scope.cancel = function () { $modalInstance.dismiss(); };
    }];

var youTubePlayerControllerObj = {};
youTubePlayerControllerObj.youTubePlayerController = ['$scope', '$modalInstance', '$sce', 'initData',
    function($scope, $modalInstance, $sce, initData){
        $scope.iframe = null;
        var init = function() {
            $scope.iframe = $sce.trustAsHtml(initData.iframe);
        };
        init();
        $scope.cancel = function () { $modalInstance.dismiss(); };
    }];


var levelModalErrorControllerObj = {};
levelModalErrorControllerObj.levelModalErrorController = ['$scope', '$modalInstance', 'initData',
    function ($scope, $modalInstance, initData) {
        $scope.title = initData.title;
        $scope.text = initData.text;
        $scope.okLabel = initData.ok || 'OK';
        $scope.ok = function () { $modalInstance.dismiss(); };
        $scope.keyDown = function (e) { if (e.keyCode == 13) $scope.ok(); };
    }];

var exportModalControllerObj = {};
exportModalControllerObj.exportModalController = ['$scope', '$modalInstance', 'initData',
    function ($scope, $modalInstance, initData) {
        $scope.title = initData.title;
        $scope.text = initData.text;
        $scope.okLabel = initData.ok || 'OK';
        $scope.customData = initData.customData;
        $scope.ok = function () { $modalInstance.dismiss(); };
        $scope.cancelModal = function () { $modalInstance.dismiss(); };
        $scope.keyDown = function (e) { if (e.keyCode == 13) $scope.ok(); };
    }];