/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.login-page', [])

  .controller('LoginCtrl', function ($scope, requestHandler, $http, $state, $cubesApi, $ionicPopup, $myPlayer, $timeout, $log, $window, $rootScope) {

    //init player
    $scope.player = {};

    //if user already exist - no need to login
    //if ($window.localStorage['userId'] != null && $window.localStorage['userName'] != null) {
    //  var player = {
    //    id: $window.localStorage['userId'],
    //    name: $window.localStorage['userName']
    //  };
    //  $myPlayer.setPlayer(player);
    //  $state.go('rooms');
    //}

    //init room
    //$scope.startGame = function () {
    //  $cubesApi.apiRequest({
    //    action: $cubesApi.apiActions.Cubes.INIT_ROOM,
    //    params: {
    //      roomId: 1
    //    },
    //    onSuccess: function () {
    //      $log.debug("successfully init room 1");
    //    },
    //    onError: function (response) {
    //      $log.error("failed to init room 1", response);
    //    }
    //  });
    //};

    //mySocket.getSocket().on('clientLogin', function (data) {
    //  $log.debug(data);
    //});

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
