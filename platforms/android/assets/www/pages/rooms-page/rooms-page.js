/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.rooms-page', [])

  .controller('RoomsCtrl', function ($scope, $http, $state, $myPlayer, $window, $rootScope, $log, requestHandler, mySocket, $ionicPopup) {

    //in case of new room
    mySocket.getSocket().on(pushCase.NEW_ROOM_CREATED, function () {
      $log.debug("PUSH RECEIVED:", pushCase.NEW_ROOM_CREATED);
      // refresh rooms page
      getRooms();
    });

    function getRooms() {

      requestHandler.createRequest({
        event: 'getRooms',
        params: {},
        onSuccess: function (rooms) {
          $log.debug("successfully get rooms", rooms);

          $scope.rooms = rooms;
        },
        onError: function (error) {
          $log.error("failed to get rooms", error);
        }
      });
    }

    getRooms();

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
