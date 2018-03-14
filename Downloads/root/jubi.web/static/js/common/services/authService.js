var authServiceObj = {};
authServiceObj.authService = function($http, $timeout, $window, $modal) {

    var factory = {
        auth: false,
        user: null,
        apiUrl: null,
        apiKey: null,
        roleIds: {
            SystemAdmin: 1,
            ClientAdmin: 2,
            ClientAuthor: 3,
            ClientUser: 4
        }
    };

    factory.chageAvatar = function(avatarUrl){

        factory.user.avatarUrl = avatarUrl;
        factory.auth = (factory.user);

    };

    factory.refresh=function(user){
         $http.get('/refresh-session', {params: user});
    };

    factory.canManage = function() {
        if (!factory.user) return false;
        for (var i=0; i<factory.user.roles.length; i++) {
            if (factory.user.roles[i].id <= factory.roleIds.ClientAuthor) return true;
        }
        return false;
    };
    factory.canAdmin = function() {
        if (!factory.user) return false;
        for (var i=0; i<factory.user.roles.length; i++) {
            if (factory.user.roles[i].id <= factory.roleIds.ClientAdmin) return true;
        }
        return false;
    };
    factory.canSystemAdmin = function() {
        if (!factory.user) return false;
        for (var i=0; i<factory.user.roles.length; i++) {
            if (factory.user.roles[i].id <= factory.roleIds.SystemAdmin) return true;
        }
        return false;
    };


    var killSession = false;
    var timeSessionEnd = function() {
        killSession = true;
        $timeout(function() {
            if (killSession) $window.location = '/logout';
        }, 60*5*1000);
    };

    var timeSession = function() {
        // Start near session end timeout
        $timeout(function() {

            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Session Timeout',
                            text: 'You session is about to timeout and any unsaved work will be lost.',
                            ok: 'Continue Working', cancel: 'Ignore'
                        }
                    }
                }
            }).result.then(
                function() {
                    killSession = false;
                    $http.get('/touch-session');
                    timeSession();
                });

            timeSessionEnd();

        }, 60*55*1000);
    };

    factory.init = function(clientData) {
        factory.apiUrl = clientData.apiUrl;
        factory.user = clientData.user;
        factory.auth = (factory.user);

        if (factory.auth) {
            $http.defaults.headers.common['Authorization'] = factory.user.authHeader.Authorization;
            timeSession();
        }
    };
    factory.init(_jubi_clientData);

    return factory;
};

