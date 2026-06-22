const featureData = {
  dashboard: {
    kicker: "Dashboard",
    title: "Άμεση εικόνα της απόδοσης του συνεργείου",
    copy: "Το dashboard δείχνει έσοδα ημέρας/μήνα/χρόνου, open jobs, completed jobs, αριθμό πελατών, οχημάτων και invoices.",
    points: ["Revenue cards και στατιστικά", "Monthly charts για jobs και έσοδα", "Labor breakdown ανά μηχανικό"]
  },
  customers: {
    kicker: "Customers & Vehicles",
    title: "Πλήρης φάκελος πελάτη και αυτοκινήτου",
    copy: "Κρατάει στοιχεία επικοινωνίας, VAT, σημειώσεις, αυτοκίνητα ανά πελάτη, kilometers, VIN, brand/model και ιστορικό εργασιών.",
    points: ["Customer search και sorting", "Πολλαπλά vehicles ανά customer", "Customer history με jobs, invoices και reminders"]
  },
  jobs: {
    kicker: "Jobs & Work",
    title: "Από job card μέχρι ολοκλήρωση εργασίας",
    copy: "Δημιουργείς job card, αναθέτεις μηχανικό, βλέπεις progress/completed εργασίες και παρακολουθείς ETA.",
    points: ["Custom calendar για estimated completion", "Work in progress και completed tabs", "Labor, parts και service checklist"]
  },
  finance: {
    kicker: "Invoices & Reports",
    title: "Οικονομική εικόνα και επαγγελματικά invoices",
    copy: "Τα invoices έχουν paid/open status, VAT, totals, print/PDF output, ενώ τα reports δείχνουν revenue και workshop load.",
    points: ["Invoice search, filters και sort", "Open balance, paid total και overdue count", "CSV/PDF exports για reports"]
  },
  service: {
    kicker: "Service Card",
    title: "Μικρή κάρτα υπενθύμισης service για τον πελάτη",
    copy: "Παράγει service reminder card σε 85×55mm με customer, vehicle, service date, current km και επόμενα kilometer reminders.",
    points: ["Print σε 85×55mm", "Download PDF", "Next oil, 2nd oil και service kilometers"]
  }
};

const buttons = document.querySelectorAll(".feature");
const kicker = document.querySelector("#preview-kicker");
const title = document.querySelector("#preview-title");
const copy = document.querySelector("#preview-copy");
const points = document.querySelector("#preview-points");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.feature;
    const item = featureData[key];
    if (!item) return;

    buttons.forEach((current) => current.classList.toggle("active", current === button));
    kicker.textContent = item.kicker;
    title.textContent = item.title;
    copy.textContent = item.copy;
    points.innerHTML = item.points.map((point) => `<li>${point}</li>`).join("");
  });
});

const links = document.querySelectorAll("nav a");
const sections = [...links].map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
const toTop = document.querySelector(".to-top");
const menuToggle = document.querySelector(".menu-toggle");
const reveals = document.querySelectorAll(".reveal");

function updateActiveLink() {
  const scrollPosition = window.scrollY + 140;
  let activeId = sections[0]?.id;

  sections.forEach((section) => {
    if (section.offsetTop <= scrollPosition) activeId = section.id;
  });

  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });

  toTop.classList.toggle("visible", window.scrollY > 500);
}

window.addEventListener("scroll", updateActiveLink, { passive: true });
window.addEventListener("load", updateActiveLink);
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

menuToggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

links.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );

  reveals.forEach((item) => revealObserver.observe(item));
} else {
  reveals.forEach((item) => item.classList.add("visible"));
}
