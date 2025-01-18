import Navigo, { Match } from "navigo";
import { Language } from "./language";
import { Link, NodeId } from "./node";
import { Moment } from "moment";

export interface Objects {
  nodeDict: NodeId[];
  links: Link[];
  nodes?: Node[];
  now?: Moment;
  timestamp?: Moment;
}

export interface TargetLocation {
  lng: number;
  zoom: number;
  lat: number;
}

export interface Target {
  resetView(): void;
  gotoNode(nodeId: NodeId, nodeIdList: NodeId[]): any;
  gotoLink(link: Link[]): any;
  gotoLocation(locationData: TargetLocation): any;
}

interface Views {
  [k: string]: () => any;
}

export class Router extends Navigo {
  init = false;
  objects: Objects = { nodeDict: [], links: [] };
  targets: Target[] = [];
  views: Views = {};
  currentState = {
    lang: undefined, // like de or en
    view: undefined, // map or graph
    node: undefined, // Node ID
    link: undefined, // Two node IDs concatenated by -
    zoom: undefined,
    lat: undefined,
    lng: undefined,
  };
  state = { lang: null, view: "map" };
  language = undefined;

  constructor(language: ReturnType<typeof Language>) {
    super("/", { hash: true });
    this.language = language;
    this.state.lang = language.getLocale();
    this.initRoutes();
  }

  resetView() {
    this.targets.forEach(function (target) {
      target.resetView();
    });
  }

  gotoNode(node: { nodeId: NodeId }) {
    if (this.objects.nodeDict[node.nodeId]) {
      this.targets.forEach((target) => {
        target.gotoNode(this.objects.nodeDict[node.nodeId], this.objects.nodeDict);
      });
    }
  }

  gotoLink(linkData: { linkId: string }) {
    let link = this.objects.links.filter(function (value) {
      return value.id === linkData.linkId;
    });
    if (link) {
      this.targets.forEach(function (target) {
        target.gotoLink(link);
      });
    }
  }

  view(data: { view: string }) {
    if (data.view in this.views) {
      this.views[data.view]();
      this.state.view = data.view;
      this.resetView();
    }
  }

  customRoute(match?: Match) {
    let lang: string | undefined = match.data[0];
    let viewValue: "map" | "graph" | string | undefined = match.data[1];
    let node: string | undefined = match.data[2];
    let link: string | undefined = match.data[3];
    let zoom: number | string | undefined = match.data[4];
    let lat: number | string | undefined = match.data[5];
    let lng: number | string | undefined = match.data[6];

    this.currentState = {
      lang: lang,
      view: viewValue,
      node: node,
      link: link,
      zoom: zoom,
      lat: lat,
      lng: lng,
    };

    if (lang && lang !== this.state.lang && lang === this.language.getLocale(lang)) {
      console.debug("Language change reload");
      location.hash = "/" + match.url;
      location.reload();
    }

    if (!this.init || (viewValue && viewValue !== this.state.view)) {
      if (!viewValue) {
        viewValue = this.state.view;
      }
      this.view({ view: viewValue });
      this.init = true;
    }

    if (node) {
      this.gotoNode({ nodeId: node });
    } else if (link) {
      this.gotoLink({ linkId: link });
    } else if (lat) {
      this.targets.forEach((target) => {
        target.gotoLocation({
          zoom: parseInt(this.currentState.zoom, 10),
          lat: parseFloat(this.currentState.lat),
          lng: parseFloat(this.currentState.lng),
        });
      });
    } else {
      this.resetView();
    }
  }

  initRoutes() {
    this.on(
      // Redirect legacy URL format
      /^\/?!(.*)?$/,
      (match?: Match) => {
        console.debug("fixing legacy url");
        this.navigate(match.data[0]);
      },
    )
      .on(
        // lang, viewValue, node, link, zoom, lat, lon
        /^\/?(\w{2})?\/?(map|graph)?\/?([a-f\d]{12})?([a-f\d\-]{25})?\/?(?:(\d+)\/(-?[\d.]+)\/(-?[\d.]+))?$/,
        (match?: Match) => {
          this.customRoute(match);
        },
      )
      // Default response
      .on(() => {
        console.debug("default route redirect");
        this.fullUrl();
      })
      // 404 response
      .notFound(() => {
        console.debug("notFound redirect");
        this.fullUrl();
      });
  }

  generateLink(data?: {}, full?: boolean, deep?: boolean) {
    let result = "";

    if (full) {
      data = Object.assign({}, this.state, data);
    } else if (deep) {
      result = "#";
      data = Object.assign({}, this.currentState, data);
    }

    for (let key in data) {
      if (!data.hasOwnProperty(key) || data[key] === undefined || data[key] === "") {
        continue;
      }
      result += "/" + data[key];
    }

    return result;
  }

  fullUrl(data?: {}, e?: Event | false, deep?: boolean) {
    if (e) {
      e.preventDefault();
    }
    this.navigate(this.generateLink(data, !deep, deep));
  }

  getLang() {
    let lang = location.hash.match(/^\/?#?\/(\w{2})\//);
    if (lang) {
      this.state.lang = this.language.getLocale(lang[1]);
      return lang[1];
    }
    return null;
  }

  addTarget(target: Target) {
    this.targets.push(target);
  }
  removeTarget(target: Target) {
    this.targets = this.targets.filter(function (t) {
      return target !== t;
    });
  }

  addView(key: string, view: () => any) {
    this.views[key] = view;
  }

  currentView(): string | undefined {
    return this.currentState.view;
  }

  setData(data: Objects) {
    this.objects = data;
  }
}
