/**
 * Created by Yair on 10/11/2016.
 */
angular.module('MyCubes.controllers.room-page', [])

  .controller('RoomCtrl', RoomCtrl);

/**
 * room constructor
 * @param $stateParams
 * @param $state
 * @param $myPlayer
 * @param $log
 * @param $ionicPopup
 * @param $timeout
 * @param mySocket
 * @param requestHandler
 * @constructor
 */
function RoomCtrl($stateParams, $state, $myPlayer, $log, $ionicPopup, $timeout, mySocket, requestHandler) {

  var vm = this;

  vm.$stateParams = $stateParams;
  vm.$state = $state;
  vm.$myPlayer = $myPlayer;
  vm.$log = $log;
  vm.$ionicPopup = $ionicPopup;
  vm.$timeout = $timeout;
  vm.mySocket = mySocket;
  vm.requestHandler = requestHandler;

  vm.initController();
}

/**
 * init room
 */
RoomCtrl.prototype.initController = function () {

  var vm = this;

  vm.showUsersCubes = false;

  //in case that session end
  vm.mySocket.getSocket().on(pushCase.SESSION_ENDED, function () {
    vm.onRoundEnded();
  });

  //in case that some user gambled
  vm.mySocket.getSocket().on(pushCase.PLAYER_GAMBLED, function () {
    vm.getGame();
  });

  //in case of game over
  vm.mySocket.getSocket().on(pushCase.GAME_OVER, function () {
    vm.getGame();
  });

  vm.roomId = parseInt(vm.$stateParams.roomId);
  vm.pageTitle = vm.$stateParams.roomName;

  //TODO for debug only
  vm.showRefreshButton = false;

  vm.getGame();
};

/**
 * when round ended - show cubes and restart the game after X time
 */
RoomCtrl.prototype.onRoundEnded = function () {

  var vm = this;

  //show all users cubes
  vm.showUsersCubes = true;

  //set time out for cubes preview
  vm.$timeout(function () {
    vm.showUsersCubes = false;
    vm.users = null;
    vm.getGame();
  }, vm.room.numOfCubes * 700);
};

/**
 * get game details - users, room state and cubes.
 */
RoomCtrl.prototype.getGame = function () {

  var vm = this;

  //get the game request
  vm.requestHandler.createRequest({
    event: 'getGame',
    params: {
      roomId: vm.roomId
    },
    onSuccess: function (result) {
      vm.$log.debug("successfully get game", result);

      //check if the user already set
      if (vm.users == null) {
        vm.users = result.users;
      } else {
        for (var i = 0; i < vm.users.length; i++) {
          for (var j = 0; j < result.users.length; j++) {
            if (vm.users[i].id == result.users[j].id) {
              vm.users[i].gambleCube = result.users[j].gambleCube;
              vm.users[i].gambleTimes = result.users[j].gambleTimes;
              break;
            }
          }
        }
      }
      vm.room = result.room;

      angular.forEach(vm.users, function (user) {
        //check who is me
        if (user.id == vm.$myPlayer.getId()) {
          user.isMe = true;
          vm.myPlayer = user;
        } else {
          user.isMe = false;
        }

        //check who current user turn
        if (user.id == vm.room.currentUserTurnId) {
          user.currentUser = true;
        } else {
          user.currentUser = false;
        }

        //check who last user turn
        if (user.id == vm.room.lastUserTurnId) {
          user.lastUser = true;
        } else {
          user.lastUser = false;
        }
      });

      //check if i am the current turn
      if (vm.room.currentUserTurnId == vm.$myPlayer.getId()) {
        vm.isMyTurn = true;
      } else {
        vm.isMyTurn = false;
      }

      //set gambling to minimum
      vm.setGambleToMinimum();
    },
    onError: function (error) {
      vm.$log.error("failed to get game", error);
    }
  });

};

/**
 * send gamble
 */
RoomCtrl.prototype.setGamble = function (gambleTimes, gambleCube, isLying) {

  var vm = this;

  //send gamble request
  vm.requestHandler.createRequest({
    event: 'setGamble',
    params: {
      userId: vm.$myPlayer.getId(),
      roomId: vm.roomId,
      gambleTimes: gambleTimes,
      gambleCube: gambleCube,
      isLying: isLying
    },
    onSuccess: function (result) {

      vm.$log.debug("successfully sent gamble");
      if (isLying) {

        vm.showUsersCubes = true;
        if (result == "CORRECT_GAMBLE") {

          vm.showAlert("טעית!", "ההימור היה נכון...");
        } else {

          vm.showAlert("צדקת!", "הוא בלופר...");
        }
      }
    },
    onError: function (error) {

      vm.$log.error("failed to set gamble due to", error);
    }
  });
};

/**
 * return to rooms page
 */
RoomCtrl.prototype.returnToRooms = function () {

  var vm = this;

  vm.$state.go('rooms');
};

/**
 * show alert
 */
RoomCtrl.prototype.showAlert = function (title, template) {

  var vm = this;

  var alertPopup = vm.$ionicPopup.show({
    title: title,
    template: template
  });

  vm.$timeout(function () {
    alertPopup.close();
  }, 2000);
};

RoomCtrl.prototype.getGambleTimes = function () {
  var vm = this;

  if (vm.gambleTimes == null) {
    vm.gambleTimes = 1;
    return 1;
  }
  return vm.gambleTimes;
};
RoomCtrl.prototype.getGambleCube = function () {

  var vm = this;

  if (vm.gambleCube == null) {
    vm.gambleCube = 2;
    return 2;
  }
  return vm.gambleCube;
};

/**
 * set gamble to minimum option
 */
RoomCtrl.prototype.setGambleToMinimum = function () {

  var vm = this;

  var minimumGable = vm.getNextMinimumGamble();

  vm.gambleCube = minimumGable.gambleCube;
  vm.gambleTimes = minimumGable.gambleTimes;
};

/**
 * get the next minimum gamble that possible
 * @returns {*}
 */
RoomCtrl.prototype.getNextMinimumGamble = function () {
  var vm = this;

  var room = vm.room;

  //if there is no gamble yet
  if (room != null && room.lastGambleCube != null && room.lastGambleTimes != null) {
    //if the current gamble is 6, must to increase the times
    if (room.lastGambleCube == 6) {
      return {
        gambleTimes: room.lastGambleTimes + 1,
        gambleCube: 2 //min cube
      };
    }
    // if its not six
    return {
      gambleTimes: room.lastGambleTimes,
      gambleCube: room.lastGambleCube + 1
    };
  }
  return {
    gambleTimes: 1,
    gambleCube: 2
  };
};

RoomCtrl.prototype.getCubeImage = function (cubeNum) {
  var vm = this;

  return "img/cube-" + cubeNum + ".png";
};

RoomCtrl.prototype.isMe = function (user) {
  var vm = this;

  return user.id == vm.$myPlayer.getId();
};

/////////////////////////////////////////increase and decrease gambling details - works very good until 21/2/2017!/////////////////////////////////////////////////
RoomCtrl.prototype.canDecreaseCube = function () {
  var vm = this;

  //can decrease the cube number when the times of current gamble is higher than the selected
  //or the times is equals but the selected cube is higher than the current gamble cube
  return vm.gambleCube > 2 &&
    (vm.gambleTimes > vm.getNextMinimumGamble().gambleTimes ||
    (vm.gambleTimes == vm.getNextMinimumGamble().gambleTimes && vm.gambleCube > (vm.getNextMinimumGamble().gambleCube)));
};

RoomCtrl.prototype.canDecreaseTimes = function () {
  var vm = this;

  //when the gamble times is lower than the selected one
  return vm.gambleTimes > 1 && (vm.gambleTimes > vm.getNextMinimumGamble().gambleTimes);
};
RoomCtrl.prototype.increaseTimes = function () {
  var vm = this;

  vm.gambleTimes++;
};
RoomCtrl.prototype.decreaseTimes = function () {
  var vm = this;

  if (vm.gambleTimes > 1 && vm.canDecreaseTimes()) {
    vm.gambleTimes--;
    //if the cube is lower and the times become to be equlas - set to minimum
    if (vm.gambleTimes == vm.room.lastGambleTimes && vm.gambleCube <= vm.room.lastGambleCube) {
      vm.setGambleToMinimum();
    }
  }
};
RoomCtrl.prototype.increaseCube = function () {
  var vm = this;

  if (vm.gambleCube < 6) {
    vm.gambleCube++;
  }
};
RoomCtrl.prototype.decreaseCube = function () {
  var vm = this;

  if (vm.gambleCube > 2 && vm.canDecreaseCube()) {
    vm.gambleCube--;
  }
};

