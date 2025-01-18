import { classModule, eventListenersModule, h, init, propsModule, styleModule, toVNode } from "snabbdom";
import * as d3Interpolate from "d3-interpolate";
import { _ } from "./utils/language.js";
import { DataDistributor, Filter, ObjectsLinksAndNodes } from "./datadistributor.js";
import { GenericNodeFilter } from "./filters/genericnode.js";
import * as helper from "./utils/helper.js";
import { compare } from "./utils/version.js";
import { Moment } from "moment";
import { Node } from "./utils/node.js";

const patch = init([classModule, propsModule, styleModule, eventListenersModule]);

export const Proportions = function (filterManager: ReturnType<typeof DataDistributor>) {
  const self = {
    setData: undefined,
    render: undefined,
    renderSingle: undefined,
  };
  let config = window.config;
  let scale = d3Interpolate.interpolate(config.forceGraph.tqFrom, config.forceGraph.tqTo);
  let time: Moment;

  let statusTable: HTMLTableElement;
  let fwTable: HTMLTableElement;
  let baseTable: HTMLTableElement;
  let depTable: HTMLTableElement;
  let hwTable: HTMLTableElement;
  let geoTable: HTMLTableElement;
  let autoTable: HTMLTableElement;
  let gatewayTable: HTMLTableElement;
  let gateway6Table: HTMLTableElement;
  let domainTable: HTMLTableElement;

  function count(nodes: Node[], key: string[], f?: (k: any) => any) {
    let dict = {};

    nodes.forEach(function (node) {
      let dictKey = helper.dictGet(node, key.slice(0));

      if (f !== undefined) {
        dictKey = f(dictKey);
      }

      if (dictKey === null) {
        return;
      }

      dict[dictKey] = 1 + (dictKey in dict ? dict[dictKey] : 0);
    });

    return Object.keys(dict).map(function (dictKey) {
      return [dictKey, dict[dictKey], key, f];
    });
  }

  function addFilter(filter: Filter) {
    return function () {
      filterManager.addFilter(filter);
      return false;
    };
  }

  function fillTable(name: string, table: HTMLTableElement | undefined, data: any[][]): HTMLTableElement {
    if (!table) {
      table = document.createElement("table");
    }

    let max = Math.max.apply(
      Math,
      data.map(function (data) {
        return data[1];
      }),
    );

    let items = data.map(function (data) {
      let v = data[1] / max;

      let filter = GenericNodeFilter(_.t(name), data[2], data[0], data[3]);

      let a = h("a", { on: { click: addFilter(filter) } }, data[0]);

      let th = h("th", a);
      let td = h(
        "td",
        h(
          "span",
          {
            style: {
              width: "calc(25px + " + Math.round(v * 90) + "%)",
              backgroundColor: scale(v),
            },
          },
          data[1].toFixed(0),
        ),
      );

      return h("tr", [th, td]);
    });
    let tableNew = h("table", { props: { className: "proportion" } }, items);
    patch(table, tableNew);
    return table;
  }

  self.setData = function setData(data: ObjectsLinksAndNodes) {
    let onlineNodes = data.nodes.online;
    let nodes = onlineNodes.concat(data.nodes.lost);
    time = data.timestamp;

    function hostnameOfNodeID(nodeid: string | null) {
      // nodeid is a mac address here
      let gateway = data.nodeDict[nodeid];
      if (gateway) {
        return gateway.hostname;
      }
      return null;
    }

    let gatewayDict = count(nodes, ["gateway"], hostnameOfNodeID);
    let gateway6Dict = count(nodes, ["gateway6"], hostnameOfNodeID);

    let statusDict = count(nodes, ["is_online"], function (d) {
      return d ? "online" : "offline";
    });
    let fwDict = count(nodes, ["firmware", "release"]);
    let baseDict = count(nodes, ["firmware", "base"]);
    let deprecationDict = count(nodes, ["model"], function (d) {
      if (config.deprecated && d && config.deprecated.includes(d)) return _.t("deprecation");
      if (config.eol && d && config.eol.includes(d)) return _.t("eol");
      return _.t("no");
    });
    let hwDict = count(nodes, ["model"]);
    let geoDict = count(nodes, ["location"], function (d) {
      return d && d.longitude && d.latitude ? _.t("yes") : _.t("no");
    });

    let autoDict = count(nodes, ["autoupdater"], function (d) {
      if (d.enabled) {
        return d.branch;
      }
      return _.t("node.deactivated");
    });

    let domainDict = count(nodes, ["domain"], function (d) {
      if (config.domainNames) {
        config.domainNames.some(function (t) {
          if (d === t.domain) {
            d = t.name;
            return true;
          }
        });
      }
      return d;
    });

    statusTable = fillTable(
      "node.status",
      statusTable,
      statusDict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
    fwTable = fillTable("node.firmware", fwTable, fwDict.sort(compare));
    baseTable = fillTable("node.baseversion", baseTable, baseDict.sort(compare));
    depTable = fillTable(
      "node.deprecationStatus",
      depTable,
      deprecationDict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
    hwTable = fillTable(
      "node.hardware",
      hwTable,
      hwDict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
    geoTable = fillTable(
      "node.visible",
      geoTable,
      geoDict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
    autoTable = fillTable(
      "node.update",
      autoTable,
      autoDict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
    gatewayTable = fillTable(
      "node.selectedGatewayIPv4",
      gatewayTable,
      gatewayDict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
    gateway6Table = fillTable(
      "node.selectedGatewayIPv6",
      gateway6Table,
      gateway6Dict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
    domainTable = fillTable(
      "node.domain",
      domainTable,
      domainDict.sort(function (a, b) {
        return b[1] - a[1];
      }),
    );
  };

  self.render = function render(el: HTMLElement) {
    self.renderSingle(el, "node.status", statusTable);
    self.renderSingle(el, "node.firmware", fwTable);
    self.renderSingle(el, "node.baseversion", baseTable);
    self.renderSingle(el, "node.deprecationStatus", depTable);
    self.renderSingle(el, "node.hardware", hwTable);
    self.renderSingle(el, "node.visible", geoTable);
    self.renderSingle(el, "node.update", autoTable);
    self.renderSingle(el, "node.selectedGatewayIPv4", gatewayTable);
    self.renderSingle(el, "node.selectedGatewayIPv6", gateway6Table);
    self.renderSingle(el, "node.domain", domainTable);

    if (config.globalInfos) {
      let images = document.createElement("div");
      el.appendChild(images);
      let img = [];
      let subst = {
        "{TIME}": String(time.unix()),
        "{LOCALE}": _.locale(),
      };
      config.globalInfos.forEach(function (globalInfo) {
        img.push(h("h2", globalInfo.name));
        img.push(helper.showStat(globalInfo, subst));
      });
      patch(images, h("div", img));
    }
  };

  self.renderSingle = function renderSingle(el: HTMLElement, heading: string, table: HTMLTableElement) {
    if (table.children.length > 0) {
      let h2 = document.createElement("h2");
      h2.classList.add("proportion-header");
      h2.textContent = _.t(heading);
      h2.onclick = function onclick() {
        table.classList.toggle("hide");
      };
      el.appendChild(h2);
      el.appendChild(table);
    }
  };
  return self;
};
