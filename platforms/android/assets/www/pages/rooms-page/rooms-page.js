/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.rooms-page', [])

    .controller('RoomsCtrl', function ($scope, $http, $state, $myPlayer, $window, $rootScope, $log, requestHandler, $ionicPopup, $ionicPlatform) {

        $log.debug("init rooms ctrl");

        $rootScope.getRooms = function () {

            requestHandler.createRequest({
                event: 'getRooms',
                params: {},
                onSuccess: function (rooms) {

                    rooms.sort(function (a, b) {
                        var aUsers = a.users.length;
                        var bUsers = b.users.length;
                        if (aUsers > bUsers) return -1;
                        if (aUsers < bUsers) return 1;
                        return 0;
                    });

                    $log.debug("successfully get rooms", rooms);

                    $scope.rooms = rooms;

                    // Stop the ion-refresher from spinning
                    $scope.$broadcast('scroll.refreshComplete');

                    $scope.isLoaded = true;
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

                        $myPlayer.setRoomId(roomId);

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
            var roomPasswordPopup = $ionicPopup.show({
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
                                //don't allow the user to close unless he entered room password
                                e.preventDefault();
                            } else {
                                return $scope.data.password;
                            }
                        }
                    }
                ]
            });

            roomPasswordPopup.then(function (res) {
                if (res) {
                    if (res == roomPassword) {
                        $scope.getIntoRoom(roomId, roomName, roomPassword, true);
                    } else {
                        $ionicPopup.alert({
                            title: "Wrong password!"
                        });
                    }
                } else {
                    roomPasswordPopup.close();
                }
            });
        }

        //
        // //back button event function
        // var doCustomBack = function () {
        //     closeTheApp(false);
        // };
        //
        // function closeTheApp(force) {
        //     if (force) {
        //         ionic.Platform.exitApp(); // stops the app
        //         window.close();
        //     } else {
        //         $ionicPopup.alert({
        //             title: "Close the app?",
        //             buttons: [
        //                 {
        //                     text: 'Cancel'
        //                 },
        //                 {
        //                     text: 'Exit',
        //                     type: 'button-positive',
        //                     onTap: function (e) {
        //                         closeTheApp(true);
        //                     }
        //                 }
        //             ]
        //         }).then();
        //     }
        // }

        // registerBackButtonAction() returns a function which can be used to deregister it
        var deregisterHardBack = $ionicPlatform.registerBackButtonAction(
            doCustomBack, 101
        );

        $scope.$on('$destroy', function () {
            deregisterHardBack();
        });
    });
