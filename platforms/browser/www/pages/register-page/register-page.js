/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.register-page', [])

  .controller('RegisterCtrl', function ($scope, requestHandler, $http, $state, $ionicPopup, $myPlayer, $timeout, $log) {

    $log.debug("init register ctrl");

    //init player
    $scope.player = {};

    /**
     * register
     */
    $scope.register = function () {

      if ($scope.player.password == $scope.player.password2) {

        //validate name and password
        requestHandler.createRequest({
          event: 'register',
          params: {
            username: $scope.player.username,
            password: $scope.player.password
          },
          onSuccess: function (user) {
            $log.debug("successfully registered");

            //set the player to the service
            $myPlayer.setPlayer(user);

            //show success popup
            var alertPopup = $ionicPopup.show({
              title: 'Successfully registered!'
            });

            //close popup after 3 seconds and move to rooms
            $timeout(function () {
              alertPopup.close();
              $state.go('rooms', {reload: true});
            }, 500);
          },
          onError: function (error) {

            $log.error("failed to register", error);

            if(error == "ALREADY_EXIST") {
              //show success popup
              var alertPopup = $ionicPopup.alert({
                title: 'Failed to register',
                subTitle: 'User with this name already exist'
              });
              alertPopup.then(function (res) {
              });
            }
          }
        });
      }else{
        $log.error("passwords are not identical")
      }
    };

    /**
     * move to register page
     */
    $scope.moveToLogin = function(){
      $state.go('login');
    };

  });