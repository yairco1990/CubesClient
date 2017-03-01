/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.rooms-page', [])

  .controller('RoomsCtrl', function ($scope, $http, $state, $myPlayer, $window, $rootScope, $log, requestHandler) {

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

    $rootScope.getRooms = function () {
      getRooms();
    };

    /**
     * on room selected - go to room page
     * @param roomId
     */
    $scope.getIntoRoom = function (roomId, roomName) {

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

  });
