import * as d3Drag from "d3-drag";
import * as d3Ease from "d3-ease";
import * as d3Force from "d3-force";
import * as d3Interpolate from "d3-interpolate";
import * as d3Selection from "d3-selection";
import * as d3Timer from "d3-timer";
import * as d3Zoom from "d3-zoom";

import math from "./utils/math";
import draw from "./forcegraph/draw";

export const ForceGraph = function (linkScale, sidebar) {
  var self = this;
  var el; // Element to display graph in
  var canvas;
  var ctx; // Canvas rendering context
  var force;
  var forceLink;

  var transform = d3Zoom.zoomIdentity;
  var intNodes = [];
  var dictNodes = {};
  var intLinks = [];
  var movetoTimer;
  var initial = 1.8;

  var NODE_RADIUS_DRAG = 10;
  var NODE_RADIUS_SELECT = 15;
  var LINK_RADIUS_SELECT = 12;
  var ZOOM_ANIMATE_DURATION = 350;

  var ZOOM_MIN = 1 / 8;
  var ZOOM_MAX = 3;

  var FORCE_ALPHA = 0.01;

  draw.setTransform(transform);

  function resizeCanvas() {
    canvas.width = el.offsetWidth;
    canvas.height = el.offsetHeight;
    draw.setMaxArea(canvas.width, canvas.height);
  }

  function transformPosition(p) {
    transform.x = p.x;
    transform.y = p.y;
    transform.k = p.k;
  }

  function moveTo(callback, forceMove) {
    clearTimeout(movetoTimer);
    if (!forceMove && force.alpha() > 0.3) {
      movetoTimer = setTimeout(function timerOfMoveTo() {
        moveTo(callback);
      }, 300);
      return;
    }
    var result = callback();
    var x = result[0];
    var y = result[1];
    var k = result[2];
    var end = { k: k };

    end.x = (canvas.width + sidebar.getWidth()) / 2 - x * k;
    end.y = canvas.height / 2 - y * k;

    var start = { x: transform.x, y: transform.y, k: transform.k };

    var interpolate = d3Interpolate.interpolateObject(start, end);

    var timer = d3Timer.timer(function (t) {
      if (t >= ZOOM_ANIMATE_DURATION) {
        timer.stop();
        return;
      }

      var v = interpolate(d3Ease.easeQuadInOut(t / ZOOM_ANIMATE_DURATION));
      transformPosition(v);
      window.requestAnimationFrame(redraw);
    });
  }

  function onClick(event) {
    if (event.defaultPrevented) {
      return;
    }

    var e = transform.invert([event.clientX, event.clientY]);
    var node = force.find(e[0], e[1], NODE_RADIUS_SELECT);

    if (node !== undefined) {
      router.fullUrl({ node: node.o.node_id });
      return;
    }

    e = { x: e[0], y: e[1] };

    var closedLink;
    var radius = LINK_RADIUS_SELECT;
    intLinks.forEach(function (link) {
      var distance = math.distanceLink(e, link.source, link.target);
      if (distance < radius) {
        closedLink = link;
        radius = distance;
      }
    });

    if (closedLink !== undefined) {
      router.fullUrl({ link: closedLink.o.id });
    }
  }

  function redraw() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    intLinks.forEach(draw.drawLink);
    intNodes.forEach(draw.drawNode);

    ctx.restore();
  }

  el = document.createElement("div");
  el.classList.add("graph");

  forceLink = d3Force
    .forceLink()
    .distance(function (node) {
      if (node.o.type.indexOf("vpn") === 0) {
        return 0;
      }
      return 75;
    })
    .strength(function (node) {
      if (node.o.type.indexOf("vpn") === 0) {
        return 0.02;
      }
      return Math.max(0.5, node.o.source_tq);
    });

  var zoom = d3Zoom
    .zoom()
    .scaleExtent([ZOOM_MIN, ZOOM_MAX])
    .on("zoom", function (event) {
      transform = event.transform;
      draw.setTransform(transform);
      redraw();
    });

  force = d3Force
    .forceSimulation()
    .force("link", forceLink)
    .force("charge", d3Force.forceManyBody())
    .force("x", d3Force.forceX().strength(0.02))
    .force("y", d3Force.forceY().strength(0.02))
    .force("collide", d3Force.forceCollide())
    .on("tick", redraw)
    .alphaDecay(0.025);

  var drag = d3Drag
    .drag()
    .subject(function (event) {
      var e = transform.invert([event.x, event.y]);
      var node = force.find(e[0], e[1], NODE_RADIUS_DRAG);

      if (node !== undefined) {
        node.x = event.x;
        node.y = event.y;
        return node;
      }
      return undefined;
    })
    .on("start", function (event) {
      if (!event.active) {
        force.alphaTarget(FORCE_ALPHA).restart();
      }
      event.subject.fx = transform.invertX(event.subject.x);
      event.subject.fy = transform.invertY(event.subject.y);
    })
    .on("drag", function (event) {
      event.subject.fx = transform.invertX(event.x);
      event.subject.fy = transform.invertY(event.y);
    })
    .on("end", function (event) {
      if (!event.active) {
        force.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    });

  canvas = d3Selection.select(el).append("canvas").on("click", onClick).call(drag).call(zoom).node();

  ctx = canvas.getContext("2d");
  draw.setCTX(ctx);

  window.addEventListener("resize", function () {
    resizeCanvas();
    redraw();
  });

  self.setData = function setData(data) {
    intNodes = data.nodes.all.map(function (nodeData) {
      var node = dictNodes[nodeData.node_id];
      if (!node) {
        node = {};
        dictNodes[nodeData.node_id] = node;
      }

      node.o = nodeData;

      return node;
    });

    intLinks = data.links
      .filter(function (link) {
        return data.nodeDict[link.source.node_id].is_online && data.nodeDict[link.target.node_id].is_online;
      })
      .map(function (link) {
        return {
          o: link,
          source: dictNodes[link.source.node_id],
          target: dictNodes[link.target.node_id],
          color: linkScale(link.source_tq),
          color_to: linkScale(link.target_tq),
        };
      });

    force.nodes(intNodes);
    forceLink.links(intLinks);

    force.alpha(initial).velocityDecay(0.15).restart();
    if (initial === 1.8) {
      initial = 0.5;
    }

    resizeCanvas();
  };

  self.resetView = function resetView() {
    moveTo(function calcToReset() {
      draw.setHighlight(null);
      return [0, 0, (ZOOM_MIN + config.forceGraph.zoomModifier) / 2];
    }, true);
  };

  self.gotoNode = function gotoNode(nodeData) {
    moveTo(function calcToNode() {
      draw.setHighlight({ type: "node", id: nodeData.node_id });
      var node = dictNodes[nodeData.node_id];
      if (node) {
        return [node.x, node.y, (ZOOM_MAX + 1) / 2];
      }
      return self.resetView();
    });
  };

  self.gotoLink = function gotoLink(linkData) {
    moveTo(function calcToLink() {
      draw.setHighlight({ type: "link", id: linkData[0].id });
      var link = intLinks.find(function (link) {
        return link.o.id === linkData[0].id;
      });
      if (link) {
        return [(link.source.x + link.target.x) / 2, (link.source.y + link.target.y) / 2, ZOOM_MAX / 2 + ZOOM_MIN];
      }
      return self.resetView();
    });
  };

  self.gotoLocation = function gotoLocation() {
    // ignore
  };

  self.destroy = function destroy() {
    force.stop();
    canvas.parentNode.removeChild(canvas);
    force = null;

    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  };

  self.render = function render(d) {
    d.appendChild(el);
    resizeCanvas();
  };

  return self;
};
