/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.rooms-page', [])

  .controller('RoomsCtrl', function ($scope, $http, $state, $myPlayer, $window, $rootScope, $log, requestHandler, $ionicPopup) {

    $log.debug("init rooms ctrl");

    $rootScope.getRooms = function() {

      requestHandler.createRequest({
        event: 'getRooms',
        params: {},
        onSuccess: function (rooms) {

          rooms.sort(function(a, b){
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
          });

          // rooms.sort(function(a, b){
          //   if(a.createdAt.valueOf() < b.createdAt.valueOf()) return 1;
          //   if(a.createdAt.valueOf() > b.createdAt.valueOf()) return -1;
          //   return 0;
          // });

          $log.debug("successfully get rooms", rooms);

          $scope.rooms = rooms;

          // Stop the ion-refresher from spinning
          $scope.$broadcast('scroll.refreshComplete');
        },
        onError: function (error) {
          $log.error("failed to get rooms", error);
        }
      });
    };

    $rootScope.getRooms();

    /**
     * on room selected - go to room page
     */
    $scope.getIntoRoom = function (roomId, roomName, roomPassword, force) {

      //if password is not null - new to enter password
      if (!force && roomPassword != null) {

        //show popup
        showPopup(roomId, roomName, roomPassword);

      } else {

        requestHandler.createRequest({
          event: 'enterRoom',
          params: {
            roomId: roomId,
            userId: $myPlayer.getId()
          },
          onSuccess: function () {
            $state.go('room', {
              roomId: roomId,
              roomName: roomName
            });
          },
          onError: function (error) {
            $log.error("failed to enter to room", error);
          }
        });
      }
    };

    /**
     * logout
     */
    $scope.logout = function () {
      var localStoragePlayer = $window.localStorage.removeItem('player');

      $myPlayer.setPlayerToNull();

      $state.go('login');
    };


    $scope.createRoom = function () {
      $state.go('create-room');
    };


    // Triggered on a button click, or some other target
    function showPopup(roomId, roomName, roomPassword) {
      $scope.data = {};

      // An elaborate, custom popup
      var myPopup = $ionicPopup.show({
        template: '<input type="password" ng-model="data.password">',
        title: 'Enter password',
        scope: $scope,
        buttons: [
          {text: 'Cancel'},
          {
            text: '<b>Ok</b>',
            type: 'button-positive',
            onTap: function (e) {
              if (!$scope.data.password) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();
              } else {
                return $scope.data.password;
              }
            }
          }
        ]
      });

      myPopup.then(function (res) {
        if (res == roomPassword) {
          $scope.getIntoRoom(roomId, roomName, roomPassword, true);
        } else {
          $ionicPopup.alert({
            title: "Wrong password!"
          });
        }
      });
    }
  });
