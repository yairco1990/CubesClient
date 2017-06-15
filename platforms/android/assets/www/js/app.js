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
    'MyCubes.controllers.dashboard-page',
    'MyCubes.controllers.rules-page',
    'MyCubes.controllers.scores-page',
    'MyCubes.controllers.register-page'
])

    .run(function ($rootScope, $ionicPlatform, $myPlayer, $state) {
        $ionicPlatform.ready(function () {
            setTimeout(function () {
                if (navigator && navigator.splashscreen) {
                    navigator.splashscreen.hide();
                }
            }, 100);
        });

        $rootScope.$on('$stateChangeStart', function (event, toState) {

            if (toState.name === 'login' && $myPlayer.isLoggedIn()) {
                event.preventDefault();
                $state.go('dashboard');
            }

            if (!$myPlayer.isLoggedIn() && toState.name !== 'login' && toState.name !== 'register') {
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
                url: '/rooms',
                templateUrl: 'pages/rooms-page/rooms-page.html',
                controller: 'RoomsCtrl'
            })

            .state('dashboard', {
                cache: false,
                url: '/',
                templateUrl: 'pages/dashboard-page/dashboard-page.html',
                controller: 'DashboardCtrl as vm',
                resolve: {
                    dashboardPlayer: function ($myPlayer, requestHandler, $log, $state) {
                        return new Promise(function (resolve, reject) {
                            requestHandler.createRequest({
                                event: 'getUser',
                                params: {
                                    userId: $myPlayer.getPlayer().id
                                },
                                onSuccess: function (user) {
                                    resolve(user);
                                },
                                onError: function (error) {
                                    $log.error("failed to get user", error);

                                    //if failed to get user - logout and move to login
                                    $myPlayer.logout();
                                    $state.go('login');

                                    reject("failed to get user");
                                }
                            });
                        });
                    }
                }
            })

            .state('scores', {
                cache: false,
                url: '/scores',
                templateUrl: 'pages/scores-page/scores-page.html',
                controller: 'ScoresCtrl as vm',
                resolve: {
                    topUsers: function (requestHandler, $log, $state) {
                        return new Promise(function (resolve, reject) {
                            requestHandler.createRequest({
                                event: 'getScores',
                                params: {},
                                onSuccess: function (users) {
                                    resolve(users);
                                },
                                onError: function (error) {
                                    $log.error("failed to get top scorers", error);

                                    //on error - move to dashboard
                                    $state.go('dashboard');

                                    reject("failed to get top scorers");
                                }
                            });
                        });
                    }
                }
            })

            .state('rules', {
                url: '/rules',
                templateUrl: 'pages/rules-page/rules-page.html',
                controller: 'RulesCtrl as vm'
            })

            .state('create-room', {
                url: '/create-room',
                templateUrl: 'pages/rooms-page/create-room-page.html',
                controller: 'CreateRoomCtrl'
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

            logout: function () {
                player = null;
                $window.localStorage.removeItem('player');
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
            TEAMMATE2: {
                host: '192.168.43.233:3000'
            },
            PRODUCTION: {
                host: 'http://40.68.96.104:3000'
            }
        };//

        var selectedEnvironment = ENVIRONMENTS.TEAMMATE2;

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
