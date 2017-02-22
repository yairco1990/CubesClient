/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.rooms-page', [])

  .controller('RoomsCtrl', function ($scope, $http, $state, $myPlayer, $window, $cubesApi, $rootScope, $log, requestHandler) {

    //if user already exist - no need to login
    //if ($window.localStorage['userId'] != null && $window.localStorage['userName'] != null) {
    //  var player = {
    //    id: $window.localStorage['userId'],
    //    name: $window.localStorage['userName']
    //  };
    //  $myPlayer.setPlayer(player);
    //}

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
     * @param roomId
     */
    $scope.getIntoRoom = function (roomId, roomName) {
      $state.go('room', {
        roomId: roomId,
        roomName: roomName
      });
    };

  });
