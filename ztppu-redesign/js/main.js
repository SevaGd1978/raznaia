(() => {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const year = document.querySelector("[data-year]");
  const form = document.querySelector("[data-lead-form]");
  const success = document.querySelector("[data-form-success]");

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      mobileNav.hidden = open;
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      });
    });
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // Soft phone mask
  const phoneInput = form?.querySelector('input[name="phone"]');
  phoneInput?.addEventListener("input", (event) => {
    const input = event.target;
    const digits = input.value.replace(/\D/g, "").slice(0, 11);
    let next = digits;
    if (digits.startsWith("8")) next = `7${digits.slice(1)}`;
    if (digits.startsWith("7") || digits.length) {
      const d = next.startsWith("7") ? next : `7${next}`;
      const parts = [
        "+7",
        d.slice(1, 4) && ` (${d.slice(1, 4)}`,
        d.slice(4, 7) && `) ${d.slice(4, 7)}`,
        d.slice(7, 9) && `-${d.slice(7, 9)}`,
        d.slice(9, 11) && `-${d.slice(9, 11)}`,
      ].filter(Boolean);
      input.value = parts.join("");
    }
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    // Prototype only: wire to CRM / Bitrix / email on production
    if (success) success.hidden = false;
    form.reset();
  });
})();
