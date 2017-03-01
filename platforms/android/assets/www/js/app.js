// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', [
  'ionic', 'ionic.service.core',
  'ui.router',

  //BOWER
  'ionic-numberpicker',
  'btford.socket-io',

  //SERVICES
  'MyCubes.services.request-handler',

  //CONTROLLERS
  'MyCubes.controllers.rooms-page',
  'MyCubes.controllers.create-room-page',
  'MyCubes.controllers.room-page',
  'MyCubes.controllers.login-page',
  'MyCubes.controllers.register-page'
])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {

    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {

    var validPageFunction = function ($myPlayer, $state, $timeout, $log) {
      if ($myPlayer.getPlayer() != null) {
        $log.debug("there is a player - move to rooms state");
        $timeout(function () {
          $state.go('rooms');
        }, 0);
      }
    };

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('login', {
        url: '/login',
        templateUrl: 'pages/login-page/login-page.html',
        controller: 'LoginCtrl',
        resolve: {
          pageData: validPageFunction
        }
      })

      .state('register', {
        url: '/register',
        templateUrl: 'pages/register-page/register-page.html',
        controller: 'RegisterCtrl',
        resolve: {
          pageData: validPageFunction
        }
      })

      .state('rooms', {
        url: '/rooms',
        templateUrl: 'pages/rooms-page/rooms-page.html',
        controller: 'RoomsCtrl'
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
        controller: 'RoomCtrl as vm',
        resolve: {
          pageData: function ($myPlayer, $state) {
            if ($myPlayer.getPlayer() == null) {
              $state.go('login');
            }
          }
        }
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

  })

  .factory('$myPlayer', function ($window, requestHandler, $log) {

    var player = null;

    //check for user
    var localStoragePlayer = $window.localStorage.getItem('player');

    if (localStoragePlayer && isJson(localStoragePlayer)) {
      player = JSON.parse(localStoragePlayer);
      setSocketId();
    }

    function isJson(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    }

    //set socket id for user
    function setSocketId() {
      requestHandler.createRequest({
        event: 'setSocketId',
        params: {
          userId: player.id
        },
        onSuccess: function () {
          $log.debug("successfully set socketId for user");
        },
        onError: function (error) {
          $log.debug("failed to set socketId for user");
        }
      });
    }

    return {

      sendSocketId: function () {
        setSocketId();
      },

      //set player
      setPlayer: function (user) {
        player = user;
        $window.localStorage.setItem('player', JSON.stringify(user));
        setSocketId();
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
      }
    };


  })

  .factory('mySocket', function (socketFactory, $log) {

    var mySocket = {};

    var ENVIRONMENTS = {
      LOCAL: {
        host: 'localhost:3000'
      },
      DEVELOPMENT: {
        host: 'https://dice-lies.herokuapp.com/'
      }
    };

    var selectedEnvironment = ENVIRONMENTS.DEVELOPMENT;

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
