/**
 * Created by Asus on 22/04/2015.
 */

// hebrew dates
//moment.locale('he');

/**
 * check if parameter is undefined of null
 * @param val
 * @returns {boolean|*}
 */
function isNull(val) {
  return angular.isUndefined(val) || val === null;
}

/**
 * check if the given value is null or an empty array/string
 * @param val
 * @returns {boolean}
 */
function isNullOrEmpty(val) {
  return isNull(val) || val.length == 0;
}

/**
 * check if the parameter is not null nor undefined
 * @param val
 * @returns {boolean}
 */
function isNotNull(val) {
  return !isNull(val);
}

function isInt(n){
  return Number(n) === n && n % 1 === 0;
}


/**
 * get a sortable function that sorts any given array by the given property name
 * @param property
 * @returns {Function}
 */
function getSortableByPropertyName(property, reverse) {
  if (reverse !== true) {
    reverse = false;
  }

  return function (o1, o2) {
    if (o1[property] && o2[property]) {
      if (o1[property] > o2[property]) {
        return reverse ? -1 : 1;
      } else if (o1[property] < o2[property]) {
        return reverse ? 1 : -1;
      }

      return 0;
    }

    return o2[property] ?  -1 : 1;
  };
}



/**
 * invokes all who the functions that listens to ready alert after the ready function is called numOfFunc times.
 * @param numOfFunc
 * @param animation
 * @constructor
 */
function ReadyInvoker(numOfFunc, withLoading) {
  numOfFunc = numOfFunc || 1;

  this.withLoading = withLoading === true;

  if (this.withLoading) {
    // showLoadingBar(numOfFunc == 1 ? 5 : 0);
  }

  this.numOfFunc = this.numOfFuncLeft = numOfFunc;
  this.listeners = [];
  this.stopped = false;
}

/**
 * invoke the given function when ready
 * @param func
 */
ReadyInvoker.prototype.wait = function (func) {
  if (!this.stopped) {
    if (this.numOfFuncLeft > 0) {
      this.listeners.push(func);
    } else {
      func();
    }
  }
};

/**
 * notify that another function is ready, checks if all the functions are ready, if so invoke all the ready listeners
 */
ReadyInvoker.prototype.ready = function () {
  this.numOfFuncLeft--;

  if (this.numOfFuncLeft === 0) {
    if (this.withLoading) {
      // showLoadingBar(100);
    }

    while (this.listeners.length > 0) {
      this.listeners[0]();
      this.listeners.splice(0, 1);
    }
  } else {

    if (this.withLoading) {
      // showLoadingBar(((this.numOfFunc - this.numOfFuncLeft) * 100) / this.numOfFunc);
    }
  }
};

/**
 * stop the invoker, and don't invoke any wait functions
 */
ReadyInvoker.prototype.stop = function () {
  this.stopped = true;
};


ReadyInvoker.prototype.isEnded = function () {
  return this.numOfFuncLeft <= 0;
};

