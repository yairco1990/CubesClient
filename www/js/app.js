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
  'MyCubes.services.api',
  'MyCubes.services.push-notifications',
  'MyCubes.services.request-handler',

  //CONTROLLERS
  'MyCubes.controllers.rooms-page',
  'MyCubes.controllers.room-page',
  'MyCubes.controllers.login-page'
])

  .run(function ($ionicPlatform, $cubesApi) {
    $ionicPlatform.ready(function () {

      //var push = new Ionic.Push({
      //  "debug": true,
      //  "onNotification": function (payload) {
      //    $log.debug("PUSH SENT ", payload.text);
      //    $rootScope.$broadcast('pushSent', payload.text);
      //  },
      //  "onRegister": function (data) {
      //    $log.debug(data);
      //  }
      //});
      //
      //push.register(function (token) {
      //  $log.info("My Device token:", token.token);
      //  setToken(token.token);
      //  push.saveToken(token);  // persist the token in the Ionic Platform
      //});
      //
      ///**
      // * set the token in the db
      // * @param token
      // */
      //function setToken(token) {
      //  //set token for device
      //  $cubesApi.apiRequest({
      //    action: $cubesApi.apiActions.Cubes.SET_TOKEN,
      //    params: {
      //      userId: $myPlayer.getId(),
      //      webToken: token
      //    },
      //    onSuccess: function () {
      //      $log.info("successfully set token");
      //    },
      //    onError: function (response) {
      //      $log.error("failed to set token ", response);
      //    }
      //  });
      //}
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
        controller: 'LoginCtrl'
      })

      .state('rooms', {
        url: '/rooms',
        templateUrl: 'pages/rooms-page/rooms-page.html',
        controller: 'RoomsCtrl'
      })

      .state('room', {
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

  .factory('$myPlayer', function ($window) {

    var player = null;

    //check for user
    var localStoragePlayer = $window.localStorage.getItem('player');

    if (localStoragePlayer && isJson(localStoragePlayer)) {
      player = JSON.parse(localStoragePlayer);
    }

    function isJson(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    }

    return {
      //set player
      setPlayer: function (user) {
        player = user;
        $window.localStorage.setItem('player', JSON.stringify(user));
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

  .factory('mySocket', function (socketFactory) {

    var mySocket = {};

    mySocket = socketFactory({
      ioSocket: io.connect('192.168.1.107:3000')
    });

    return {
      getSocket: function () {
        return mySocket;
      }
    };
  })
;
