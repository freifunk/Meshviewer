import * as L from "leaflet";

import { LocationMarker } from "./locationmarker";

var self = {};

var ButtonBase = L.Control.extend({
  options: {
    position: "bottomright",
  },

  active: false,
  button: undefined,

  initialize: function (f, options) {
    L.Util.setOptions(this, options);
    this.f = f;
  },

  update: function () {
    this.button.classList.toggle("active", this.active);
  },

  set: function (activeValue) {
    this.active = activeValue;
    this.update();
  },
});

var LocateButton = ButtonBase.extend({
  onAdd: function () {
    var button = L.DomUtil.create("button", "ion-locate");
    button.setAttribute("aria-label", _.t("button.tracking"));
    L.DomEvent.disableClickPropagation(button);
    L.DomEvent.addListener(button, "click", this.onClick, this);

    this.button = button;

    return button;
  },

  onClick: function () {
    this.f(!this.active);
  },
});

var CoordsPickerButton = ButtonBase.extend({
  onAdd: function () {
    var button = L.DomUtil.create("button", "ion-pin");
    button.setAttribute("aria-label", _.t("button.location"));

    // Click propagation isn't disabled as this causes problems with the
    // location picking mode; instead propagation is stopped in onClick().
    L.DomEvent.addListener(button, "click", this.onClick, this);

    this.button = button;

    return button;
  },

  onClick: function (e) {
    L.DomEvent.stopPropagation(e);
    this.f(!this.active);
  },
});

export const Button = function (map, buttons) {
  var userLocation;

  var locateUserButton = new LocateButton(function (activate) {
    if (activate) {
      enableTracking();
    } else {
      self.disableTracking();
    }
  });

  var mybuttons = [];

  function addButton(button) {
    var el = button.onAdd();
    mybuttons.push(el);
    buttons.appendChild(el);
  }

  self.clearButtons = function clearButtons() {
    mybuttons.forEach(function (button) {
      buttons.removeChild(button);
    });
  };

  var showCoordsPickerButton = new CoordsPickerButton(function (activate) {
    if (activate) {
      enableCoords();
    } else {
      disableCoords();
    }
  });

  function enableTracking() {
    map.locate({
      watch: true,
      enableHighAccuracy: true,
      setView: true,
    });
    locateUserButton.set(true);
  }

  self.disableTracking = function disableTracking() {
    map.stopLocate();
    self.locationError();
    locateUserButton.set(false);
  };

  function enableCoords() {
    map.getContainer().classList.add("pick-coordinates");
    map.on("click", showCoordinates);
    showCoordsPickerButton.set(true);
  }

  function disableCoords() {
    map.getContainer().classList.remove("pick-coordinates");
    map.off("click", showCoordinates);
    showCoordsPickerButton.set(false);
  }

  function showCoordinates(clicked) {
    router.fullUrl({ zoom: map.getZoom(), lat: clicked.latlng.lat, lng: clicked.latlng.lng });
    disableCoords();
  }

  self.locationFound = function locationFound(location) {
    if (!userLocation) {
      userLocation = new LocationMarker(location.latlng).addTo(map);
    }

    userLocation.setLatLng(location.latlng);
    userLocation.setAccuracy(location.accuracy);
  };

  self.locationError = function locationError() {
    if (userLocation) {
      map.removeLayer(userLocation);
      userLocation = null;
    }
  };

  self.init = function init() {
    addButton(locateUserButton);
    addButton(showCoordsPickerButton);
  };

  return self;
};
