import moment from "moment";
import * as L from "leaflet";

import { _ } from "./utils/language";
import { Router } from "./utils/router";
import { Gui } from "./gui";
import { Language } from "./utils/language";
import * as helper from "./utils/helper";
import { Link } from "./utils/node";

export const main = () => {
  function handleData(data: { links: Link[]; nodes: Node[]; timestamp: string }[]) {
    let config = window.config;
    let timestamp: string;
    let nodes = [];
    let links = [];
    let nodeDict = {};

    for (let i = 0; i < data.length; ++i) {
      nodes = nodes.concat(data[i].nodes);
      timestamp = data[i].timestamp;
      links = links.concat(data[i].links);
    }

    nodes.forEach(function (node) {
      node.firstseen = moment.utc(node.firstseen).local();
      node.lastseen = moment.utc(node.lastseen).local();
    });

    let age = moment().subtract(config.maxAge, "days");

    let online = nodes.filter(function (node) {
      return node.is_online;
    });
    let offline = nodes.filter(function (node) {
      return !node.is_online;
    });

    let newnodes = helper.limit("firstseen", age, helper.sortByKey("firstseen", online));
    let lostnodes = helper.limit("lastseen", age, helper.sortByKey("lastseen", offline));

    nodes.forEach(function (node) {
      node.neighbours = [];
      nodeDict[node.node_id] = node;
    });

    links.forEach(function (link) {
      link.source = nodeDict[link.source];
      link.target = nodeDict[link.target];

      link.id = [link.source.node_id, link.target.node_id].join("-");
      link.source.neighbours.push({ node: link.target, link: link });
      link.target.neighbours.push({ node: link.source, link: link });

      try {
        link.latlngs = [];
        link.latlngs.push(L.latLng(link.source.location.latitude, link.source.location.longitude));
        link.latlngs.push(L.latLng(link.target.location.latitude, link.target.location.longitude));

        link.distance = link.latlngs[0].distanceTo(link.latlngs[1]);
      } catch (e) {
        // ignore exception
      }
    });

    return {
      now: moment(),
      timestamp: moment.utc(timestamp).local(),
      nodes: {
        all: nodes,
        online: online,
        offline: offline,
        new: newnodes,
        lost: lostnodes,
      },
      links: links,
      nodeDict: nodeDict,
    };
  }

  let config = window.config;
  let language = Language();
  let router = (window.router = new Router(language));

  config.dataPath.forEach(function (_element, i) {
    config.dataPath[i] += "meshviewer.json";
  });

  language.init(router);

  function update() {
    return Promise.all(config.dataPath.map(helper.getJSON)).then(handleData);
  }

  update()
    .then(function (nodesData) {
      return new Promise(function (resolve, reject) {
        let count = 0;
        (function waitForLanguage() {
          if (Object.keys(_.phrases).length > 0) {
            resolve(nodesData);
          } else if (count > 500) {
            reject(new Error("translation not loaded after 10 seconds"));
          } else {
            setTimeout(waitForLanguage.bind(this), 20);
          }
          count++;
        })();
      });
    })
    .then(function (nodesData: any) {
      let gui = Gui(language);
      gui.setData(nodesData);
      router.setData(nodesData);
      router.resolve();

      window.setInterval(function () {
        update().then(function (nodesData: any) {
          gui.setData(nodesData);
          router.setData(nodesData);
        });
      }, 60000);
    })
    .catch(function (e) {
      document.querySelector(".loader").innerHTML +=
        e.message +
        '<br /><br /><button onclick="location.reload(true)" class="btn text" aria-label="Try to reload">Try to reload</button><br /> or report to your community';
      console.warn(e);
    });
};
