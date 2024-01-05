import { CanRender } from "./container";

export const Sidebar = function (el: HTMLElement) {
  const self = {
    getWidth: undefined,
    add: undefined,
    ensureVisible: undefined,
    hide: undefined,
    reveal: undefined,
    container: undefined,
    button: undefined,
  };
  let _ = window._;

  // Needed to avoid render blocking
  let gridBreakpoints = {
    lg: [992, 446],
    xl: [1200, 560],
  };

  let sidebar = document.createElement("div");
  sidebar.classList.add("sidebar");
  el.appendChild(sidebar);

  let button = document.createElement("button");
  let visibility = new CustomEvent("visibility");
  sidebar.appendChild(button);

  button.classList.add("sidebarhandle");
  button.setAttribute("aria-label", _.t("sidebar.toggle"));
  button.onclick = function onclick() {
    button.dispatchEvent(visibility);
    sidebar.classList.toggle("hidden");
  };

  let container = document.createElement("div");
  container.classList.add("container");
  sidebar.appendChild(container);

  self.getWidth = function getWidth() {
    if (gridBreakpoints.lg[0] > window.innerWidth || sidebar.classList.contains("hidden")) {
      return 0;
    } else if (gridBreakpoints.xl[0] > window.innerWidth) {
      return gridBreakpoints.lg[1];
    }
    return gridBreakpoints.xl[1];
  };

  self.add = function add(d: CanRender) {
    d.render(container);
  };

  self.ensureVisible = function ensureVisible() {
    sidebar.classList.remove("hidden");
  };

  self.hide = function hide() {
    container.children[1].classList.add("hide");
    container.children[2].classList.add("hide");
  };

  self.reveal = function reveal() {
    container.children[1].classList.remove("hide");
    container.children[2].classList.remove("hide");
  };

  self.container = sidebar;
  self.button = button;

  return self;
};
