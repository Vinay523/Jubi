var localStorageObj = {};

localStorageObj.localStorageService = function() {

    var convertForStorage = function(obj){
        return JSON.stringify(obj);
    };

    var restoreAsObj = function(obj){
        return JSON.parse(obj);
    };

    this.get = function(obj){
        return restoreAsObj(localStorage.getItem(obj));
    };

    this.set = function(name, obj){
        localStorage.setItem(name, convertForStorage(obj));
    };

    this.remove = function(obj){
        localStorage.removeItem(obj);
    };

    this.clear = function () {
        localStorage.clear();
    }

};