/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.login-page', [])

  .controller('LoginCtrl', function ($scope, requestHandler, $http, $state, $ionicPopup, $myPlayer, $timeout, $log) {

    //init player
    $scope.player = {};

    /**
     * login
     */
    $scope.login = function () {

      requestHandler.createRequest({
        event: 'login',
        params: {
          name: $scope.player.name,
          password: $scope.player.password
        },
        onSuccess: function (user) {
          $log.debug("successfully logged in");

          //set the player to the service
          $myPlayer.setPlayer(user);

          //show success popup
          var alertPopup = $ionicPopup.show({
            title: 'התחברת בהצלחה!'
          });

          //close popup after 3 seconds and move to rooms
          $timeout(function () {
            alertPopup.close();
            $state.go('rooms');
          }, 500);
        },
        onError: function (error) {

          $log.error("failed to login", error);

          //show success popup
          var alertPopup = $ionicPopup.alert({
            title: 'שגיאה בהתחברות',
            subTitle: 'שם המשתמש שהזנת לא קיים'
          });
          alertPopup.then(function (res) {
          });
        }
      });
    };

  });
