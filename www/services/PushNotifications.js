angular.module('MyCubes.services.push-notifications', [])

  .service('$pushNotifications', function ($rootScope, $cubesApi, $myPlayer) {

    var pushNotifications = this;

    pushNotifications.registerForPush = function () {
      var push = new Ionic.Push({
        "debug": true,
        "onNotification": function (payload) {
          $log.debug("PUSH SENT ", payload.text);
          $rootScope.$broadcast('pushSent', payload.text);
        },
        "onRegister": function (data) {
          $log.debug(data);
        }
      });

      push.register(function (token) {
        $log.debug("My Device token:", token.token);
        setToken(token.token);
        push.saveToken(token);  // persist the token in the Ionic Platform
      });

      /**
       * set the token in the db
       * @param token
       */
      function setToken(token) {
        //set token for device
        $cubesApi.apiRequest({
          action: $cubesApi.apiActions.Cubes.SET_TOKEN,
          params: {
            userId: $myPlayer.getId(),
            webToken: token
          },
          onSuccess: function () {
            $log.info("successfully set token");
          },
          onError: function (response) {
            $log.error("failed to set token ", response);
          }
        });
      }
    }
  }
);
