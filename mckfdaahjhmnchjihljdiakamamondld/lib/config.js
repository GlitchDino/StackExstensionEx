var config = {};

config.top = null;

config.welcome = {
  set lastupdate (val) {app.storage.write("lastupdate", val)},
  get lastupdate () {return app.storage.read("lastupdate") !== undefined ? app.storage.read("lastupdate") : 0}
};

config.addon = {
  set state (val) {app.storage.write("state", val)},
  get state () {return app.storage.read("state") !== undefined ? app.storage.read("state") : "OFF"}
};

config.request = {
  "urls": {"urls": ["*://*/*"]},
  "rules": {
    'a': null,
    'b': ["blocking", "responseHeaders"],
    'c': ["blocking", "responseHeaders", "extraHeaders"]
  },
  "method": function (info) {
    if (config.addon.state === "ON") {
      var value = config.top ? config.top : (info.initiator ? info.initiator : '*');
      var headers = info.responseHeaders.filter(e => e.name.toLowerCase() !== "access-control-allow-origin" && e.name.toLowerCase() !== "access-control-allow-methods");
      headers.push({"name": "Access-Control-Allow-Origin", "value": value});
      headers.push({"name": "Access-Control-Allow-Methods", "value": "GET, HEAD"});
      /*  */
      return {"responseHeaders": headers};
    }
  },
  "load": function () {
    chrome.permissions.contains({
      "origins": ["*://*/*"],
      "permissions": ["webRequest", "webRequestBlocking"]
    }, function (granted) {
      if (chrome.webRequest) chrome.webRequest.onHeadersReceived.removeListener(config.request.method);
      if (granted) {
        config.request.rules.a = navigator.userAgent.indexOf("Firefox") !== -1 ? config.request.rules.b : config.request.rules.c;
        chrome.webRequest.onHeadersReceived.addListener(config.request.method, config.request.urls, config.request.rules.a);
      }
    });
  }
};