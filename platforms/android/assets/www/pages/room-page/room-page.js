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
  vm.messages = [];
  vm.unreadMessages = 0;

  //general update
  vm.mySocket.getSocket().on(pushCase.UPDATE_GAME, function () {
    vm.$log.debug("PUSH RECEIVED:", pushCase.UPDATE_GAME);
    vm.getGame();
  });

  //in case that session end
  vm.mySocket.getSocket().on(pushCase.SESSION_ENDED, function (data) {
    vm.$log.debug("PUSH RECEIVED:", pushCase.SESSION_ENDED);
    vm.onRoundEnded(data.users, data.endRoundResult, data.isUserLeft);
  });

  //in case that some user gambled
  vm.mySocket.getSocket().on(pushCase.PLAYER_GAMBLED, function () {
    vm.$log.debug("PUSH RECEIVED:", pushCase.PLAYER_GAMBLED);
    vm.getGame();
  });

  //in case of game over
  vm.mySocket.getSocket().on(pushCase.GAME_OVER, function (data) {
    vm.$log.debug("PUSH RECEIVED:", pushCase.GAME_OVER);
    // refresh game
    vm.onRoundEnded(data.users, data.endRoundResult, data.isUserLeft);
  });

  //in case of game restarted
  vm.mySocket.getSocket().on(pushCase.GAME_RESTARTED, function () {
    vm.$log.debug("PUSH RECEIVED:", pushCase.GAME_RESTARTED);
    // refresh game
    vm.getGame(true);
  });

  //in case of game restarted
  vm.mySocket.getSocket().on(pushCase.NEW_MESSAGE, function (message) {
    vm.$log.debug("PUSH RECEIVED:", pushCase.NEW_MESSAGE);

    //insert the new message
    vm.messages.push(message);
    if (!vm.chatOn) {
      vm.unreadMessages++;
    }

    //scroll to last message
    $('.chat-div').ready(function () {
      if ($('ul li').last().position()) {
        $('.chat-div').scrollTop($('ul li').last().position().top + $('ul li').last().height());
      }
    });
    //remove old messages
    // if (vm.messages.length > 10) {
    //   vm.messages.splice(0, 1);
    // }
  });

  vm.roomId = parseInt(vm.$stateParams.roomId);

  vm.showUserPanel = true;

  vm.pageTitle = vm.$stateParams.roomName;

  //TODO for debug only
  vm.showRestartButton = false;

  vm.getGame(true);
};

/**
 * when round ended - show cubes and restart the game after X time
 */
RoomCtrl.prototype.onRoundEnded = function (users, endRoundResult, isUserLeft) {

  var vm = this;
  debugger;
  //that's mean that now only one player(2 is before he quit) left in the room
  if (isUserLeft && users.length == 2) {
    vm.getGame();
    return;
  }

  vm.users = users;
  vm.endRoundResult = endRoundResult;

  vm.parseUsersObject(vm.users);

  //sort the user's cubes
  vm.users.forEach(function (user) {
    if (user.cubes) {
      user.cubes.sort(function (cube) {
        if (cube.cubeNum == 1 || cube.cubeNum == vm.room.lastGambleCube) {
          return -1;
        } else {
          return 1;
        }
      });
    }
  });

  //show all users cubes
  vm.showUsersCubes = true;

  //calc time of waiting
  var timeToWait = vm.room.numOfCubes * 1000;
  timeToWait = timeToWait < 6000 || isUserLeft ? 6000 : timeToWait;

  if (isUserLeft) {
    //update user left
    //show success popup
    var alertPopup = vm.$ionicPopup.show({
      title: 'Player left the room. Restart the round.'
    });

    //close popup after 3 seconds
    vm.$timeout(function () {
      alertPopup.close();
    }, 4000);

    timeToWait = 5000;
  }

  //set time out for cubes preview
  vm.$timeout(function () {
    vm.getGame(true);
  }, timeToWait);
};

/**
 * get game details - users, room state and cubes.
 */
RoomCtrl.prototype.getGame = function (isStartOfRound) {

  var vm = this;

  //get the game request
  vm.requestHandler.createRequest({
    event: 'getGame',
    params: {
      roomId: vm.roomId,
      userId: vm.$myPlayer.getId()
    },
    onSuccess: function (result) {
      vm.$log.debug("successfully get game", result);

      vm.showUsersCubes = false;
      vm.users = result.users;
      vm.room = result.room;

      if (isStartOfRound) {
        vm.startRoundUserId = vm.room.currentUserTurnId;
      }

      vm.parseUsersObject(vm.users);

      //set page name
      vm.pageTitle = vm.room.name;

      //check if i am the current turn
      vm.isMyTurn = vm.room.currentUserTurnId == vm.$myPlayer.getId();

      //set gambling to minimum
      vm.setGambleToMinimum();

      vm.showUserPanel = true;

      vm.endRoundResult = null;
    },
    onError: function (error) {
      vm.$log.error("failed to get game", error);
    }
  });

};

/**
 * parse user object
 */
RoomCtrl.prototype.parseUsersObject = function (users) {

  var vm = this;

  //sort the users
  users = vm.sortUsers(users, vm.startRoundUserId);

  angular.forEach(users, function (user) {
    //check who is me
    if (user.id == vm.$myPlayer.getId()) {
      user.isMe = true;
      vm.myPlayer = user;
    } else {
      user.isMe = false;
    }

    //check who current user turn
    user.currentUser = user.id == vm.room.currentUserTurnId;

    //check who last user turn
    user.lastUser = user.id == vm.room.lastUserTurnId;
  });
};

/**
 * sort users
 * @param users
 * @param currentUsrTurnId
 */
RoomCtrl.prototype.sortUsers = function (users, currentUsrTurnId) {

  var newUsersList = [];
  var key = 1;

  //get start user
  var currentUser = MyUtils.getUserById(users, currentUsrTurnId);

  //until everybody is in the list
  while (!MyUtils.isInTheList(newUsersList, currentUser)) {
    currentUser.key = key++;

    newUsersList.push(currentUser);

    currentUser = MyUtils.getUserById(users, currentUser.nextUserTurnId);
  }

  //insert the off players
  users.forEach(function (user) {
    if (!user.isLoggedIn) {
      user.key = key++;
      newUsersList.push(user);
    }
  });

  return newUsersList;
};

/**
 * send gamble
 */
RoomCtrl.prototype.setGamble = function (gambleTimes, gambleCube, isLying) {

  var vm = this;

  vm.showUserPanel = false;

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

        if (result == "CORRECT_GAMBLE") {

          vm.showAlert("You wrong!", "The gamble was correct!", "red");
        } else {

          vm.showAlert("You right!", "He is a bluffer!", "green");
        }
      }
    },
    onError: function (error) {
      vm.showUserPanel = true;

      vm.$log.error("failed to set gamble due to", error);
    }
  });
};

/**
 * return to rooms page
 */
RoomCtrl.prototype.returnToRooms = function () {

  var vm = this;

  vm.requestHandler.createRequest({
    event: 'logout',
    onSuccess: function () {
      vm.$log.debug("game restarted successfully");

      //remove socket listeners
      vm.mySocket.getSocket().removeAllListeners();

    },
    onError: function () {
      vm.$log.debug("failed to restart the game");
    }
  });

  vm.$state.go('rooms');
};

/**
 * restart room
 */
RoomCtrl.prototype.restartGame = function () {
  var vm = this;

  //get the game request
  vm.requestHandler.createRequest({
    event: 'restartGame',
    params: {
      roomId: vm.roomId,
      userId: vm.$myPlayer.getId()
    },
    onSuccess: function () {
      vm.$log.debug("game restarted successfully");
    },
    onError: function () {
      vm.$log.debug("failed to restart the game");
    }
  });
};

RoomCtrl.prototype.sendMessage = function () {
  var vm = this;

  if (vm.messageContent) {
    //get the game request
    vm.requestHandler.createRequest({
      event: 'sendMessage',
      params: {
        userId: vm.$myPlayer.getId(),
        content: vm.messageContent
      },
      onSuccess: function () {
        vm.messageContent = "";
        vm.$log.debug("message successfully sent");
      },
      onError: function () {
        vm.$log.debug("failed to send message");
      }
    });
  }
};

/**
 * send socket id
 */
RoomCtrl.prototype.sendSocketId = function () {
  var vm = this;

  vm.$myPlayer.sendSocketId();

  vm.getGame();
};

/**
 * show alert
 */
RoomCtrl.prototype.showAlert = function (title, description, color) {

  var vm = this;

  var alertPopup = vm.$ionicPopup.show({
    title: title,
    template: "<style>.popup-head { background-color:" + color + " !important; }</style><p>" + description + "<p/>"
  });

  vm.$timeout(function () {
    alertPopup.close();
  }, 2500);
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

RoomCtrl.prototype.getMessageText = function (message) {

  var vm = this;

  var classes = "";
  if (message.userId == vm.$myPlayer.getId()) {
    classes = "message-its-me"
  }

  var text = "<label class='message-sender " + classes + "'>" + message.name + "</label>:" + "<label class='message-content'>&nbsp" + message.content + "</label>";

  return text;
};

RoomCtrl.prototype.getEndRoundTextResult = function () {
  var vm = this;

  var text = "";

  if (vm.endRoundResult) {
    var isRightText = vm.endRoundResult.isRight ? " WON!" : "LOST!";
    var isRightClass = vm.endRoundResult.isRight ? 'gamble-summarize-right' : 'gamble-summarize-wrong';

    text = "<label class='gamble-summarize-name'>" + vm.endRoundResult.sayLying + "</label> gambled that " + "<p class='gamble-summarize'>" + vm.endRoundResult.gambleTimes +
      " times of " + vm.endRoundResult.gambleCube + "</p>" + " it's a bluff and he " + "<label class='" + isRightClass + "'>" + isRightText + "</label>";
  }

  return text;
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


RoomCtrl.prototype.setChatStatus = function (isOn) {
  var vm = this;

  vm.chatOn = isOn;

  if (isOn) {
    vm.unreadMessages = 0;

    //scroll to last message
    $('.chat-div').ready(function () {
      if ($('ul li').last().position()) {
        $('.chat-div').scrollTop($('ul li').last().position().top + $('ul li').last().height());
      }
    });
  }
};

