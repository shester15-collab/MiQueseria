let sidebar;
let overlay;
let menuBtn;
let closeMenu;

function initNavigation(onNavigate) {
  sidebar = document.querySelector("#sidebar");
  overlay = document.querySelector("#overlay");
  menuBtn = document.querySelector("#menu-btn");
  closeMenu = document.querySelector("#close-menu");

  menuBtn.onclick = openMenu;
  overlay.onclick = closeSidebar;
  closeMenu.onclick = closeSidebar;

  document.querySelectorAll("#sidebar button[data-page]").forEach((btn) => {
    btn.onclick = () => {
      onNavigate(btn.dataset.page);
      closeSidebar();
    };
  });
}

function openMenu() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

export { initNavigation, openMenu, closeSidebar };

