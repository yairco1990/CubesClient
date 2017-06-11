// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', [
    'ionic', 'ionic.service.core',
    'ui.router',
    'luegg.directives',

    //BOWER
    'ionic-numberpicker',
    'btford.socket-io',

    //SERVICES
    'MyCubes.services.request-handler',

    // DIRECTIVES
    'MyCubes.directives.loader',
    'MyCubes.directives.input',

    //CONTROLLERS
    'MyCubes.controllers.rooms-page',
    'MyCubes.controllers.create-room-page',
    'MyCubes.controllers.room-page',
    'MyCubes.controllers.login-page',
    'MyCubes.controllers.register-page',
    'MyCubes.controllers.redirect-page'
])

    .run(function ($rootScope, $ionicPlatform, $myPlayer, $state) {
        $ionicPlatform.ready(function () {
            setTimeout(function() {
                if(navigator && navigator.splashscreen) {
                    navigator.splashscreen.hide();
                }
            }, 100);
        });

        /**
         * get mobile operating system
         * @returns {*}
         */
        function getMobileOperatingSystem() {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;

            // Windows Phone must come first because its UA also contains "Android"
            if (/windows phone/i.test(userAgent)) {
                return "Windows Phone";
            }

            if (/android/i.test(userAgent)) {
                return "Android";
            }

            // iOS detection from: http://stackoverflow.com/a/9039885/177710
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                return "iOS";
            }

            return "unknown";
        }

        /**
         * on status changed handler
         */
        $rootScope.$on('$stateChangeStart', function(event, toState){

            if(getMobileOperatingSystem() === "Android" && toState.name !== 'redirect'){
                event.preventDefault();
                $state.go('redirect');
                return;
            }

            //if user logon - and try to reach login page - move to rooms
            if(toState.name === 'login' && $myPlayer.isLoggedIn()){
                event.preventDefault();
                $state.go('rooms');
            }

            //if user is not login and try to reach other page than login or register - move to login
            if(!$myPlayer.isLoggedIn() && toState.name !== 'login' && toState.name !== 'register' && toState.name !== 'redirect'){
                event.preventDefault();
                $state.go('login');
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            .state('login', {
                url: '/login',
                templateUrl: 'pages/login-page/login-page.html',
                controller: 'LoginCtrl'
            })

            .state('register', {
                url: '/register',
                templateUrl: 'pages/register-page/register-page.html',
                controller: 'RegisterCtrl'
            })

            .state('rooms', {
                cache: false,
                url: '/',
                templateUrl: 'pages/rooms-page/rooms-page.html',
                controller: 'RoomsCtrl'
            })

            .state('create-room', {
                url: '/create-room',
                templateUrl: 'pages/rooms-page/create-room-page.html',
                controller: 'CreateRoomCtrl'
            })

            .state('redirect', {
                url: '/redirect',
                templateUrl: 'pages/redirect-page/redirect-page.html',
                controller: 'RedirectCtrl'
            })

            .state('room', {
                cache: false,
                url: '/room/:roomId:roomName',
                templateUrl: 'pages/room-page/room-page.html',
                controller: 'RoomCtrl as vm'
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/login');

    })

    .factory('$myPlayer', function ($window, requestHandler, $log, mySocket, $rootScope) {

        var player = null;

        //check for user in local storage
        var localStoragePlayer = $window.localStorage.getItem('player');
        if (localStoragePlayer && isJson(localStoragePlayer)) {
            player = JSON.parse(localStoragePlayer);
            setSocketDetails();
        }

        //is json function
        function isJson(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        //set socket id for user
        function setSocketDetails() {

            if (player && player.roomId) {
                requestHandler.createRequest({
                    event: 'setSocketDetails',
                    params: {
                        roomId: player.roomId,
                        userId: player.userId
                    },
                    onSuccess: function () {
                        $log.warn("successfully set socket details");
                    },
                    onError: function (error) {
                        $log.error("failed to set socket details");
                    }
                });
            }
        }

        return {

            setSocketDetails: function () {
                setSocketDetails();
            },

            setRoomId: function (roomId) {
                player.roomId = roomId;
                $window.localStorage.setItem('player', JSON.stringify(player));

                //register the user for room notifications
                setSocketDetails();
            },

            //set player
            setPlayer: function (user) {
                player = user;
                $window.localStorage.setItem('player', JSON.stringify(user));
            },

            //set player to null
            setPlayerToNull: function () {
                player = null;
            },

            //get player
            getPlayer: function () {
                return player;
            },

            //get the player id
            getId: function () {
                if (player == null) {
                    return null;
                }
                return player.id;
            },

            isLoggedIn: function () {
                return player != null;
            },

            removeSocketEvents: function () {
                //remove socket listeners
                mySocket.getSocket().removeAllListeners();

                // setReconnectSocketEvent();
            }
        };
    })

    .factory('mySocket', function (socketFactory, $log) {

        var mySocket = {};

        var ENVIRONMENTS = {
            LOCAL: {
                host: 'localhost:3000'
            },
            TEAMMATE: {
                host: '192.168.1.105:3000'
            },
            PRODUCTION: {
                host: 'http://40.68.96.104:3000'
            }
        };

        var selectedEnvironment = ENVIRONMENTS.PRODUCTION;

        $log.debug("environment host selected = ", selectedEnvironment.host);

        mySocket = socketFactory({
            ioSocket: io.connect(selectedEnvironment.host)
        });

        return {
            getSocket: function () {
                return mySocket;
            }
        };
    })
;
