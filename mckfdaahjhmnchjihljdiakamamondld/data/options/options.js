var load = function () {
  var cors = document.getElementById("cors");
  var scale = document.getElementById("scale-factor");
  /*  */
  scale.addEventListener("change", function (e) {
    var tmp = parseInt(e.target.value);
    tmp = tmp > 10 ? 10 : (tmp < 1 ? 1 : tmp);
    chrome.storage.local.set({"scale": tmp}, function () {});
  });
  /*  */
  cors.addEventListener("change", function (e) {
    if (e.target.checked) {
      chrome.permissions.request({
        "origins": ["*://*/*"],
        "permissions": ["webRequest", "webRequestBlocking"]
      }, function () {
        chrome.permissions.contains({
          "origins": ["*://*/*"],
          "permissions": ["webRequest", "webRequestBlocking"]
        }, function (e) {
          cors.checked = e;
        });
      });
    } else {
      chrome.permissions.remove({
        "origins": ["*://*/*"],
        "permissions": ["webRequest", "webRequestBlocking"]
      }, function () {
        chrome.permissions.contains({
          "origins": ["*://*/*"],
          "permissions": ["webRequest", "webRequestBlocking"]
        }, function (e) {
          cors.checked = e;
        });
      });
    }
  });
  /*  */
  window.removeEventListener("load", load, false);
  chrome.storage.local.get({"scale": 2}, function (e) {scale.value = e.scale});
  chrome.permissions.contains({
    "origins": ["*://*/*"],
    "permissions": ["webRequest", "webRequestBlocking"]
  }, function (e) {
    cors.checked = e;
  });
};

window.addEventListener("load", load, false);
