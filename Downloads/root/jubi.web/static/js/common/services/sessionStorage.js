var sessionStorageObj = {};

sessionStorageObj.sessionStorageService = function () {
    var factory = {
        convertForStorage: function (obj) {
            return JSON.stringify(obj);
        },
        restoreAsObj: function (obj) {
            return JSON.parse(obj);
        },
        get: function (obj) {
            return factory.restoreAsObj(sessionStorage.getItem(obj));
        },
        set: function (name, obj) {
            sessionStorage.setItem(name, factory.convertForStorage(obj));
        },
        remove: function (obj) {
            sessionStorage.removeItem(obj);
        },
        clear: function () {
            sessionStorage.clear();
        }
    };

    return factory;
};