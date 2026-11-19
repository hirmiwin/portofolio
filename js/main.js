(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Tahun berjalan di footer */
  var yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Navbar: shadow saat scroll + tombol back to top */
  var nav = document.querySelector(".nav");
  var toTop = document.querySelector("#toTop");

  function onScroll() {
    if (nav) nav.classList.toggle("nav--scrolled", window.scrollY > 12);
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 600);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Menu mobile */
  var toggle = document.querySelector("#navToggle");
  var menu = document.querySelector("#navMenu");

  if (toggle && menu) {
    var closeMenu = function () {
      menu.classList.remove("is-open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Buka menu");
    };

    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.classList.toggle("is-active", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", function (e) {
      if (
        menu.classList.contains("is-open") &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* Animasi muncul saat scroll */
  var revealEls = document.querySelectorAll(".reveal");
  if (!prefersReduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Highlight menu aktif saat scroll */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav__link[href^="#"]')
  );
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (link) {
              link.classList.toggle(
                "is-active",
                link.getAttribute("href") === "#" + entry.target.id
              );
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* Form kontak: buka aplikasi email pengunjung */
  var form = document.querySelector("#contactForm");
  if (form) {
    var EMAIL = "hirmiwin@gmail.com";
    var note = document.querySelector("#formNote");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();

      if (!name || !email || !message) {
        if (note) {
          note.textContent = "Isi nama, email, dan pesan dulu ya.";
          note.classList.add("is-error");
          note.classList.remove("is-ok");
        }
        return;
      }

      var subject = encodeURIComponent("Halo dari " + name + " - pesan dari website");
      var body = encodeURIComponent(message + "\n\n- " + name + "\n" + email);
      window.location.href =
        "mailto:" + EMAIL + "?subject=" + subject + "&body=" + body;

      if (note) {
        note.textContent = "Aplikasi email kamu akan terbuka. Terima kasih!";
        note.classList.remove("is-error");
        note.classList.add("is-ok");
      }
    });
  }

  /* ============================================================
     GALERI FOTO
     Foto dibaca dari assets/img/photos/manifest.json
     ============================================================ */
  var photoGrid = document.querySelector("#photoGrid");
  if (photoGrid) {
    var photoEmpty = document.querySelector("#photoEmpty");
    var PHOTO_DIR = "assets/img/photos/";
    var photos = [];
    var currentPhoto = 0;
    var lastFocused = null;

    var titleFromFile = function (file) {
      return file
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    };

    var normalizePhoto = function (item) {
      if (typeof item === "string" && item.trim()) {
        return { src: item.trim(), title: titleFromFile(item), alt: "" };
      }
      if (item && typeof item === "object" && typeof item.src === "string" && item.src.trim()) {
        return {
          src: item.src.trim(),
          title: item.title || titleFromFile(item.src),
          alt: item.alt || ""
        };
      }
      return null;
    };

    var preloadPhoto = function (src) {
      return new Promise(function (resolve) {
        var probe = new Image();
        probe.onload = function () { resolve(true); };
        probe.onerror = function () { resolve(false); };
        probe.src = src;
      });
    };

    var lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.id = "photoLightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Pratinjau foto");
    lightbox.innerHTML =
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Tutup pratinjau">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>' +
      '<button class="lightbox__btn lightbox__nav lightbox__nav--prev" type="button" aria-label="Foto sebelumnya">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>' +
      '<figure class="lightbox__stage">' +
        '<img alt="">' +
        '<figcaption class="lightbox__caption"><span class="lightbox__count"></span><span class="lightbox__title"></span></figcaption>' +
      '</figure>' +
      '<button class="lightbox__btn lightbox__nav lightbox__nav--next" type="button" aria-label="Foto berikutnya">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>';
    document.body.appendChild(lightbox);

    var lbImg = lightbox.querySelector("img");
    var lbCount = lightbox.querySelector(".lightbox__count");
    var lbTitle = lightbox.querySelector(".lightbox__title");
    var lbClose = lightbox.querySelector(".lightbox__close");
    var lbPrev = lightbox.querySelector(".lightbox__nav--prev");
    var lbNext = lightbox.querySelector(".lightbox__nav--next");

    var showPhoto = function (index) {
      if (!photos.length) return;
      currentPhoto = (index + photos.length) % photos.length;
      var photo = photos[currentPhoto];
      lbImg.src = PHOTO_DIR + photo.src;
      lbImg.alt = photo.alt || photo.title || "Karya foto Hermawan";
      lbTitle.textContent = photo.title;
      lbCount.textContent = (currentPhoto + 1) + " / " + photos.length;
    };

    var openLightbox = function (index) {
      lastFocused = document.activeElement;
      showPhoto(index);
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      lbClose.focus();
    };

    var closeLightbox = function () {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    };

    lbClose.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", function () { showPhoto(currentPhoto - 1); });
    lbNext.addEventListener("click", function () { showPhoto(currentPhoto + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPhoto(currentPhoto - 1);
      if (e.key === "ArrowRight") showPhoto(currentPhoto + 1);
    });

    var renderPhotos = function () {
      photoGrid.innerHTML = "";

      if (!photos.length) {
        if (photoEmpty) photoEmpty.hidden = false;
        return;
      }
      if (photoEmpty) photoEmpty.hidden = true;

      photos.forEach(function (photo, index) {
        var card = document.createElement("button");
        card.type = "button";
        card.className = "photo-card";
        card.setAttribute("aria-label", "Perbesar foto: " + photo.title);

        var media = document.createElement("span");
        media.className = "photo-card__media";

        var img = document.createElement("img");
        img.src = PHOTO_DIR + photo.src;
        img.alt = photo.alt || photo.title;
        img.loading = "lazy";
        img.decoding = "async";

        var zoom = document.createElement("span");
        zoom.className = "photo-card__zoom";
        zoom.setAttribute("aria-hidden", "true");
        zoom.innerHTML = '<svg class="icon"><use href="#i-arrow"/></svg>';

        media.appendChild(img);
        media.appendChild(zoom);

        var meta = document.createElement("span");
        meta.className = "photo-card__meta";

        var name = document.createElement("strong");
        name.textContent = photo.title;

        var number = document.createElement("span");
        number.className = "photo-card__no";
        number.textContent = String(index + 1).padStart(2, "0");

        meta.appendChild(name);
        meta.appendChild(number);

        card.appendChild(media);
        card.appendChild(meta);
        card.addEventListener("click", function () { openLightbox(index); });
        photoGrid.appendChild(card);
      });
    };

    fetch(PHOTO_DIR + "manifest.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Manifest tidak ditemukan");
        return res.json();
      })
      .catch(function () { return []; })
      .then(function (list) {
        if (!Array.isArray(list)) list = [];
        var items = list.map(normalizePhoto).filter(Boolean);
        return Promise.all(
          items.map(function (photo) {
            return preloadPhoto(PHOTO_DIR + photo.src).then(function (ok) {
              return ok ? photo : null;
            });
          })
        );
      })
      .then(function (items) {
        photos = items.filter(Boolean);
        renderPhotos();
      });
  }
})();
