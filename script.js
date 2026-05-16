const wrap = document.querySelector(".wrap");
const heroContent = document.querySelector(".hero-content");
const heroInner = document.querySelector(".hero-inner");
const scrollCue = document.querySelector(".scroll-cue");
const galleryTrack = document.querySelector(".gallery-track");
const aboutSection = document.querySelector("#about");
const gallerySection = document.querySelector("#gallery");
const contactSection = document.querySelector("#contact");
const galleryTitle = document.querySelector("#gallery .section-title");
const viewportWidth = Math.round(window.innerWidth);
const viewportHeight = Math.round(window.innerHeight);
const viewportShortSide = Math.min(viewportWidth, viewportHeight);
const viewportLongSide = Math.max(viewportWidth, viewportHeight);
const matchesViewport = (shortSide, longSide) =>
  viewportShortSide === shortSide && viewportLongSide === longSide;
const isIpadPro = matchesViewport(1024, 1366);
const isSurfacePro7 = matchesViewport(912, 1368);
const isZenbookFold = matchesViewport(853, 1280);
const disableSectionRevealAnimations =
  isIpadPro || isSurfacePro7 || isZenbookFold;
const useRaisedRevealThresholds =
  matchesViewport(820, 1180) ||
  isIpadPro ||
  isSurfacePro7 ||
  isZenbookFold;
const revealThresholds = useRaisedRevealThresholds
  ? {
      about: 0.56,
      contact: 0.4,
      gallery: 0.36
    }
  : {
      about: 0.42,
      contact: 0.25,
      gallery: 0.22
    };

if (galleryTitle) {
  const titleText = galleryTitle.textContent.trim();
  galleryTitle.setAttribute("aria-label", titleText);
  galleryTitle.textContent = "";

  Array.from(titleText).forEach((character) => {
    const span = document.createElement("span");
    span.className = "gallery-title-letter";
    span.textContent = character === " " ? "\u00A0" : character;
    span.setAttribute("aria-hidden", "true");
    galleryTitle.appendChild(span);
  });
}

if (wrap && heroContent && heroInner) {
  let rafId = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updateHeroPosition = () => {
    rafId = 0;

    const rootStyles = getComputedStyle(document.documentElement);
    const pinTop = parseFloat(rootStyles.getPropertyValue("--hero-pin-top")) || 24;
    const wrapRect = wrap.getBoundingClientRect();
    const heroHeight = heroContent.offsetHeight;
    const wrapTopInDocument = wrapRect.top + window.scrollY;
    const centeredTop = wrapRect.top + (wrapRect.height / 2) - (heroHeight / 2);
    const pinnedScrollPoint = wrapTopInDocument + (wrap.offsetHeight / 2) - (heroHeight / 2) - pinTop;
    const progress = clamp(window.scrollY / Math.max(pinnedScrollPoint, 1), 0, 1);
    const currentTop = centeredTop <= (pinTop + 1) ? pinTop : centeredTop;
    const baseShellWidth = heroInner.offsetWidth;
    const fullShellWidth = window.innerWidth;
    const shellWidth = baseShellWidth + ((fullShellWidth - baseShellWidth) * progress);

    heroContent.style.setProperty("--hero-offset", `${currentTop}px`);
    heroContent.style.setProperty("--hero-progress", progress.toFixed(3));
    heroContent.style.setProperty("--hero-shell-width", `${shellWidth}px`);
    heroContent.classList.toggle("is-pinned", currentTop === pinTop);
  };

  const requestUpdate = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(updateHeroPosition);
    }
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(requestUpdate);
  }

  requestUpdate();
}

if (scrollCue) {
  if (disableSectionRevealAnimations) {
    scrollCue.classList.add("is-hidden");
  } else {
    const hideScrollCue = () => {
      if (window.scrollY > 8) {
        scrollCue.classList.add("is-hidden");

        window.removeEventListener("scroll", hideScrollCue);
      }
    };

    scrollCue.addEventListener("click", () => {
      window.scrollTo({
        top: window.innerHeight * 0.82,
        behavior: "smooth"
      });
    });

    window.addEventListener("scroll", hideScrollCue, { passive: true });
    window.addEventListener("load", hideScrollCue);
    hideScrollCue();
  }
}

if (galleryTrack) {
  const slides = Array.from(galleryTrack.querySelectorAll(".gallery-slide"));
  let currentIndex = 0;
  let autoAdvanceId = 0;
  let settleId = 0;
  let ignoreScrollEvents = false;
  let ignoreScrollResetId = 0;

  const normalizeIndex = (index) => {
    if (!slides.length) {
      return 0;
    }

    return (index + slides.length) % slides.length;
  };

  const getSlideOffsets = () =>
    slides.map((slide) => slide.offsetLeft - galleryTrack.offsetLeft);

  const syncCurrentIndexToScroll = () => {
    const scrollLeft = galleryTrack.scrollLeft;
    const offsets = getSlideOffsets();
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    offsets.forEach((offset, index) => {
      const distance = Math.abs(offset - scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    currentIndex = nearestIndex;
  };

  const markProgrammaticScroll = () => {
    ignoreScrollEvents = true;
    window.clearTimeout(ignoreScrollResetId);
    ignoreScrollResetId = window.setTimeout(() => {
      ignoreScrollEvents = false;
    }, 700);
  };

  const goToSlide = (index, behavior = "smooth") => {
    if (!slides.length) {
      return;
    }

    currentIndex = normalizeIndex(index);
    const offsets = getSlideOffsets();
    markProgrammaticScroll();
    galleryTrack.scrollTo({
      left: offsets[currentIndex],
      behavior
    });
  };

  const stopAutoAdvance = () => {
    window.clearTimeout(autoAdvanceId);
  };

  const startAutoAdvance = () => {
    if (slides.length <= 1) {
      return;
    }

    stopAutoAdvance();
    autoAdvanceId = window.setTimeout(() => {
      goToSlide(currentIndex + 1);
      startAutoAdvance();
    }, 5000);
  };

  const resumeFromCurrentSlide = () => {
    window.clearTimeout(settleId);
    settleId = window.setTimeout(() => {
      syncCurrentIndexToScroll();
      startAutoAdvance();
    }, 1500);
  };

  galleryTrack.addEventListener("scroll", () => {
    if (ignoreScrollEvents) {
      return;
    }

    stopAutoAdvance();
    syncCurrentIndexToScroll();
    resumeFromCurrentSlide();
  }, { passive: true });

  galleryTrack.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stopAutoAdvance();
      goToSlide(currentIndex + 1);
      startAutoAdvance();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stopAutoAdvance();
      goToSlide(currentIndex - 1);
      startAutoAdvance();
    }
  });

  ["pointerdown", "wheel", "touchstart"].forEach((eventName) => {
    galleryTrack.addEventListener(eventName, () => {
      stopAutoAdvance();
      resumeFromCurrentSlide();
    }, { passive: true });
  });

  window.addEventListener("resize", () => {
    syncCurrentIndexToScroll();
    goToSlide(currentIndex, "auto");
  });

  window.addEventListener("load", () => {
    currentIndex = 0;
    goToSlide(0, "auto");
    startAutoAdvance();
  });

  goToSlide(0, "auto");
  startAutoAdvance();
}

if (aboutSection) {
  const revealAbout = () => {
    aboutSection.classList.add("is-visible");
  };

  if (disableSectionRevealAnimations) {
    revealAbout();
  } else if ("IntersectionObserver" in window) {
    const aboutObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealAbout();
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: revealThresholds.about,
      rootMargin: "0px 0px -8% 0px"
    });

    aboutObserver.observe(aboutSection);
  } else {
    revealAbout();
  }
}

if (contactSection) {
  const revealContact = () => {
    contactSection.classList.add("is-visible");
  };

  if (disableSectionRevealAnimations) {
    revealContact();
  } else if ("IntersectionObserver" in window) {
    const contactObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealContact();
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: revealThresholds.contact,
      rootMargin: "0px 0px -8% 0px"
    });

    contactObserver.observe(contactSection);
  } else {
    revealContact();
  }
}

if (gallerySection) {
  const revealGallery = () => {
    gallerySection.classList.add("is-visible");
    window.setTimeout(() => {
      gallerySection.classList.add("is-title-animated");
    }, 980);
  };

  if (disableSectionRevealAnimations) {
    revealGallery();
  } else if ("IntersectionObserver" in window) {
    const galleryObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealGallery();
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: revealThresholds.gallery,
      rootMargin: "0px 0px -6% 0px"
    });

    galleryObserver.observe(gallerySection);
  } else {
    revealGallery();
  }
}
