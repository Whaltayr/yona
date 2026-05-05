
"use strict";

/* ============================================================
   1. HELPERS
   ============================================================ */

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function elementExists(element) {
  return element !== null && element !== undefined;
}

function getHeaderOffset() {
  const header = $("#header");
  return header ? header.offsetHeight : 0;
}

/**
 * Função global usada diretamente no HTML:
 * onclick="scrollToSection('reserva')"
 */
window.scrollToSection = function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const top = section.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();

  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
};


/* ============================================================
   2. HEADER SCROLLED STATE
   ============================================================ */

function initHeaderScrollState() {
  const header = $("#header");
  if (!header) return;

  const setHeaderState = () => {
    if (window.scrollY > 24) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  setHeaderState();

  window.addEventListener("scroll", setHeaderState, { passive: true });
}


/* ============================================================
   3. MOBILE MENU
   ============================================================ */

function initMobileMenu() {
  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobileMenu");
  const mobileLinks = $$(".mobile-nav__link");

  if (!hamburger || !mobileMenu) return;

  const openMenu = () => {
    hamburger.classList.add("active");
    mobileMenu.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Fechar menu");
    mobileMenu.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Abrir menu");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const toggleMenu = () => {
    const isOpen = mobileMenu.classList.contains("open");
    isOpen ? closeMenu() : openMenu();
  };

  hamburger.addEventListener("click", toggleMenu);

  mobileLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    const clickInsideMenu = mobileMenu.contains(event.target);
    const clickOnButton = hamburger.contains(event.target);

    if (!clickInsideMenu && !clickOnButton && mobileMenu.classList.contains("open")) {
      closeMenu();
    }
  });
}


/* ============================================================
   4. SMOOTH SCROLL LINKS
   ============================================================ */

function initSmoothScroll() {
  const links = $$('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      const top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });
}


/* ============================================================
   5. FAQ ACCORDION
   ============================================================ */

function initFAQAccordion() {
  const faqItems = $$(".faq__item");

  if (!faqItems.length) return;

  faqItems.forEach((item, index) => {
    const question = $(".faq__q", item);
    const answer = $(".faq__a", item);

    if (!question || !answer) return;

    const answerId = answer.id || `faq-answer-${index + 1}`;
    answer.id = answerId;

    question.setAttribute("aria-controls", answerId);
    question.setAttribute("aria-expanded", item.classList.contains("open") ? "true" : "false");

    if (item.classList.contains("open")) {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      faqItems.forEach((otherItem) => {
        const otherQuestion = $(".faq__q", otherItem);
        const otherAnswer = $(".faq__a", otherItem);

        if (!otherAnswer || !otherQuestion) return;

        otherItem.classList.remove("open");
        otherAnswer.style.maxHeight = null;
        otherQuestion.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("open");
        answer.style.maxHeight = `${answer.scrollHeight}px`;
        question.setAttribute("aria-expanded", "true");
      }
    });
  });
}


/* ============================================================
   6. BOOKING FORM — FAKE SUBMISSION
   ============================================================ */

function initBookingForm() {
  const form = $("#bookingForm");

  if (!form) return;

  const formWrap = form.closest(".booking__form-wrap");
  let successBox = $(".form-success", formWrap || document);

  if (!successBox) {
    successBox = document.createElement("div");
    successBox.className = "form-success";
    successBox.innerHTML = `
      <div class="form-success__check" aria-hidden="true">✓</div>
      <h3>Pedido preparado com sucesso.</h3>
      <p>Em uma versão final, esta informação será enviada para o WhatsApp, email ou painel do hotel.</p>
      <button type="button" class="btn btn--gold" id="newBookingBtn">Fazer novo pedido</button>
    `;

    form.insertAdjacentElement("afterend", successBox);
  }

  const showFieldError = (field) => {
    field.style.borderColor = "#B85B5B";
    field.style.boxShadow = "0 0 0 3px rgba(184, 91, 91, 0.14)";
  };

  const clearFieldError = (field) => {
    field.style.borderColor = "";
    field.style.boxShadow = "";
  };

  $$("input, select, textarea", form).forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const requiredFields = $$("[required]", form);
    const invalidFields = requiredFields.filter((field) => !field.value.trim());

    requiredFields.forEach(clearFieldError);

    if (invalidFields.length) {
      invalidFields.forEach(showFieldError);
      invalidFields[0].focus();

      if (window.gsap && !prefersReducedMotion) {
        gsap.fromTo(
          invalidFields[0],
          { x: -6 },
          { x: 6, duration: 0.08, repeat: 5, yoyo: true, clearProps: "x" }
        );
      }

      return;
    }

    form.classList.add("is-hidden");
    form.style.display = "none";
    successBox.classList.add("visible");

    if (window.gsap && !prefersReducedMotion) {
      gsap.fromTo(
        successBox,
        { autoAlpha: 0, y: 24, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }
      );
    }

    successBox.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  });

  document.addEventListener("click", (event) => {
    const newBookingBtn = event.target.closest("#newBookingBtn");
    if (!newBookingBtn) return;

    form.reset();
    successBox.classList.remove("visible");
    form.classList.remove("is-hidden");
    form.style.display = "";

    if (window.gsap && !prefersReducedMotion) {
      gsap.fromTo(
        form,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }
      );
    }
  });
}


/* ============================================================
   7. ACTIVE NAV LINK ON SCROLL
   ============================================================ */

function initActiveNavigation() {
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__link, .mobile-nav__link");

  if (!sections.length || !navLinks.length) return;

  const setActiveLink = () => {
    const scrollPosition = window.scrollY + getHeaderOffset() + 120;

    let currentId = sections[0].id;

    sections.forEach((section) => {
      if (scrollPosition >= section.offsetTop) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = href === `#${currentId}`;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  setActiveLink();
  window.addEventListener("scroll", setActiveLink, { passive: true });
}


/* ============================================================
   8. GSAP ANIMATIONS
   ============================================================ */

function initGSAPAnimations() {
  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) {
    // Se GSAP não carregar, revela tudo para evitar conteúdo invisível.
    $$(".reveal-up, .reveal-left, .reveal-right, .stagger-card").forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });

    $$("#heroLabel, #heroTitle, #heroHeadline, #heroSub, #heroActions, #heroCard").forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });

    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.defaults({
    ease: "power3.out",
    duration: 0.8,
  });

  /* Hero */
  const heroTimeline = gsap.timeline({ delay: 0.15 });

  heroTimeline
    .fromTo(".header__inner", { y: -24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65 })
    .fromTo("#heroLabel", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, "-=0.25")
    .fromTo("#heroTitle", { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.95 }, "-=0.25")
    .fromTo("#heroHeadline", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, "-=0.45")
    .fromTo("#heroSub", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, "-=0.45")
    .fromTo("#heroActions", { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, "-=0.4")
    .fromTo("#heroCard", { y: 36, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1 }, "-=0.45");

  gsap.to(".hero__img", {
    scale: 1,
    duration: 2.8,
    ease: "power2.out",
  });

  gsap.to(".hero__img", {
    yPercent: 10,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  /* Reveal up */
  $$(".reveal-up").forEach((element) => {
    gsap.fromTo(
      element,
      { y: 50, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        scrollTrigger: {
          trigger: element,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  /* Reveal left */
  $$(".reveal-left").forEach((element) => {
    gsap.fromTo(
      element,
      { x: -50, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        scrollTrigger: {
          trigger: element,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  /* Reveal right */
  $$(".reveal-right").forEach((element) => {
    gsap.fromTo(
      element,
      { x: 50, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        scrollTrigger: {
          trigger: element,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  /* Stagger cards by section/grid */
  const staggerParents = [
    ".rooms__grid",
    ".exp__grid",
    ".restaurant__grid",
    ".destination__grid",
    ".gallery__grid",
  ];

  staggerParents.forEach((parentSelector) => {
    const parent = $(parentSelector);
    if (!parent) return;

    const cards = $$(".stagger-card", parent);
    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        stagger: 0.08,
        scrollTrigger: {
          trigger: parent,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  /* Pequeno parallax em imagens decorativas */
  const parallaxImages = [
    ".about__img",
    ".events__img",
    ".destination__bg-img",
  ];

  parallaxImages.forEach((selector) => {
    const image = $(selector);
    if (!image) return;

    gsap.to(image, {
      yPercent: selector === ".destination__bg-img" ? 8 : -6,
      ease: "none",
      scrollTrigger: {
        trigger: image.closest("section") || image,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  /* Gallery image entrance */
  $$(".gallery__item").forEach((item) => {
    const img = $("img", item);
    if (!img) return;

    gsap.fromTo(
      img,
      { scale: 1.08 },
      {
        scale: 1,
        duration: 1.2,
        scrollTrigger: {
          trigger: item,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  /* Refresh depois das imagens carregarem */
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
}


/* ============================================================
   9. SMALL UI ENHANCEMENTS
   ============================================================ */

function initButtonMicroInteractions() {
  const buttons = $$(".btn");

  buttons.forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      if (prefersReducedMotion) return;

      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      button.style.transform = `translateY(-2px) translate(${x * 0.015}px, ${y * 0.025}px)`;
    });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

function initImageSafety() {
  const images = $$("img");

  images.forEach((img) => {
    img.addEventListener("error", () => {
      img.style.background =
        "linear-gradient(135deg, rgba(7,27,45,0.95), rgba(216,181,109,0.35))";
      img.alt = img.alt || "Imagem indisponível";
    });
  });
}


/* ============================================================
   10. INIT
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScrollState();
  initMobileMenu();
  initSmoothScroll();
  initFAQAccordion();
  initBookingForm();
  initActiveNavigation();
  initButtonMicroInteractions();
  initImageSafety();
  initGSAPAnimations();
});



