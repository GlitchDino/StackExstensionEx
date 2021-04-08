var app = {};

app.version = function () {return chrome.runtime.getManifest().version};
app.homepage = function () {return chrome.runtime.getManifest().homepage_url};

app.button = {
  "clicked": function (callback) {chrome.browserAction.onClicked.addListener(callback)},
  "update": function () {
    chrome.browserAction.setTitle({"title": "HTML Elements Screenshot :: " + config.addon.state});
    chrome.browserAction.setIcon({
      "path": {
        "16": "../../data/icons/" + (config.addon.state ? config.addon.state + '/' : '') + "16.png",
        "32": "../../data/icons/" + (config.addon.state ? config.addon.state + '/' : '') + "32.png",
        "48": "../../data/icons/" + (config.addon.state ? config.addon.state + '/' : '') + "48.png",
        "64": "../../data/icons/" + (config.addon.state ? config.addon.state + '/' : '') + "64.png"
      }
    });
  }
};

if (!navigator.webdriver) {
  chrome.runtime.setUninstallURL(app.homepage() + "?v=" + app.version() + "&type=uninstall", function () {});
  chrome.runtime.onInstalled.addListener(function (e) {
    chrome.management.getSelf(function (result) {
      if (result.installType === "normal") {
        window.setTimeout(function () {
          var previous = e.previousVersion !== undefined && e.previousVersion !== app.version();
          var doupdate = previous && parseInt((Date.now() - config.welcome.lastupdate) / (24 * 3600 * 1000)) > 45;
          if (e.reason === "install" || (e.reason === "update" && doupdate)) {
            var parameter = (e.previousVersion ? "&p=" + e.previousVersion : '') + "&type=" + e.reason;
            app.tab.open(app.homepage() + "?v=" + app.version() + parameter);
            config.welcome.lastupdate = Date.now();
          }
        }, 3000);
      }
    });
  });
}

app.tab = {
  "open": function (url) {chrome.tabs.create({"url": url, "active": true})},
  "updated": function (callback) {chrome.tabs.onUpdated.addListener(callback)},
  "active": function (callback) {
    chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
      if (tabs && tabs.length) {
        if (tabs[0].url) {
          callback(tabs[0]);
        }
      }
    });
  },
  "inject": {
    "js": function (options, callback) {
      chrome.tabs.executeScript(options, function (e) {
        var tmp = chrome.runtime.lastError;
        callback(e);
      });
    }
  }
};

app.storage = (function () {
  var objs = {};
  window.setTimeout(function () {
    chrome.storage.local.get(null, function (o) {
      objs = o;
      var script = document.createElement("script");
      script.src = "../common.js";
      document.body.appendChild(script);
    });
  }, 300);
  /*  */
  return {
    "read": function (id) {return objs[id]},
    "changed": function (callback) {
      chrome.storage.onChanged.addListener(callback);
    },
    "write": function (id, data) {
      var tmp = {};
      tmp[id] = data;
      objs[id] = data;
      chrome.storage.local.set(tmp, function () {});
    }
  }
})();

app.content_script = (function () {
  var tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "page-to-background") {
          if (request.method === id) {
            tmp[id](request.data);
          }
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
          if (!tabId || (tabId && tab.id === tabId)) {
            chrome.tabs.sendMessage(tab.id, {"path": "background-to-page", "method": id, "data": data});
          }
        });
      });
    }
  }
})();