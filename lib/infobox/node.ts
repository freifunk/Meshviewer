import { h, classModule, eventListenersModule, init, propsModule, styleModule } from "snabbdom";
import { _ } from "../utils/language.js";

import { SortTable } from "../sorttable.js";
import * as helper from "../utils/helper.js";
import nodef, { Neighbour, Node as NodeData, NodeId } from "../utils/node.js";
import { NodeInfo } from "../config_default.js";

const patch = init([classModule, propsModule, styleModule, eventListenersModule]);

function showStatImg(nodeInfo: NodeInfo, node: NodeData): HTMLDivElement {
  let config = window.config;
  let subst = {
    "{NODE_ID}": node.node_id,
    "{NODE_NAME}": node.hostname.replace(/[^a-z0-9\-]/gi, "_"),
    "{NODE_CUSTOM}": node.hostname.replace(config.node_custom, "_"),
    "{TIME}": node.lastseen.format("DDMMYYYYHmmss"),
    "{LOCALE}": _.locale(),
  };
  return helper.showStat(nodeInfo, subst);
}

function showDevicePictures(pictures: string, device: NodeData) {
  if (!device.model) {
    return null;
  }
  let subst = {
    "{MODEL}": device.model,
    "{NODE_NAME}": device.hostname,
    "{MODEL_HASH}": device.model
      .split("")
      .reduce(function (a, b) {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
      .toString(),
    "{MODEL_NORMALIZED}": device.model
      .toLowerCase()
      .replace(/[^a-z0-9.\-]+/gi, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, ""),
  };
  return helper.showDevicePicture(pictures, subst);
}

export function Node(el: HTMLElement, node: NodeData, linkScale: (t: any) => any, nodeDict: { [k: NodeId]: NodeData }) {
  let config = window.config;
  let router = window.router;

  function nodeLink(node: NodeData) {
    return h(
      "a",
      {
        props: {
          className: node.is_online ? "online" : "offline",
          href: router.generateLink({ node: node.node_id }),
        },
        on: {
          click: function (e: Event) {
            router.fullUrl({ node: node.node_id }, e);
          },
        },
      },
      node.hostname,
    );
  }

  function nodeIdLink(nodeId: NodeId) {
    if (nodeDict[nodeId]) {
      return nodeLink(nodeDict[nodeId]);
    }
    return nodeId;
  }

  function showGateway(node: NodeData) {
    let gatewayCols = [
      h("span", [nodeIdLink(node.gateway_nexthop), h("br"), _.t("node.nexthop")]),
      h("span", { props: { className: "ion-arrow-right-c" } }),
      h("span", [nodeIdLink(node.gateway), h("br"), "IPv4"]),
    ];

    if (node.gateway6 !== undefined) {
      gatewayCols.push(h("span", [nodeIdLink(node.gateway6), h("br"), "IPv6"]));
    }

    return h("td", { props: { className: "gateway" } }, gatewayCols);
  }

  function renderNeighbourRow(connecting: Neighbour) {
    let icons = [
      h("span", {
        props: {
          className: "icon ion-" + (connecting.link.type.indexOf("wifi") === 0 ? "wifi" : "share-alt"),
          title: _.t(connecting.link.type),
        },
      }),
    ];
    if (helper.hasLocation(connecting.node)) {
      icons.push(h("span", { props: { className: "ion-location", title: _.t("location.location") } }));
    }

    return h("tr", [
      h("td", icons),
      h("td", nodeLink(connecting.node)),
      h("td", connecting.node.clients),
      h("td", [
        h(
          "a",
          {
            style: {
              color: linkScale((connecting.link.source_tq + connecting.link.target_tq) / 2),
            },
            props: {
              title: connecting.link.source.hostname + " - " + connecting.link.target.hostname,
              href: router.generateLink({ link: connecting.link.id }),
            },
            on: {
              click: function (e: Event) {
                router.fullUrl({ link: connecting.link.id }, e);
              },
            },
          },
          helper.showTq(connecting.link.source_tq) + " - " + helper.showTq(connecting.link.target_tq),
        ),
      ]),
      h("td", helper.showDistance(connecting.link)),
    ]);
  }

  const self = {
    render: undefined,
    setData: undefined,
  };
  let header = document.createElement("h2");
  let devicePicture = document.createElement("div");
  let table = document.createElement("table");
  let images = document.createElement("div");
  let neighbours = document.createElement("h3");
  let headings = [
    {
      name: "",
      sort: function (a: Neighbour, b: Neighbour) {
        return a.link.type.localeCompare(b.link.type);
      },
    },
    {
      name: "node.nodes",
      sort: function (a: Neighbour, b: Neighbour) {
        return a.node.hostname.localeCompare(b.node.hostname);
      },
      reverse: false,
    },
    {
      name: "node.clients",
      class: "ion-people",
      sort: function (a: Neighbour, b: Neighbour) {
        return a.node.clients - b.node.clients;
      },
      reverse: true,
    },
    {
      name: "node.tq",
      class: "ion-connection-bars",
      sort: function (a: Neighbour, b: Neighbour) {
        return a.link.source_tq - b.link.source_tq;
      },
      reverse: true,
    },
    {
      name: "node.distance",
      class: "ion-arrow-resize",
      sort: function (a: Neighbour, b: Neighbour) {
        return (
          (a.link.distance === undefined ? -1 : a.link.distance) -
          (b.link.distance === undefined ? -1 : b.link.distance)
        );
      },
      reverse: true,
    },
  ];
  let tableNeighbour = SortTable(headings, 1, renderNeighbourRow);

  // Prepare deprecation warning. At first not displayed, text follows later
  let deprecation = document.createElement("div");
  deprecation.setAttribute("class", "deprecated");
  deprecation.setAttribute("style", "display: none;");
  deprecation.innerHTML = "<div>" + (config.deprecation_text || _.t("deprecation-text")) + "</div>";

  var eol = document.createElement("div");
  eol.setAttribute("class", "eol");
  eol.setAttribute("style", "display: none;");
  eol.innerHTML = "<div>" + (config.eol_text || _.t("eol-text")) + "</div>";

  el.appendChild(header);
  el.appendChild(devicePicture);
  el.appendChild(deprecation);
  el.appendChild(eol);
  el.appendChild(table);
  el.appendChild(neighbours);
  el.appendChild(tableNeighbour.el);
  el.appendChild(images);

  self.render = function render() {
    patch(header, h("h2", node.hostname));

    let devicePictures = showDevicePictures(config.devicePictures, node);
    let devicePicturesContainerData = {
      props: {
        class: "hw-img-container",
      },
    };
    patch(devicePicture, devicePictures ? h("div", devicePicturesContainerData, devicePictures) : h("div"));

    let children = [];

    config.nodeAttr.forEach(function (row) {
      let field = node[String(row.value)];
      if (typeof row.value === "function") {
        field = row.value(node, nodeDict);
      } else if (nodef["show" + row.value] !== undefined) {
        field = nodef["show" + row.value](node);
      }
      // Check if device is in list of deprecated devices. If so, display the deprecation warning
      if (config.deprecation_enabled) {
        if (row.name === "node.hardware") {
          if (config.eol && field && config.eol.includes(field)) {
            eol.setAttribute("style", "display: block;");
          } else if (config.deprecated && field && config.deprecated.includes(field)) {
            deprecation.setAttribute("style", "display: block;");
          }
        }
      }

      if (field) {
        if (typeof field !== "object") {
          field = h("td", field);
        }
        children.push(h("tr", [row.name !== undefined ? h("th", _.t(row.name)) : null, field]));
      }
    });

    children.push(h("tr", [h("th", _.t("node.gateway")), showGateway(node)]));

    let elNew = h("table", children);
    patch(table, elNew);
    table.classList.add("attributes");

    patch(neighbours, h("h3", _.t("node.link", node.neighbours.length) + " (" + node.neighbours.length + ")"));
    if (node.neighbours.length > 0) {
      tableNeighbour.setData(node.neighbours);
      tableNeighbour.el.classList.add("node-links");
    }

    if (config.nodeInfos) {
      let img = [];
      config.nodeInfos.forEach(function (nodeInfo) {
        img.push(h("h4", nodeInfo.name) as unknown as HTMLElement);
        img.push(showStatImg(nodeInfo, node));
      });
      patch(images, h("div", img));
    }
  };

  self.setData = function setData(data: { nodeDict: { [x: NodeId]: NodeData } }) {
    if (data.nodeDict[node.node_id]) {
      node = data.nodeDict[node.node_id];
    }
    self.render();
  };
  return self;
}
