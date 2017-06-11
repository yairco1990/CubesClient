/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.redirect-page', [])

    .controller('RedirectCtrl', function ($scope, $log, $window) {
        //https://play.google.com/store/apps/details?id=com.ionicframework.dicelies943218
        $scope.redirect = function() {
            window.open('https://play.google.com/store/apps/details?id=com.ionicframework.dicelies943218', '_system');
        }
    });

