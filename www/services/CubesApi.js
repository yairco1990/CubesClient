/**
 * Created by sergeisafrigin on 6/23/15.
 */
angular.module('MyCubes.services.api', [])


  .factory('$cubesApi', ['$http', 'paramsToQuery',
    function ($http, paramsToQuery) {

      //server ips
      var SERVER = {
        LOCAL: 'localhost:8080',
        TEAMMATE: '192.168.1.105:8080'
      };

      var SERVER_IP = SERVER.LOCAL;

      var protocol = "http";

      //currently used server
      SERVER_IP = protocol + "://" + SERVER_IP + "/services";

      //action type, a normal request or an auth one
      var _type = {
        NORMAL: "normal",
        AUTH: "auth"
      };

      var _method = {
        GET: 'GET',
        POST: 'POST'
      };

      var _input = {
        URL_ENCODED: 'urlEncoded',
        JSON: 'json'
      };

      //path prefix that added for auth requests
      //TODO add auth later
      //var AUTH_PATH_PREFIX = "/api";


      //api possible actions
      var _apiActions = {

        Cubes: {

          GET_GAME:{
            name: 'Cubes_GET_GAME',
            path: '/cubes/getGame',
            type: _type.NORMAL,
            method: _method.GET,
            input: _input.URL_ENCODED
          },

          GET_ROOMS:{
            name: 'Cubes_GET_ROOMS',
            path: '/cubes/getRooms',
            type: _type.NORMAL,
            method: _method.GET,
            input: _input.URL_ENCODED
          },

          SET_GAMBLE: {
            name: 'Cubes_SET_GAMBLE',
            path: '/cubes/setGamble',
            type: _type.NORMAL,
            method: _method.POST,
            input: _input.URL_ENCODED
          },

          LOGIN: {
            name: 'Cubes_LOGIN',
            path: '/cubes/login',
            type: _type.NORMAL,
            method: _method.POST,
            input: _input.URL_ENCODED
          },

          INIT_ROOM: {
            name: 'Cubes_INIT_ROOM',
            path: '/cubes/initRoom',
            type: _type.NORMAL,
            method: _method.POST,
            input: _input.URL_ENCODED
          },

          SET_TOKEN: {
            name: 'Cubes_SET_TOKEN',
            path: '/cubes/setToken',
            type: _type.NORMAL,
            method: _method.POST,
            input: _input.URL_ENCODED
          }

        }

      };

      //get http request
      function request(info, requestQueue, requestsArr) {

        //decrease the number of retries left by one
        info.config.retries--;

        //save the retries left because config is sent by reference and will be used by the finally
        var retriesLeft = info.config.retries;

        //request headers
        var headers = {};

        //begin path with sevrer's ip
        var path = SERVER_IP;

        //if auth action, add '/auth' to the path and add the auto token as Authorization header
        if (info.action.type == _type.AUTH) {
          //path += AUTH_PATH_PREFIX;

          //     //add auth token
          //     if (isNotNull(sessionConfig.TOKEN.getSessionToken())) {
          //         headers['Authorization'] = sessionConfig.TOKEN.getSessionToken();
          //     } else {
          //         $log.warn("invoking auth http request but auth token is missing (must login first)");
          //     }
        }

        //add the action to the path
        path += info.action.path;

        var data;

        //set content type header and resolve data/path
        if (info.action.input == _input.URL_ENCODED) {

          //add params to the path for get requests
          if (info.action.method == _method.GET) {
            path += paramsToQuery(info.params, true);
          } else {
            data = paramsToQuery(info.params, false);
          }

          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
          headers['Content-Type'] = 'application/json';
          data = info.params;
        }

        var requestParams = {
          url: path,
          method: info.action.method,
          config: {timeout: info.config.timeout},
          headers: headers,
          data: data
        };

        //fire an http get request
        $http(requestParams).success(function (data) {

          //reset the retries as we are not going to retry after a success
          retriesLeft = 0;

          if (info.preReadyInvoker) {
            info.preReadyInvoker.ready();
          }

          if (isNotNull(info.onPreFinally)) {
            info.onPreFinally();
          }

          //if response type is a success invoke the on success listener
          if (data.responseType == "SUCCESS") {

            if (info.onSuccess) {
              info.onSuccess(data.result);
            }
          } else { //if response type is not a success invoke the on error listener

            if (info.onError) {
              info.onError(data.responseType, data.result);
            }

            if (info.onAppError) {
              info.onAppError(data.responseType, data.result);
            }
          }

        }).error(function (data, status) { //on request error

          //if any retries left, invoke another http get request
          if (info.config.retries > 0) {
            request(info, requestQueue, requestsArr);
          } else {

            if (info.preReadyInvoker) {
              info.preReadyInvoker.ready();
            }

            if (isNotNull(info.onPreFinally)) {
              info.onPreFinally();
            }

            if (info.onError) { //invoke the on error listener
              info.onError("SystemError", data, status);
            }

            if (info.onSystemError) {
              info.onSystemError(data, status);
            }
          }

        })["finally"](function () { //finally
          //if no retries left, invoke the on finally listener

          if (retriesLeft <= 0) {

            if (info.postReadyInvoker) {
              info.postReadyInvoker.ready();
            }

            if (info.readyInvoker) {
              info.readyInvoker.ready();
            }

            if (isNotNull(info.onFinally)) {
              info.onFinally();
            }

            requestsArr.splice(0, 1);


            if (requestsArr.length > 0) {
              request(requestsArr[0], requestQueue, requestsArr);
            } else {
              requestQueue.splice(requestQueue.indexOf(requestsArr), 1);
            }
          }

        });
      }

      var requestsQueue = {};


      function filterRequest(info) {

        //action found different info
        //action found same info

        var requestQueue;

        if (isNotNull(requestsQueue[info.action.name])) {
          requestQueue = requestsQueue[info.action.name];
        } else {
          requestQueue = requestsQueue[info.action.name] = [];
        }


        var requestArr;


        for (var i = 0; i < requestQueue.length; i++) {

          if (requestQueue[i].length > 0 && angular.equals(requestQueue[i][0].params, info.params)) {

            requestArr = requestQueue[i];

            break;
          }
        }


        if (isNotNull(requestArr)) {

          requestArr[1] = info;

        } else {

          var requestsArr = [info];

          requestQueue.push(requestsArr);

          request(info, requestQueue, requestsArr);
        }

      }


      return {
        //make the actions visible
        apiActions: _apiActions,

        //set business side platform
        PLATFORM: "ONLINE_RESERVATION",


        /**
         * api request used to fire http requests
         * @param action api action
         * @param params parameters object that will be sent to the server
         * @param onSuccess on success listener
         * @param onError on error listener
         * @param onFinally finally listener
         * @param config {retries: number of retries, timeout: timeout per retry}
         */
        apiRequest: function (action, params, onSuccess, onError, onFinally, config, onAppError, onSystemError) {

          var info = arguments.length == 1 ? action : {
            action: action,
            params: params,
            onSuccess: onSuccess,
            onAppError: onAppError,
            onSystemError: onSystemError,
            onError: onError,
            onFinally: onFinally,
            config: config,
            animation: false
          };


          //if config was not send create a default config
          if (isNull(info.config)) {
            info.config = {};
          }

          //if number of retries was not set, set 1 as default
          if (isNull(info.config.retries)) {
            info.config.retries = 5;
          }

          //set timeout to 5 seconds if was not set
          if (isNull(info.config.timeout)) {
            info.config.timeout = 15000;
          }

          if (info.preAnimation) {
            info.preReadyInvoker = new ReadyInvoker(1, true);
          }

          if (info.postAnimation) {
            info.postReadyInvoker = new ReadyInvoker(1, true);
          }

          if (info.animation) {
            info.readyInvoker = new ReadyInvoker(1, true);
          }

          //invoke http request by request type
          filterRequest(info);
        },


        apiServerResponses: {
          SUCCESS: "SUCCESS",
          BAD_REQUEST: "BAD_REQUEST",
          DB_ERROR: "DB_ERROR",
          NOT_AUTHORIZED: "NOT_AUTHORIZED",
          NO_ROWS_FOUND: "NO_ROWS_FOUND",

          QUEUE: {
            QUEUES_EXCEEDED: "QUEUES_EXCEEDED",
            QUEUE_TIME_BEFORE_NOW: "QUEUE_TIME_BEFORE_NOW"
          },

          FORM: {
            INVALID_FORM: "INVALID_FORM"
          },

          LINE: {
            DUPLICATE_LINE_NAME: "DUPLICATE_LINE_NAME"
          },

          BRANCH_SERVICE: {
            DUPLICATE_BRANCH_SERVICE_NAME: "DUPLICATE_BRANCH_SERVICE_NAME"
          },

          WORKSTATION: {
            DUPLICATE_WORKSTATION_NAME: "DUPLICATE_WORKSTATION_NAME",

            WORKSTATION_TAKEN: "WORKSTATION_TAKEN",

            WORKSTATION_NOT_FOUND: "WORKSTATION_NOT_FOUND"
          },

          EMPLOYEE: {
            ALREADY_LOGGED_IN: "ALREADY_LOGGED_IN",
            PASSWORD_NO_MATCH: "PASSWORD_NO_MATCH",
            NOT_LOGGED_IN: "NOT_LOGGED_IN"
          },


          CUSTOMER: {
            INVALID_FIRST_NAME: "INVALID_FIRST_NAME",
            CUSTOMER_NOT_FOUND: "CUSTOMER_NOT_FOUND"
          },

          CAMPAIGN: {
            INTERSECTING_HOURS: "INTERSECTING_HOURS"
          }
        }

      };


    }])


  .factory('$gotimeConstants', [function () {

    var constants = {
      QUEUE_TYPES: {
        FIFO: 4,
        RESERVED: 1,
        FIFO_RESTAURANT: 2,
        RESERVED_RESTAURANT: 7,
        FIXED_FIFO: 8,
        FIXED_RESTAURANT_FIFO: 9,

        isReserved: function (queueTypeId) {
          return queueTypeId == constants.QUEUE_TYPES.RESERVED || queueTypeId == constants.QUEUE_TYPES.RESERVED_RESTAURANT;
        },

        isFifo: function (queueTypeId) {
          return queueTypeId == constants.QUEUE_TYPES.FIFO || queueTypeId == constants.QUEUE_TYPES.FIFO_RESTAURANT;
        },

        isFifoOrFixed: function (queueTypeId) {
          return queueTypeId == constants.QUEUE_TYPES.FIFO || queueTypeId == constants.QUEUE_TYPES.FIFO_RESTAURANT ||
            queueTypeId == constants.QUEUE_TYPES.FIXED_FIFO || queueTypeId == constants.QUEUE_TYPES.FIXED_RESTAURANT_FIFO;
        },

        isReservedOrFixed: function (queueTypeId) {
          return queueTypeId == constants.QUEUE_TYPES.RESERVED || queueTypeId == constants.QUEUE_TYPES.RESERVED_RESTAURANT ||
            queueTypeId == constants.QUEUE_TYPES.FIXED_FIFO || queueTypeId == constants.QUEUE_TYPES.FIXED_RESTAURANT_FIFO;
        }
      }
    };

    return constants;
  }])

  //convert parameters object to query
  .factory('paramsToQuery', [function () {
    /**
     *
     * @param params object with the parameters we want to convert into a query
     * @param includeQuestionMark should or should not include a question mark at the beginning of the query
     * @returns {*}
     */
    return function (params, includeQuestionMark) {
      for (var key in params) {
        if (typeof params[key] === 'object' && params[key] !== null) {
          var o = params[key];
          delete params[key];
          for (var k in o) {
            var new_key = key + "[" + k + "]";
            params[new_key] = o[k];
          }
        }
      }

      var arr = [];

      for (key in params) {
        if (!isNull(params[key])) {
          arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
      }

      if (arr.length > 0) {
        return includeQuestionMark ? '?' + arr.join("&") : arr.join("&");
      }

      return "";
    };
  }])

;
