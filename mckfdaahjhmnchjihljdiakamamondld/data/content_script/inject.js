if (background === undefined) {
  var background = (function () {
    var tmp = {};
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      for (var id in tmp) {
        if (tmp[id] && (typeof tmp[id] === "function")) {
          if (request.path === "background-to-page") {
            if (request.method === id) tmp[id](request.data);
          }
        }
      }
    });
    /*  */
    return {
      "receive": function (id, callback) {tmp[id] = callback},
      "send": function (id, data) {chrome.runtime.sendMessage({"path": "page-to-background", "method": id, "data": data})}
    }
  })();
  
  var config = {
    "scale": 2,
    "DOM": {
      "element": {
        "current": null, 
        "previous": null
      }
    },
    "lightbox": {
      "element": {},
      "remove": function () {
        if (config.lightbox.element.a) config.lightbox.element.a.remove();
        if (config.lightbox.element.img) config.lightbox.element.img.remove();
        if (config.lightbox.element.close) config.lightbox.element.close.remove();
        if (config.lightbox.element.download) config.lightbox.element.download.remove();
        if (config.lightbox.element.container) config.lightbox.element.container.remove();
        if (config.lightbox.element.a) window.URL.revokeObjectURL(config.lightbox.element.a.href);
        /*  */
        config.lightbox.element = {};
      }
    },
    "update": function () {
      config.lightbox.remove();
      chrome.storage.local.get({"state": "OFF", "scale": 2}, function (o) {
        config.scale = o.scale;
        /*  */
        config.link.removeAttribute("href");
        window.removeEventListener("click", config.click, true);
        document.removeEventListener("keydown", config.keydown, false);
        document.removeEventListener("mouseover", config.mouseover, false);
        if (config.DOM.element.previous) config.DOM.element.previous.removeAttribute("html-elements-screenshot-mouseover-effect");
        /*  */
        if (o.state === "ON") {
          window.addEventListener("click", config.click, true);
          document.addEventListener("keydown", config.keydown, false);
          document.addEventListener("mouseover", config.mouseover, false);
          config.link.setAttribute("href", chrome.runtime.getURL("data/content_script/inject.css"));
        }
      });
    },
    "mouseover": function (e) {
      if (e && e.target) {
        if (e.target !== config.lightbox.element.img) {
          if (e.target !== config.lightbox.element.close) {
            if (e.target !== config.lightbox.element.download) {
              if (e.target !== config.lightbox.element.container) {
                if (e.target !== config.DOM.element.previous) {
                  if (config.DOM.element.previous) config.DOM.element.previous.removeAttribute("html-elements-screenshot-mouseover-effect");
                  config.DOM.element.current = e.target;
                  config.DOM.element.current.setAttribute("html-elements-screenshot-mouseover-effect", '');
                  config.DOM.element.previous = config.DOM.element.current;
                }
              }
            }
          }
        }
      }
    },
    "click": function (e) {
      var action = e.target === config.DOM.element.current;
      var close = config.lightbox.element.close && e.target === config.lightbox.element.close;
      var download = config.lightbox.element.download && e.target === config.lightbox.element.download;
      var img = config.lightbox.element.img && e.target !== config.lightbox.element.img && e.target !== config.lightbox.element.a;
      /*  */
      if (close) chrome.storage.local.set({"state": "OFF"}, function () {});
      else if (download) {
        config.lightbox.element.a = document.createElement('a');
        config.lightbox.element.a.setAttribute("title", "Save screenshot");
        config.lightbox.element.a.href = config.lightbox.element.img.src;
        config.lightbox.element.a.download = "screenshot.png";
        document.body.appendChild(config.lightbox.element.a);
    		config.lightbox.element.a.click();
      }
      else if (img) config.lightbox.remove();
      else if (action) {
        e.stopPropagation();
        e.preventDefault();
        /*  */
        config.lightbox.element.img = document.createElement("img");
        config.lightbox.element.close = document.createElement("div");
        config.lightbox.element.download = document.createElement("div");
        config.lightbox.element.container = document.createElement("div");        
        /*  */
        config.lightbox.element.close.textContent = "⛌";
        config.lightbox.element.download.textContent = "⇩";
        config.lightbox.element.img.setAttribute("class", "lightbox-loader");
        config.lightbox.element.close.setAttribute("class", "lightbox-close");
        config.lightbox.element.download.setAttribute("class", "lightbox-download");
        config.lightbox.element.container.setAttribute("class", "lightbox-container");
        config.lightbox.element.img.src = chrome.runtime.getURL("data/content_script/loader/loader.svg");
        /*  */
        config.lightbox.element.container.appendChild(config.lightbox.element.img);
        config.lightbox.element.container.appendChild(config.lightbox.element.close);
        config.lightbox.element.container.appendChild(config.lightbox.element.download);
        document.body.appendChild(config.lightbox.element.container);
        /*  */
        try {
          var options = {
            "scrollX": 0,
            "useCORS": true,
            "logging": false,
            "scale": config.scale,
            "scrollY": -1 * window.scrollY
          };
          /*  */
          config.DOM.element.current.removeAttribute("html-elements-screenshot-mouseover-effect");
          html2canvas(config.DOM.element.current, options).then(canvas => {
            if (canvas) {
              canvas.toBlob(function (blob) {
                if (blob) {
                  window.setTimeout(function () {
                    if (config.lightbox.element.img) {
                      config.lightbox.element.img.removeAttribute("class");
                      config.lightbox.element.img.src = window.URL.createObjectURL(blob);
                    }
                  }, 300);
                }
              });
            }
          }).catch(function (e) {
            //console.error(e);
          });
        } catch (e) {
          //console.error(e);
        }
        /*  */
        window.setTimeout(function () {
          config.lightbox.element.container.style.opacity = 1;
          config.lightbox.element.container.style.display = "flex";
        }, 100);        
      }
    }
  };
  /*  */
  config.link = document.createElement("link");
  config.link.setAttribute("type", "text/css");
  config.link.setAttribute("rel", "stylesheet");
  document.documentElement.appendChild(config.link);
  /*  */
  config.update();
  background.receive("update", config.update);
} else config.update();
