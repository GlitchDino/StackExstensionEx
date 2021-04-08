var core = {
  "update": {
    "addon": function (state) {
      if (state) {
        if (config.addon.state !== state) {
          config.addon.state = state;
        }
      }
      /*  */
      app.button.update();
      config.request.load();
      /*  set config.addon.state === "on"*/
      if (config.addon.state === "OFF") app.content_script.send("update");
      else {
        app.tab.active(function (tab) {
          var root = "/data/content_script/";
          if (tab) config.top = (new URL(tab.url)).origin;
          /*  */
          app.tab.inject.js({"code": "typeof background"}, function (e) {
            if (e && e[0] !== "undefined") app.content_script.send("update");
            else {
              app.tab.inject.js({"file": root + "vendor/html2canvas.js"}, function () {
                app.tab.inject.js({"file": root + "inject.js"}, function () {});
              });
            }
          });
        });
      }
    }
  }
};

app.button.clicked(function () {
  core.update.addon(config.addon.state === "ON" ? "OFF" : "ON");
});

app.storage.changed(function (e) {
  if ("scale" in e) {
    core.update.addon(null);
  }
});

app.tab.updated(function (id, info, tab) {
  if (tab.active && info.status === "loading") {
    core.update.addon("OFF");
  }
});

chrome.permissions.onAdded.addListener(function () {core.update.addon(null)});
chrome.permissions.onRemoved.addListener(function () {core.update.addon(null)});

window.setTimeout(function () {
  core.update.addon("OFF");
}, 300);