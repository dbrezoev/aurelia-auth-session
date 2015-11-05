define(['exports', 'aurelia-http-client', 'jquery', 'aurelia-dependency-injection', './session', './logger', './locale', './config', './loading-mask/loading-mask'], function (exports, _aureliaHttpClient, _jquery, _aureliaDependencyInjection, _session, _logger, _locale, _config, _loadingMaskLoadingMask) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _$ = _interopRequireDefault(_jquery);

  var Http = (function () {
    function Http(session, logger, loadingMask) {
      _classCallCheck(this, _Http);

      this.session = session;
      this.logger = logger;
      this.loadingMask = loadingMask;
      this.authHttp = undefined;
      this.locale = _locale.Locale.Repository['default'];

      this.requestsCount = 0;
      this.host = _config.Config.httpOpts.serviceHost;
      this.origin = this.host + _config.Config.httpOpts.serviceApiPrefix;
      this.authOrigin = _config.Config.httpOpts.authHost;
      this.hosts = _config.Config.httpOpts.hosts || {};
      this.loadingMaskDelay = _config.Config.httpOpts.loadingMaskDelay || 1000;
      this.requestTimeout = _config.Config.httpOpts.requestTimeout;

      if (this.session.userRemembered()) {
        this.initAuthHttp(this.session.rememberedToken());
      }
    }

    _createClass(Http, [{
      key: '_showLoadingMask',
      value: function _showLoadingMask() {
        var _this = this;

        this.requestsCount += 1;
        if (this.requestsCount === 1) {
          if (this.loadingMaskDelay > 0) {
            this._queryTimeout = window.setTimeout(function () {
              _this.loadingMask.show();
            }, this.loadingMaskDelay);
          } else {
            this.loadingMask.show();
          }
        }
      }
    }, {
      key: '_hideLoadingMask',
      value: function _hideLoadingMask() {
        this.requestsCount -= 1;
        if (this.requestsCount <= 0) {
          if (this._queryTimeout) {
            window.clearTimeout(this._queryTimeout);
          }

          this.loadingMask.hide();
          this.requestsCount = 0;
        }
      }
    }, {
      key: 'get',
      value: function get(url, data) {
        var _this2 = this;

        this._showLoadingMask();
        var urlWithProps = url;
        if (data !== undefined) {
          var props = Object.keys(data).map(function (key) {
            return '' + key + '=' + data[key];
          }).join('&');

          urlWithProps += '?' + props;
        }
        var promise = this.authHttp.get(urlWithProps).then(function (response) {
          _this2._hideLoadingMask();
          return JSON.parse(response.response);
        });
        promise['catch'](this.errorHandler.bind(this));
        return promise;
      }
    }, {
      key: 'post',
      value: function post(url) {
        var _this3 = this;

        var content = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        this._showLoadingMask();
        var promise = this.authHttp.post(url, content).then(function (response) {
          _this3._hideLoadingMask();
          if (response.response !== "") {
            return JSON.parse(response.response);
          }
        });
        promise['catch'](this.errorHandler.bind(this));

        return promise;
      }
    }, {
      key: 'put',
      value: function put(url) {
        var _this4 = this;

        var content = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        this._showLoadingMask();
        var promise = this.authHttp.put(url, content).then(function (response) {
          return _this4._hideLoadingMask();
        });
        promise['catch'](this.errorHandler.bind(this));
        return promise;
      }
    }, {
      key: 'delete',
      value: function _delete(url) {
        var _this5 = this;

        var promise = this.authHttp['delete'](url).then(function (response) {
          return _this5._hideLoadingMask();
        });
        promise['catch'](this.errorHandler.bind(this));
        return promise;
      }
    }, {
      key: 'multipartFormPost',
      value: function multipartFormPost(url, data) {
        var requestUrl = this.origin + url;
        return this.multipartForm(requestUrl, data, 'POST');
      }
    }, {
      key: 'multipartFormPut',
      value: function multipartFormPut(url, data) {
        var requestUrl = this.origin + url;
        return this.multipartForm(requestUrl, data, 'PUT');
      }
    }, {
      key: 'multipartForm',
      value: function multipartForm(url, data, method) {
        var self = this;
        self._showLoadingMask();
        var req = _$['default'].ajax({
          url: url,
          data: data,
          processData: false,
          contentType: false,
          type: method,
          headers: {
            'Authorization': 'Bearer ' + this.token
          }
        });

        req.done(function () {
          self._hideLoadingMask();
        });
      }
    }, {
      key: 'postDownloadFile',
      value: function postDownloadFile(url, data) {
        return this.downloadFile(url, 'POST', data);
      }
    }, {
      key: 'getDownloadFile',
      value: function getDownloadFile(url) {
        return this.downloadFile(url, 'GET');
      }
    }, {
      key: 'downloadFile',
      value: function downloadFile(url, method, data) {
        var _this6 = this;

        this._showLoadingMask();
        var urlAddress = this.origin + url;
        var authHeaderValue = 'Bearer ' + this.token;
        var promise = new Promise(function (resolve, reject) {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open(method, urlAddress, true);
          xmlhttp.timeout = _this6.requestTimeout;
          xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          xmlhttp.setRequestHeader('Authorization', authHeaderValue);
          xmlhttp.responseType = "blob";

          xmlhttp.onload = function (oEvent) {
            if (this.status !== 200) {
              reject({ statusCode: this.status });
              return;
            }

            var blob = xmlhttp.response;
            var windowUrl = window.URL || window.webkitURL;
            var url = windowUrl.createObjectURL(blob);
            var filename = this.getResponseHeader('Content-Disposition').match(/^attachment; filename=(.+)/)[1];

            var anchor = (0, _$['default'])('<a></a>');
            anchor.prop('href', url);
            anchor.prop('download', filename);
            (0, _$['default'])('body').append(anchor);
            anchor.get(0).click();
            windowUrl.revokeObjectURL(url);
            anchor.remove();
          };

          xmlhttp.ontimeout = function () {
            reject({ timeout: true });
          };

          xmlhttp.addEventListener("error", function () {
            reject();
          });
          xmlhttp.addEventListener("load", function () {
            resolve();
            _this6._hideLoadingMask();
          });
          if (method === 'GET') {
            xmlhttp.send();
          } else if (method === 'POST') {
            xmlhttp.send(JSON.stringify(data));
          } else {
            throw new Error("Unsuported method call!");
          }
        });

        promise['catch'](this.errorHandler.bind(this));
        return promise;
      }
    }, {
      key: 'loginBasicAuth',
      value: function loginBasicAuth(email, pass) {
        var client = new _aureliaHttpClient.HttpClient();
        var encodedData = window.btoa(email + ':' + pass);
        var promise = client.createRequest('token').asGet().withBaseUrl(this.authOrigin).withHeader('Authorization', 'Basic ' + encodedData).send();
        promise.then(this.loginHandle.bind(this));
        promise['catch'](this.errorHandler.bind(this));

        return promise;
      }
    }, {
      key: 'loginResourceOwner',
      value: function loginResourceOwner(email, pass, clientId) {
        var _this7 = this;

        this._showLoadingMask();
        var data = {
          grant_type: 'password',
          client_id: clientId,
          username: email,
          password: pass
        };

        var client = new _aureliaHttpClient.HttpClient().configure(function (x) {
          x.withBaseUrl(_this7.authOrigin);
          x.withHeader("Content-Type", "application/x-www-form-urlencoded");
        });

        var promise = client.post('token', _$['default'].param(data));
        promise.then(this.loginHandle.bind(this));
        promise['catch'](this.errorHandler.bind(this));

        return promise;
      }
    }, {
      key: 'initAuthHttp',
      value: function initAuthHttp(token) {
        var _this8 = this;

        this.token = token;
        this.authHttp = new _aureliaHttpClient.HttpClient().configure(function (x) {
          x.withBaseUrl(_this8.origin);
          x.withHeader('Authorization', 'Bearer ' + _this8.token);
          x.withHeader("Content-Type", "application/json");
        });
      }
    }, {
      key: 'getAuthHttpFor',
      value: function getAuthHttpFor(hostName) {
        var _this9 = this;

        var authHttp = new _aureliaHttpClient.HttpClient().configure(function (x) {
          x.withBaseUrl(_this9.hosts[hostName]);
          x.withHeader('Authorization', 'Bearer ' + _this9.token);
          x.withHeader("Content-Type", "application/json");
        });

        return authHttp;
      }
    }, {
      key: '_convertToArray',
      value: function _convertToArray(value) {
        var result = value || [];
        if (typeof result === 'string') {
          return result.split(',');
        }

        return result;
      }
    }, {
      key: 'loginHandle',
      value: function loginHandle(response) {
        this._hideLoadingMask();
        var data = JSON.parse(response.response);
        var token = data.access_token;
        this.initAuthHttp(token);

        var claims = data.userClaims || [];
        if (typeof claims === 'string') {
          claims = JSON.parse(claims);
        }

        this.session.setUser({
          token: token,
          userName: data.userName || 'please give me a name!',
          userClaims: claims,
          userRoles: this._convertToArray(data.userRoles),
          userAccessRights: this._convertToArray(data.userAccessRights)
        });
      }
    }, {
      key: 'errorHandler',
      value: function errorHandler(response) {
        this._hideLoadingMask();
        if (response.statusCode === 401) {
          this.logger.warn(this.locale.translate('sessionTimedOut'));
        } else if (response.statusCode === 403) {
          this.logger.warn(this.locale.translate('accessDenied'));
        } else if (response.statusCode === 500) {
          this.logger.error(this.locale.translate('internalServerError'));
        } else if (response.timeout === true) {
          this.logger.error(this.locale.translate('requestTimeout'));
        } else {
          this.logger.error(this.locale.translate('errorHappend'));
        }
      }
    }]);

    var _Http = Http;
    Http = (0, _aureliaDependencyInjection.inject)(_session.Session, _logger.Logger, _loadingMaskLoadingMask.LoadingMask)(Http) || Http;
    return Http;
  })();

  exports.Http = Http;
});
//# sourceMappingURL=data:application/json;base64,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LElBQUksUUFBUSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7QUFDcEMsY0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1NBQzVELE1BQU07QUFDTCxjQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1NBQzFEO09BQ0Y7OztnQkFoU1UsSUFBSTtBQUFKLFFBQUksR0FEaEIsZ0NBUE8sTUFBTSxXQUNOLE9BQU8sVUFDUCxNQUFNLDBCQUdOLFdBQVcsQ0FFa0IsQ0FDeEIsSUFBSSxLQUFKLElBQUk7V0FBSixJQUFJIiwiZmlsZSI6Imh0dHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgbW9zaGVuc2t5IG9uIDYvMTYvMTUuXG4gKi9cbmltcG9ydCB7SHR0cENsaWVudH0gZnJvbSAnYXVyZWxpYS1odHRwLWNsaWVudCc7XG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJ2F1cmVsaWEtZGVwZW5kZW5jeS1pbmplY3Rpb24nO1xuaW1wb3J0IHtTZXNzaW9ufSBmcm9tICcuL3Nlc3Npb24nO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7TG9jYWxlfSBmcm9tICcuL2xvY2FsZSc7XG5pbXBvcnQge0NvbmZpZ30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHtMb2FkaW5nTWFza30gZnJvbSAnLi9sb2FkaW5nLW1hc2svbG9hZGluZy1tYXNrJztcblxuQGluamVjdChTZXNzaW9uLCBMb2dnZXIsIExvYWRpbmdNYXNrKVxuZXhwb3J0IGNsYXNzIEh0dHAge1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uLCBsb2dnZXIsIGxvYWRpbmdNYXNrKSB7XG4gICAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcbiAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcbiAgICB0aGlzLmxvYWRpbmdNYXNrID0gbG9hZGluZ01hc2s7XG4gICAgdGhpcy5hdXRoSHR0cCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmxvY2FsZSA9IExvY2FsZS5SZXBvc2l0b3J5LmRlZmF1bHQ7XG5cbiAgICB0aGlzLnJlcXVlc3RzQ291bnQgPSAwO1xuICAgIHRoaXMuaG9zdCA9IENvbmZpZy5odHRwT3B0cy5zZXJ2aWNlSG9zdDtcbiAgICB0aGlzLm9yaWdpbiA9IHRoaXMuaG9zdCArIENvbmZpZy5odHRwT3B0cy5zZXJ2aWNlQXBpUHJlZml4O1xuICAgIHRoaXMuYXV0aE9yaWdpbiA9IENvbmZpZy5odHRwT3B0cy5hdXRoSG9zdDtcbiAgICB0aGlzLmhvc3RzID0gQ29uZmlnLmh0dHBPcHRzLmhvc3RzIHx8IHt9O1xuICAgIHRoaXMubG9hZGluZ01hc2tEZWxheSA9IENvbmZpZy5odHRwT3B0cy5sb2FkaW5nTWFza0RlbGF5IHx8IDEwMDA7XG4gICAgdGhpcy5yZXF1ZXN0VGltZW91dCA9IENvbmZpZy5odHRwT3B0cy5yZXF1ZXN0VGltZW91dDtcblxuICAgIGlmICh0aGlzLnNlc3Npb24udXNlclJlbWVtYmVyZWQoKSkge1xuICAgICAgdGhpcy5pbml0QXV0aEh0dHAodGhpcy5zZXNzaW9uLnJlbWVtYmVyZWRUb2tlbigpKTtcbiAgICB9XG4gIH1cblxuICBfc2hvd0xvYWRpbmdNYXNrKCkge1xuICAgIHRoaXMucmVxdWVzdHNDb3VudCArPSAxO1xuICAgIGlmICh0aGlzLnJlcXVlc3RzQ291bnQgPT09IDEpIHtcbiAgICAgIGlmICh0aGlzLmxvYWRpbmdNYXNrRGVsYXkgPiAwKSB7XG4gICAgICAgIHRoaXMuX3F1ZXJ5VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLmxvYWRpbmdNYXNrLnNob3coKTtcbiAgICAgICAgfSwgdGhpcy5sb2FkaW5nTWFza0RlbGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9hZGluZ01hc2suc2hvdygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9oaWRlTG9hZGluZ01hc2soKSB7XG4gICAgdGhpcy5yZXF1ZXN0c0NvdW50IC09IDE7XG4gICAgaWYgKHRoaXMucmVxdWVzdHNDb3VudCA8PSAwKSB7XG4gICAgICBpZiAodGhpcy5fcXVlcnlUaW1lb3V0KSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5fcXVlcnlUaW1lb3V0KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb2FkaW5nTWFzay5oaWRlKCk7XG4gICAgICB0aGlzLnJlcXVlc3RzQ291bnQgPSAwO1xuICAgIH1cbiAgfVxuXG4gIGdldCh1cmwsIGRhdGEpIHtcbiAgICB0aGlzLl9zaG93TG9hZGluZ01hc2soKTtcbiAgICBsZXQgdXJsV2l0aFByb3BzID0gdXJsO1xuICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBwcm9wcyA9IE9iamVjdC5rZXlzKGRhdGEpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiAnJyArIGtleSArICc9JyArIGRhdGFba2V5XTtcbiAgICAgIH0pLmpvaW4oJyYnKTtcblxuICAgICAgdXJsV2l0aFByb3BzICs9ICc/JyArIHByb3BzO1xuICAgIH1cbiAgICBjb25zdCBwcm9taXNlID0gdGhpcy5hdXRoSHR0cC5nZXQodXJsV2l0aFByb3BzKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgIHRoaXMuX2hpZGVMb2FkaW5nTWFzaygpO1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcG9uc2UucmVzcG9uc2UpO1xuICAgIH0pO1xuICAgIHByb21pc2UuY2F0Y2godGhpcy5lcnJvckhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBwb3N0KHVybCwgY29udGVudCA9IHt9KSB7XG4gICAgdGhpcy5fc2hvd0xvYWRpbmdNYXNrKCk7XG4gICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuYXV0aEh0dHAucG9zdCh1cmwsIGNvbnRlbnQpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgdGhpcy5faGlkZUxvYWRpbmdNYXNrKCk7XG4gICAgICBpZiAocmVzcG9uc2UucmVzcG9uc2UgIT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcG9uc2UucmVzcG9uc2UpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHByb21pc2UuY2F0Y2godGhpcy5lcnJvckhhbmRsZXIuYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG5cbiAgcHV0KHVybCwgY29udGVudCA9IHt9KSB7XG4gICAgdGhpcy5fc2hvd0xvYWRpbmdNYXNrKCk7XG4gICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuYXV0aEh0dHAucHV0KHVybCwgY29udGVudCkudGhlbihyZXNwb25zZSA9PiB0aGlzLl9oaWRlTG9hZGluZ01hc2soKSk7XG4gICAgcHJvbWlzZS5jYXRjaCh0aGlzLmVycm9ySGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGRlbGV0ZSh1cmwpIHtcbiAgICBjb25zdCBwcm9taXNlID0gdGhpcy5hdXRoSHR0cC5kZWxldGUodXJsKS50aGVuKHJlc3BvbnNlID0+IHRoaXMuX2hpZGVMb2FkaW5nTWFzaygpKTtcbiAgICBwcm9taXNlLmNhdGNoKHRoaXMuZXJyb3JIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgbXVsdGlwYXJ0Rm9ybVBvc3QodXJsLCBkYXRhKSB7XG4gICAgdmFyIHJlcXVlc3RVcmwgPSB0aGlzLm9yaWdpbiArIHVybDtcbiAgICByZXR1cm4gdGhpcy5tdWx0aXBhcnRGb3JtKHJlcXVlc3RVcmwsIGRhdGEsICdQT1NUJyk7XG4gIH1cblxuICBtdWx0aXBhcnRGb3JtUHV0KHVybCwgZGF0YSkge1xuICAgIHZhciByZXF1ZXN0VXJsID0gdGhpcy5vcmlnaW4gKyB1cmw7XG4gICAgcmV0dXJuIHRoaXMubXVsdGlwYXJ0Rm9ybShyZXF1ZXN0VXJsLCBkYXRhLCAnUFVUJyk7XG4gIH1cblxuICBtdWx0aXBhcnRGb3JtKHVybCwgZGF0YSwgbWV0aG9kKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuX3Nob3dMb2FkaW5nTWFzaygpO1xuICAgIHZhciByZXEgPSAkLmFqYXgoe1xuICAgICAgdXJsOiB1cmwsXG4gICAgICBkYXRhOiBkYXRhLFxuICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgdHlwZTogbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHRoaXMudG9rZW5cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJlcS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5faGlkZUxvYWRpbmdNYXNrKCk7XG4gICAgfSk7XG5cbiAgICAvLyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIC8vICAgcmVxLmRvbmUocmVzb2x2ZSk7XG4gICAgLy8gICByZXEuZmFpbChyZWplY3QpO1xuICAgIC8vICAgc2VsZi5faGlkZUxvYWRpbmdNYXNrKCk7XG4gICAgLy8gfSkuY2F0Y2godGhpcy5lcnJvckhhbmRsZXIuYmluZCh0aGlzKSk7XG4gIH1cblxuICBwb3N0RG93bmxvYWRGaWxlKHVybCwgZGF0YSkge1xuICAgIHJldHVybiB0aGlzLmRvd25sb2FkRmlsZSh1cmwsICdQT1NUJywgZGF0YSk7XG4gIH1cblxuICBnZXREb3dubG9hZEZpbGUodXJsKSB7XG4gICAgcmV0dXJuIHRoaXMuZG93bmxvYWRGaWxlKHVybCwgJ0dFVCcpO1xuICB9XG5cbiAgZG93bmxvYWRGaWxlKHVybCwgbWV0aG9kLCBkYXRhKSB7XG4gICAgdGhpcy5fc2hvd0xvYWRpbmdNYXNrKCk7XG4gICAgY29uc3QgdXJsQWRkcmVzcyA9IHRoaXMub3JpZ2luICsgdXJsO1xuICAgIGNvbnN0IGF1dGhIZWFkZXJWYWx1ZSA9IGBCZWFyZXIgJHt0aGlzLnRva2VufWA7XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHhtbGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhtbGh0dHAub3BlbihtZXRob2QsIHVybEFkZHJlc3MsIHRydWUpO1xuICAgICAgeG1saHR0cC50aW1lb3V0ID0gdGhpcy5yZXF1ZXN0VGltZW91dDtcbiAgICAgIHhtbGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuICAgICAgeG1saHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdBdXRob3JpemF0aW9uJywgYXV0aEhlYWRlclZhbHVlKTtcbiAgICAgIHhtbGh0dHAucmVzcG9uc2VUeXBlID0gXCJibG9iXCI7XG5cbiAgICAgIHhtbGh0dHAub25sb2FkID0gZnVuY3Rpb24gKG9FdmVudCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgIHJlamVjdCh7c3RhdHVzQ29kZTogdGhpcy5zdGF0dXN9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBibG9iID0geG1saHR0cC5yZXNwb25zZTtcbiAgICAgICAgY29uc3Qgd2luZG93VXJsID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xuICAgICAgICBjb25zdCB1cmwgPSB3aW5kb3dVcmwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHRoaXMuZ2V0UmVzcG9uc2VIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nKS5tYXRjaCgvXmF0dGFjaG1lbnQ7IGZpbGVuYW1lPSguKykvKVsxXTtcblxuICAgICAgICBjb25zdCBhbmNob3IgPSAkKCc8YT48L2E+Jyk7XG4gICAgICAgIGFuY2hvci5wcm9wKCdocmVmJywgdXJsKTtcbiAgICAgICAgYW5jaG9yLnByb3AoJ2Rvd25sb2FkJywgZmlsZW5hbWUpO1xuICAgICAgICAkKCdib2R5JykuYXBwZW5kKGFuY2hvcik7XG4gICAgICAgIGFuY2hvci5nZXQoMCkuY2xpY2soKTtcbiAgICAgICAgd2luZG93VXJsLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICAgICAgICBhbmNob3IucmVtb3ZlKCk7XG4gICAgICB9O1xuXG4gICAgICB4bWxodHRwLm9udGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmVqZWN0KHt0aW1lb3V0OiB0cnVlfSk7XG4gICAgICB9O1xuXG4gICAgICB4bWxodHRwLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoKSA9PiB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgfSk7XG4gICAgICB4bWxodHRwLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB0aGlzLl9oaWRlTG9hZGluZ01hc2soKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgeG1saHR0cC5zZW5kKCk7XG4gICAgICB9IGVsc2UgaWYgKG1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgIHhtbGh0dHAuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cG9ydGVkIG1ldGhvZCBjYWxsIVwiKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHByb21pc2UuY2F0Y2godGhpcy5lcnJvckhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBsb2dpbkJhc2ljQXV0aChlbWFpbCwgcGFzcykge1xuICAgIGxldCBjbGllbnQgPSBuZXcgSHR0cENsaWVudCgpO1xuICAgIGxldCBlbmNvZGVkRGF0YSA9IHdpbmRvdy5idG9hKGVtYWlsICsgJzonICsgcGFzcyk7XG4gICAgbGV0IHByb21pc2UgPSBjbGllbnQuY3JlYXRlUmVxdWVzdCgndG9rZW4nKVxuICAgICAgLmFzR2V0KClcbiAgICAgIC53aXRoQmFzZVVybCh0aGlzLmF1dGhPcmlnaW4pXG4gICAgICAud2l0aEhlYWRlcignQXV0aG9yaXphdGlvbicsICdCYXNpYyAnICsgZW5jb2RlZERhdGEpXG4gICAgICAuc2VuZCgpO1xuICAgIHByb21pc2UudGhlbih0aGlzLmxvZ2luSGFuZGxlLmJpbmQodGhpcykpO1xuICAgIHByb21pc2UuY2F0Y2godGhpcy5lcnJvckhhbmRsZXIuYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGxvZ2luUmVzb3VyY2VPd25lcihlbWFpbCwgcGFzcywgY2xpZW50SWQpIHtcbiAgICB0aGlzLl9zaG93TG9hZGluZ01hc2soKTtcbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgIGdyYW50X3R5cGU6ICdwYXNzd29yZCcsXG4gICAgICBjbGllbnRfaWQ6IGNsaWVudElkLFxuICAgICAgdXNlcm5hbWU6IGVtYWlsLFxuICAgICAgcGFzc3dvcmQ6IHBhc3NcbiAgICB9O1xuXG4gICAgbGV0IGNsaWVudCA9IG5ldyBIdHRwQ2xpZW50KClcbiAgICAgIC5jb25maWd1cmUoeCA9PiB7XG4gICAgICAgIHgud2l0aEJhc2VVcmwodGhpcy5hdXRoT3JpZ2luKTtcbiAgICAgICAgeC53aXRoSGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIpO1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBwcm9taXNlID0gY2xpZW50LnBvc3QoJ3Rva2VuJywgJC5wYXJhbShkYXRhKSk7XG4gICAgcHJvbWlzZS50aGVuKHRoaXMubG9naW5IYW5kbGUuYmluZCh0aGlzKSk7XG4gICAgcHJvbWlzZS5jYXRjaCh0aGlzLmVycm9ySGFuZGxlci5iaW5kKHRoaXMpKTtcblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgaW5pdEF1dGhIdHRwKHRva2VuKSB7XG4gICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICAgIHRoaXMuYXV0aEh0dHAgPSBuZXcgSHR0cENsaWVudCgpLmNvbmZpZ3VyZSh4ID0+IHtcbiAgICAgIHgud2l0aEJhc2VVcmwodGhpcy5vcmlnaW4pO1xuICAgICAgeC53aXRoSGVhZGVyKCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3RoaXMudG9rZW59YCk7XG4gICAgICB4LndpdGhIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0QXV0aEh0dHBGb3IoaG9zdE5hbWUpIHtcbiAgICBsZXQgYXV0aEh0dHAgPSBuZXcgSHR0cENsaWVudCgpLmNvbmZpZ3VyZSh4ID0+IHtcbiAgICAgIHgud2l0aEJhc2VVcmwodGhpcy5ob3N0c1tob3N0TmFtZV0pO1xuICAgICAgeC53aXRoSGVhZGVyKCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3RoaXMudG9rZW59YCk7XG4gICAgICB4LndpdGhIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGF1dGhIdHRwO1xuICB9XG5cbiAgX2NvbnZlcnRUb0FycmF5KHZhbHVlKSB7XG4gICAgbGV0IHJlc3VsdCA9IHZhbHVlIHx8IFtdO1xuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHJlc3VsdC5zcGxpdCgnLCcpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBsb2dpbkhhbmRsZShyZXNwb25zZSkge1xuICAgIHRoaXMuX2hpZGVMb2FkaW5nTWFzaygpO1xuICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlc3BvbnNlLnJlc3BvbnNlKTtcbiAgICBsZXQgdG9rZW4gPSBkYXRhLmFjY2Vzc190b2tlbjtcbiAgICB0aGlzLmluaXRBdXRoSHR0cCh0b2tlbik7XG5cbiAgICBsZXQgY2xhaW1zID0gZGF0YS51c2VyQ2xhaW1zIHx8IFtdO1xuICAgIGlmICh0eXBlb2YgY2xhaW1zID09PSAnc3RyaW5nJykge1xuICAgICAgY2xhaW1zID0gSlNPTi5wYXJzZShjbGFpbXMpO1xuICAgIH1cblxuICAgIHRoaXMuc2Vzc2lvbi5zZXRVc2VyKHtcbiAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgIHVzZXJOYW1lOiBkYXRhLnVzZXJOYW1lIHx8ICdwbGVhc2UgZ2l2ZSBtZSBhIG5hbWUhJyxcbiAgICAgIHVzZXJDbGFpbXM6IGNsYWltcyxcbiAgICAgIHVzZXJSb2xlczogdGhpcy5fY29udmVydFRvQXJyYXkoZGF0YS51c2VyUm9sZXMpLFxuICAgICAgdXNlckFjY2Vzc1JpZ2h0czogdGhpcy5fY29udmVydFRvQXJyYXkoZGF0YS51c2VyQWNjZXNzUmlnaHRzKVxuICAgIH0pO1xuICB9XG5cbiAgLy8gVE9ETzogdXNlIGFzIGluIGF1cmVsaWEtdmFsaWRhdGlvblxuICBlcnJvckhhbmRsZXIocmVzcG9uc2UpIHtcbiAgICB0aGlzLl9oaWRlTG9hZGluZ01hc2soKTtcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gNDAxKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKHRoaXMubG9jYWxlLnRyYW5zbGF0ZSgnc2Vzc2lvblRpbWVkT3V0JykpO1xuICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gNDAzKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKHRoaXMubG9jYWxlLnRyYW5zbGF0ZSgnYWNjZXNzRGVuaWVkJykpO1xuICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gNTAwKSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcih0aGlzLmxvY2FsZS50cmFuc2xhdGUoJ2ludGVybmFsU2VydmVyRXJyb3InKSk7XG4gICAgfSBlbHNlIGlmIChyZXNwb25zZS50aW1lb3V0ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcih0aGlzLmxvY2FsZS50cmFuc2xhdGUoJ3JlcXVlc3RUaW1lb3V0JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcih0aGlzLmxvY2FsZS50cmFuc2xhdGUoJ2Vycm9ySGFwcGVuZCcpKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
