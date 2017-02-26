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
  'MyCubes.controllers.room-page',
  'MyCubes.controllers.login-page'
])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {

    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // Each tab has its own nav history stack:

      .state('login', {
        url: '/login',
        templateUrl: 'pages/login-page/login-page.html',
        controller: 'LoginCtrl',
        resolve: {
          pageData: function ($myPlayer, $state, $timeout, $log) {
            if ($myPlayer.getPlayer() != null) {
              $log.debug("there is a player - move to rooms state");
              $timeout(function(){
                $state.go('rooms');
              }, 0);
            }
          }
        }
      })

      .state('rooms', {
        url: '/rooms',
        templateUrl: 'pages/rooms-page/rooms-page.html',
        controller: 'RoomsCtrl'
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
      setSocketId(player.id);
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
    function setSocketId(userId) {
      requestHandler.createRequest({
        event: 'setSocketId',
        params: {
          userId: userId
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
      //set player
      setPlayer: function (user) {
        player = user;
        $window.localStorage.setItem('player', JSON.stringify(user));
        setSocketId(player.id);
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