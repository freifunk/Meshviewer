import { LanguageCode } from "./utils/language.js";
import { Node, NodeId } from "./utils/node.js";
import { GeoJSONOptions, GridLayerOptions, LatLngBoundsExpression } from "leaflet";
import { GeoJsonObject } from "geojson";

interface NodeAttr {
  name: string;
  // value can be a node attribute (1 depth) or a function in utils/node with prefix show
  value: string | ((d: Node) => string) | ((d: Node, nodeDict: { [k: NodeId]: Node }) => string);
  // Examples for functions
  // {
  //   // no name will remove first column
  //   'value': function (d) {
  //     var moment = require('moment');
  //     var V = require('snabbdom').default;
  //     return V.h('td', { props: { colSpan: 2 }, style: { background: '#49a' } },
  //       _.t('sidebar.nodeOnline') + ' translate, ' + moment(d.firstseen).get('month') +
  //       ' Month require libs like moment, access config ' + config.siteName);
  //   }
  // },
  // {
  //   'name': 'Neighbour first seen',
  //   'value': function (d, nodeDict) {
  //     return nodeDict[d.gateway_nexthop].firstseen.format() + 'access node object';
  //   }
  // },
}

interface Icon {
  fillOpacity?: number;
  opacity?: number;
  weight?: number;
  radius?: number;
  className?: string;
  color?: string;
  fillColor?: string;
  stroke?: boolean;
}

export interface Domain {
  name: string;
  domain: string;
}

interface Info {
  name: string;
  title: string;
  href: string;
  image?: string;
  width?: string;
  height?: string;
}

export type LinkInfo = Info;
export type NodeInfo = Info;

export interface Link {
  title: string;
  href: string;
}

export interface MapLayer {
  name: string;
  url: string;
  config: GridLayerOptions & {
    start?: number; // Hour
    end?: number; // Hour
    order: number;
  };
}

export interface Geo {
  json: GeoJsonObject;
  option: GeoJSONOptions;
}

export interface Config {
  siteName: string;
  dataPath: string[];
  mapLayers: MapLayer[];
  linkList?: Link[];
  reverseGeocodingApi: string;
  maxAge: number;
  maxAgeAlert: number;
  nodeZoom: number;
  labelZoom: number;
  clientZoom: number;
  fullscreen: boolean;
  fullscreenFrame: boolean;
  nodeAttr: NodeAttr[];
  // List of two letter locale names
  supportedLocale: LanguageCode[];
  // Cache breaker string used when loading language json files
  cacheBreaker?: string;
  // Color configs
  icon: {
    base: Icon;
    online: Icon;
    "online.uplink": Icon;
    offline: Icon;
    lost: Icon;
    alert: Icon;
    new: Icon;
    "new.uplink": Icon;
  };
  client: {
    // Colors
    wifi24: string;
    wifi5: string;
    other: string;
  };
  map: {
    labelNewColor: string;
    tqFrom: string;
    tqTo: string;
    highlightNode: {
      color: string;
      weight: number;
      fillOpacity: number;
      opacity: number;
      className: string;
    };
    highlightLink: {
      weight: number;
      opacity: number;
      dashArray: string;
    };
  };
  forceGraph: {
    nodeColor: string;
    nodeOfflineColor: string;
    highlightColor: string;
    labelColor: string;
    tqFrom: string;
    tqTo: string;
    zoomModifier: number;
  };
  locate: {
    outerCircle: {
      stroke: boolean;
      color: string;
      opacity: number;
      fillOpacity: number;
      clickable: boolean;
      radius: number;
    };
    innerCircle: {
      stroke: boolean;
      color: string;
      fillColor: string;
      weight: number;
      clickable: false;
      opacity: number;
      fillOpacity: number;
      radius: number;
    };
    accuracyCircle: {
      stroke: boolean;
      color: string;
      weight: number;
      clickable: boolean;
      opacity: number;
      fillOpacity: number;
    };
  };
  globalInfos: LinkInfo[];
  linkTypeInfos: LinkInfo[];
  linkInfos: LinkInfo[];
  nodeInfos: NodeInfo[];
  deprecation_enabled: boolean;
  eol: string[];
  deprecated: string[];
  eol_text?: string;
  deprecation_text?: string;
  domainNames: Domain[];
  node_custom: string; // Custom node replacement regex
  devicePictures: string;
  devicePicturesSource: string;
  devicePicturesLicense: string;
  geo?: Geo[];
  fixedCenter: LatLngBoundsExpression;
}

export const config: Config = {
  siteName: "",
  dataPath: [],
  mapLayers: [],
  linkList: [],
  fixedCenter: undefined,
  geo: [],
  reverseGeocodingApi: "https://nominatim.openstreetmap.org/reverse",
  maxAge: 14,
  maxAgeAlert: 3,
  nodeZoom: 18,
  labelZoom: 13,
  clientZoom: 15,
  fullscreen: true,
  fullscreenFrame: true,
  nodeAttr: [
    // value can be a node attribute (1 depth) or a function in utils/node with prefix show
    {
      name: "node.status",
      value: "Status",
    },
    {
      name: "node.gateway",
      value: "Gateway",
    },
    {
      name: "node.coordinates",
      value: "GeoURI",
    },
    {
      name: "node.hardware",
      value: "model",
    },
    {
      name: "node.primaryMac",
      value: "mac",
    },
    {
      name: "node.firmware",
      value: "Firmware",
    },
    {
      name: "node.uptime",
      value: "Uptime",
    },
    {
      name: "node.firstSeen",
      value: "FirstSeen",
    },
    {
      name: "node.systemLoad",
      value: "Load",
    },
    {
      name: "node.ram",
      value: "RAM",
    },
    {
      name: "node.ipAddresses",
      value: "IPs",
    },
    {
      name: "node.update",
      value: "Autoupdate",
    },
    {
      name: "node.domain",
      value: "Domain",
    },
    {
      name: "node.clients",
      value: "Clients",
    },
  ],
  supportedLocale: ["en", "de", "cz", "fr", "tr", "ru"],
  // Color configs
  icon: {
    base: {
      fillOpacity: 0.6,
      opacity: 0.6,
      weight: 2,
      radius: 6,
      className: "stroke-first",
    },
    online: {
      color: "#1566A9",
      fillColor: "#1566A9",
      radius: 8,
      stroke: false,
    },
    "online.uplink": {
      fillColor: "#cde",
      stroke: true,
      radius: 4,
      weight: 10,
    },
    offline: {
      color: "#D43E2A",
      fillColor: "#D43E2A",
      radius: 3,
    },
    lost: {
      color: "#D43E2A",
      fillColor: "#D43E2A",
      radius: 4,
    },
    alert: {
      color: "#D43E2A",
      fillColor: "#D43E2A",
      radius: 5,
    },
    new: {
      color: "#1566A9",
      fillColor: "#93E929",
    },
    "new.uplink": {
      stroke: true,
      radius: 4,
      weight: 10,
    },
  },
  client: {
    wifi24: "rgba(220, 0, 103, 0.7)",
    wifi5: "rgba(10, 156, 146, 0.7)",
    other: "rgba(227, 166, 25, 0.7)",
  },
  map: {
    labelNewColor: "#459c18",
    tqFrom: "#F02311",
    tqTo: "#04C714",
    highlightNode: {
      color: "#ad2358",
      weight: 8,
      fillOpacity: 1,
      opacity: 0.4,
      className: "stroke-first",
    },
    highlightLink: {
      weight: 4,
      opacity: 1,
      dashArray: "5, 10",
    },
  },
  forceGraph: {
    nodeColor: "#fff",
    nodeOfflineColor: "#D43E2A",
    highlightColor: "rgba(255, 255, 255, 0.2)",
    labelColor: "#fff",
    tqFrom: "#770038",
    tqTo: "#dc0067",
    zoomModifier: 1,
  },
  locate: {
    outerCircle: {
      stroke: false,
      color: "#4285F4",
      opacity: 1,
      fillOpacity: 0.3,
      clickable: false,
      radius: 16,
    },
    innerCircle: {
      stroke: true,
      color: "#ffffff",
      fillColor: "#4285F4",
      weight: 1.5,
      clickable: false,
      opacity: 1,
      fillOpacity: 1,
      radius: 7,
    },
    accuracyCircle: {
      stroke: true,
      color: "#4285F4",
      weight: 1,
      clickable: false,
      opacity: 0.7,
      fillOpacity: 0.2,
    },
  },
  eol: [
    "A5-V11",
    "AP121",
    "AP121U",
    "D-Link DIR-615",
    "D-Link DIR-615 D",
    "AVM FRITZ!Box 7320",
    "AVM FRITZ!Box 7330",
    "AVM FRITZ!Box 7330 SL",
    "TP-Link TL-MR13U v1",
    "TP-Link TL-MR3020 v1",
    "TP-Link TL-MR3040 v1",
    "TP-Link TL-MR3040 v2",
    "TP-Link TL-MR3220 v1",
    "TP-Link TL-MR3220 v2",
    "TP-Link TL-MR3420 v1",
    "TP-Link TL-MR3420 v2",
    "TP-Link TL-WA701N/ND v1",
    "TP-Link TL-WA701N/ND v2",
    "TP-Link TL-WA730RE v1",
    "TP-Link TL-WA750RE v1",
    "TP-Link TL-WA801N/ND v1",
    "TP-Link TL-WA801N/ND v2",
    "TP-Link TL-WA801N/ND v3",
    "TP-Link TL-WA830RE v1",
    "TP-Link TL-WA830RE v2",
    "TP-Link TL-WA850RE v1",
    "TP-Link TL-WA860RE v1",
    "TP-Link TL-WA901N/ND v1",
    "TP-Link TL-WA901N/ND v2",
    "TP-Link TL-WA901N/ND v3",
    "TP-Link TL-WA901N/ND v4",
    "TP-Link TL-WA901N/ND v5",
    "TP-Link TL-WA7210N v2",
    "TP-Link TL-WA7510N v1",
    "TP-Link TL-WR703N v1",
    "TP-Link TL-WR710N v1",
    "TP-Link TL-WR710N v2",
    "TP-Link TL-WR710N v2.1",
    "TP-Link TL-WR740N/ND v1",
    "TP-Link TL-WR740N/ND v3",
    "TP-Link TL-WR740N/ND v4",
    "TP-Link TL-WR740N/ND v5",
    "TP-Link TL-WR741N/ND v1",
    "TP-Link TL-WR741N/ND v3",
    "TP-Link TL-WR741N/ND v4",
    "TP-Link TL-WR741N/ND v5",
    "TP-Link TL-WR743N/ND v1",
    "TP-Link TL-WR743N/ND v2",
    "TP-Link TL-WR840N v2",
    "TP-Link TL-WR841N/ND v3",
    "TP-Link TL-WR841N/ND v5",
    "TP-Link TL-WR841N/ND v7",
    "TP-Link TL-WR841N/ND v8",
    "TP-Link TL-WR841N/ND v9",
    "TP-Link TL-WR841N/ND v10",
    "TP-Link TL-WR841N/ND v11",
    "TP-Link TL-WR841N/ND v12",
    "TP-Link TL-WR841N/ND Mod (16M) v11",
    "TP-Link TL-WR841N/ND Mod (16M) v10",
    "TP-Link TL-WR841N/ND Mod (16M) v8",
    "TP-Link TL-WR841N/ND Mod (16M) v9",
    "TP-Link TL-WR841N/ND Mod (8M) v10",
    "TP-Link TL-WR842N/ND v1",
    "TP-Link TL-WR842N/ND v2",
    "TP-Link TL-WR843N/ND v1",
    "TP-Link TL-WR940N v1",
    "TP-Link TL-WR940N v2",
    "TP-Link TL-WR940N v3",
    "TP-Link TL-WR940N v4",
    "TP-Link TL-WR940N v5",
    "TP-Link TL-WR940N v6",
    "TP-Link TL-WR941N/ND v2",
    "TP-Link TL-WR941N/ND v3",
    "TP-Link TL-WR941N/ND v4",
    "TP-Link TL-WR941N/ND v5",
    "TP-Link TL-WR941N/ND v6",
    "TP-Link TL-WR1043N/ND v1",
    "D-Link DIR-615 D1",
    "D-Link DIR-615 D2",
    "D-Link DIR-615 D3",
    "D-Link DIR-615 D4",
    "D-Link DIR-615 H1",
    "Ubiquiti NanoStation loco M2",
    "Ubiquiti NanoStation M2",
    "Ubiquiti PicoStation M2",
    "Ubiquiti Bullet M",
    "Ubiquiti Bullet M2",
    "Ubiquiti AirRouter",
    "VoCore 8M",
    "VoCore 16M",
    "WD My Net N600",
    "WD My Net N750",
  ],
  deprecated: [
    "TP-LINK RE305",
    "TP-Link RE305 v1",
    "TP-LINK RE355",
    "TP-Link RE355 v1",
    "TP-LINK RE450",
    "TP-Link RE450 v1",
  ],
  deprecation_enabled: true,
  eol_text: undefined,
  deprecation_text: undefined,
  domainNames: [],
  globalInfos: [],
  linkTypeInfos: [],
  linkInfos: [],
  nodeInfos: [],
  node_custom: "",
  devicePictures: "https://map.aachen.freifunk.net/pictures-svg/{MODEL_NORMALIZED}.svg",
  devicePicturesSource:
    "<a href='https://github.com/freifunk/device-pictures'>https://github.com/freifunk/device-pictures</a>",
  devicePicturesLicense: "CC-BY-NC-SA 4.0",
};
