import * as L from "leaflet";

import { ClientLayer } from "./map/clientlayer";
import { LabelLayer } from "./map/labellayer";
import { Button } from "./map/button";
import "./map/activearea";

var options = {
  worldCopyJump: true,
  zoomControl: true,
  minZoom: 0,
};

export const Map = function (linkScale, sidebar, buttons) {
  var self = this;
  var savedView;

  var map;
  var layerControl;
  var baseLayers = {};

  function saveView() {
    savedView = {
      center: map.getCenter(),
      zoom: map.getZoom(),
    };
  }

  function contextMenuOpenLayerMenu() {
    document.querySelector(".leaflet-control-layers").classList.add("leaflet-control-layers-expanded");
  }

  function mapActiveArea() {
    map.setActiveArea({
      position: "absolute",
      left: sidebar.getWidth() + "px",
      right: 0,
      top: 0,
      bottom: 0,
    });
  }

  function setActiveArea() {
    setTimeout(mapActiveArea, 300);
  }

  var el = document.createElement("div");
  el.classList.add("map");

  map = L.map(el, options);
  mapActiveArea();

  var now = new Date();
  config.mapLayers.forEach(function (item, i) {
    if (
      (typeof item.config.start === "number" && item.config.start <= now.getHours()) ||
      (typeof item.config.end === "number" && item.config.end > now.getHours())
    ) {
      item.config.order = item.config.start * -1;
    } else {
      item.config.order = i;
    }
  });

  config.mapLayers = config.mapLayers.sort(function (a, b) {
    return a.config.order - b.config.order;
  });

  var layers = config.mapLayers.map(function (layer) {
    return {
      name: layer.name,
      layer: L.tileLayer(
        layer.url.replace(
          "{format}",
          document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0 ? "webp" : "png",
        ),
        layer.config,
      ),
    };
  });

  map.addLayer(layers[0].layer);

  layers.forEach(function (layer) {
    baseLayers[layer.name] = layer.layer;
  });

  var button = new Button(map, buttons);

  map.on("locationfound", button.locationFound);
  map.on("locationerror", button.locationError);
  map.on("dragend", saveView);
  map.on("contextmenu", contextMenuOpenLayerMenu);

  if (config.geo) {
    [].forEach.call(config.geo, function (geo) {
      if (geo) {
        L.geoJSON(geo.json, geo.option).addTo(map);
      }
    });
  }

  button.init();

  layerControl = L.control.layers(baseLayers, [], { position: "bottomright" });
  layerControl.addTo(map);

  map.zoomControl.setPosition("topright");

  var clientLayer = new ClientLayer({ minZoom: config.clientZoom });
  clientLayer.addTo(map);
  clientLayer.setZIndex(5);

  var labelLayer = new LabelLayer({ minZoom: config.labelZoom });
  labelLayer.addTo(map);
  labelLayer.setZIndex(6);

  sidebar.button.addEventListener("visibility", setActiveArea);

  map.on("zoom", function () {
    clientLayer.redraw();
    labelLayer.redraw();
  });

  map.on("baselayerchange", function (e) {
    map.options.maxZoom = e.layer.options.maxZoom;
    clientLayer.options.maxZoom = map.options.maxZoom;
    labelLayer.options.maxZoom = map.options.maxZoom;
    if (map.getZoom() > map.options.maxZoom) {
      map.setZoom(map.options.maxZoom);
    }

    var style = document.querySelector('.css-mode:not([media="not"])');
    if (style && e.layer.options.mode !== "" && !style.classList.contains(e.layer.options.mode)) {
      style.media = "not";
      labelLayer.updateLayer();
    }
    if (e.layer.options.mode) {
      var newStyle = document.querySelector(".css-mode." + e.layer.options.mode);
      newStyle.media = "";
      newStyle.appendChild(document.createTextNode(""));
      labelLayer.updateLayer();
    }
  });

  map.on("load", function () {
    var inputs = document.querySelectorAll(".leaflet-control-layers-selector");
    [].forEach.call(inputs, function (input) {
      input.setAttribute("role", "radiogroup");
      input.setAttribute("aria-label", input.nextSibling.innerHTML.trim());
    });
  });

  var nodeDict = {};
  var linkDict = {};
  var highlight;

  function resetMarkerStyles(nodes, links) {
    Object.keys(nodes).forEach(function (id) {
      nodes[id].resetStyle();
    });

    Object.keys(links).forEach(function (id) {
      links[id].resetStyle();
    });
  }

  function setView(bounds, zoom) {
    map.fitBounds(bounds, { maxZoom: zoom ? zoom : config.nodeZoom });
  }

  function goto(element) {
    var bounds;

    if ("getBounds" in element) {
      bounds = element.getBounds();
    } else {
      bounds = L.latLngBounds([element.getLatLng()]);
    }

    setView(bounds);

    return element;
  }

  function updateView(nopanzoom) {
    resetMarkerStyles(nodeDict, linkDict);
    var target;

    if (highlight !== undefined) {
      if (highlight.type === "node" && nodeDict[highlight.o.node_id]) {
        target = nodeDict[highlight.o.node_id];
        target.setStyle(config.map.highlightNode);
      } else if (highlight.type === "link" && linkDict[highlight.o.id]) {
        target = linkDict[highlight.o.id];
        target.setStyle(config.map.highlightLink);
      }
    }

    if (!nopanzoom) {
      if (target) {
        goto(target);
      } else if (savedView) {
        map.setView(savedView.center, savedView.zoom);
      } else {
        setView(config.fixedCenter);
      }
    }
  }

  self.setData = function setData(data) {
    nodeDict = {};
    linkDict = {};

    clientLayer.setData(data);
    labelLayer.setData(data, map, nodeDict, linkDict, linkScale);

    updateView(true);
  };

  self.resetView = function resetView() {
    button.disableTracking();
    highlight = undefined;
    updateView();
  };

  self.gotoNode = function gotoNode(node) {
    button.disableTracking();
    highlight = { type: "node", o: node };
    updateView();
  };

  self.gotoLink = function gotoLink(link) {
    button.disableTracking();
    highlight = { type: "link", o: link[0] };
    updateView();
  };

  self.gotoLocation = function gotoLocation(destination) {
    button.disableTracking();
    map.setView([destination.lat, destination.lng], destination.zoom);
  };

  self.destroy = function destroy() {
    button.clearButtons();
    sidebar.button.removeEventListener("visibility", setActiveArea);
    map.remove();

    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  };

  self.render = function render(d) {
    d.appendChild(el);
    map.invalidateSize();
  };

  return self;
};
