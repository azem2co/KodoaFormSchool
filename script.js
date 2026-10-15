// إعدادات المشروع
const CONFIG = {
  facebookUrl: "https://www.facebook.com/QudwaAssoc/",
  instagramUrl: "https://www.instagram.com/qudwaassoc/",
  // SheetDB API المرتبط بجدول Google Sheets (لم يتغير)
  submitEndpoint: "https://sheetdb.io/api/v1/up8tahpqes5ri",
};

// الحقول المطلوبة في كل خطوة (أسماء الحقول مطابقة تماماً للنسخة السابقة
// حتى تبقى أعمدة الجدول كما هي)
const STEP_RULES = {
  1: [
    ["studentName", "يرجى كتابة اسم الطالب."],
    ["grade", "يرجى كتابة الصف."],
  ],
  2: [
    ["bestPart", "يرجى كتابة أفضل نشاط أو فقرة."],
    ["bestReason", "أخبرنا لماذا اخترت هذا النشاط."],
    ["worstPart", "يرجى كتابة النشاط الأقل إعجاباً."],
    ["worstReason", "أخبرنا بما لم يناسبك أو بما يمكن تطويره."],
  ],
  3: [],
};
const TOTAL = 3;

const body = document.body;
const hero = document.getElementById("hero");
const wizard = document.getElementById("wizard");
const done = document.getElementById("done");
const form = document.getElementById("surveyForm");
const formMessage = document.getElementById("formMessage");
const toast = document.getElementById("toast");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const steps = [...form.querySelectorAll(".step")];
const stepperItems = [...document.querySelectorAll("#stepper li")];
const progressFill = document.getElementById("progressFill");
const progressBar = document.getElementById("progress");
const stepNow = document.getElementById("stepNow");

let current = 1;
let toastTimer;

/* ---------- أدوات مساعدة ---------- */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function setView(view) {
  body.dataset.view = view;
  hero.hidden = view !== "hero";
  wizard.hidden = view !== "form";
  done.hidden = view !== "done";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setSocialLinks() {
  const map = { facebook: CONFIG.facebookUrl, instagram: CONFIG.instagramUrl };
  document.querySelectorAll("[data-social]").forEach((link) => {
    const url = map[link.dataset.social];
    if (url && /^https:\/\/(www\.)?(facebook\.com|instagram\.com)\//i.test(url)) {
      link.href = url;
    } else {
      link.removeAttribute("href");
    }
  });
}
setSocialLinks();

/* ---------- التحقق ---------- */
function clearError(control) {
  control.classList.remove("invalid");
  const parent = control.closest(".field, .choice-fieldset");
  const error = parent && parent.querySelector(".field-error");
  if (error) error.textContent = "";
}

function showError(control, message) {
  control.classList.add("invalid");
  const parent = control.closest(".field, .choice-fieldset");
  const error = parent && parent.querySelector(".field-error");
  if (error) error.textContent = message;
}

function validateStep(n) {
  formMessage.hidden = true;
  let firstInvalid = null;

  (STEP_RULES[n] || []).forEach(([name, message]) => {
    const control = form.elements[name];
    if (control && !String(control.value || "").trim()) {
      showError(control, message);
      firstInvalid = firstInvalid || control;
    }
  });

  if (n === 3 && !form.querySelector('input[name="outsideInterest"]:checked')) {
    const group = form.querySelector(".choice-fieldset");
    group.querySelector(".field-error").textContent = "يرجى اختيار الإجابة الأقرب إلى رأيك.";
    firstInvalid = firstInvalid || group.querySelector("input");
  }

  if (firstInvalid) {
    firstInvalid.focus({ preventScroll: true });
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("يرجى إكمال الحقول المطلوبة قبل المتابعة.");
    return false;
  }
  return true;
}

/* ---------- التنقل بين الخطوات ---------- */
function render(goingBack = false) {
  steps.forEach((el) => {
    const isCurrent = Number(el.dataset.step) === current;
    el.classList.toggle("is-current", isCurrent);
    el.classList.toggle("is-back", isCurrent && goingBack);
  });

  stepperItems.forEach((li, i) => {
    const n = i + 1;
    li.classList.toggle("is-active", n === current);
    li.classList.toggle("is-done", n < current);
    li.querySelector(".dot").innerHTML =
      n < current ? '<svg><use href="#i-check" /></svg>' : String(n);
  });

  const pct = Math.round((current / TOTAL) * 100);
  progressFill.style.width = pct + "%";
  progressBar.setAttribute("aria-valuenow", String(pct));
  stepNow.textContent = String(current);

  prevBtn.hidden = current === 1;
  nextBtn.hidden = current === TOTAL;
  submitBtn.hidden = current !== TOTAL;
}

function goTo(n, goingBack = false) {
  current = Math.min(Math.max(n, 1), TOTAL);
  render(goingBack);
  wizard.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("startBtn").addEventListener("click", () => {
  setView("form");
  current = 1;
  render();
  scrollToTop();
  setTimeout(() => form.elements.studentName.focus({ preventScroll: true }), 450);
});

nextBtn.addEventListener("click", () => {
  if (validateStep(current)) goTo(current + 1);
});
prevBtn.addEventListener("click", () => goTo(current - 1, true));

// زر Enter في حقول النص ينقل للخطوة التالية بدل الإرسال المبكر
form.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.target.tagName === "TEXTAREA") return;
  event.preventDefault();
  if (current < TOTAL) {
    nextBtn.click();
  } else {
    form.requestSubmit();
  }
});

// إزالة رسالة الخطأ عند بدء التعديل
form.querySelectorAll("input, textarea").forEach((control) => {
  ["input", "change"].forEach((evt) =>
    control.addEventListener(evt, () => clearError(control)),
  );
});

/* ---------- الإرسال ---------- */
function collectAnswers() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.submittedAt = new Date().toISOString();
  data.formName = "استبيان نشاطات المدرسة - جمعية قدوة";
  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (current !== TOTAL) return;
  // تحقق نهائي من كل الخطوات
  for (let n = 1; n <= TOTAL; n++) {
    if (!validateStep(n)) {
      if (n !== current) goTo(n, n < current);
      return;
    }
  }

  const label = submitBtn.querySelector("span");
  const originalLabel = label.textContent;

  if (!CONFIG.submitEndpoint) {
    formMessage.hidden = false;
    formMessage.className = "form-message info";
    formMessage.textContent =
      "استقبال الإجابات غير مفعّل بعد، ولن تُرسل إجاباتك حالياً. يرجى ربط النموذج بوجهة استقبال قبل مشاركته مع الطلاب.";
    return;
  }

  try {
    submitBtn.disabled = true;
    prevBtn.disabled = true;
    label.textContent = "جارٍ إرسال إجاباتك...";

    // SheetDB يتوقع السجلات داخل مصفوفة باسم "data"
    const response = await fetch(CONFIG.submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [collectAnswers()] }),
    });
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Submission failed (${response.status}) ${details}`);
    }

    form.reset();
    current = 1;
    render();
    setView("done");
    scrollToTop();
  } catch (error) {
    console.error(error);
    formMessage.hidden = false;
    formMessage.className = "form-message info";
    formMessage.textContent =
      "تعذّر إرسال الإجابات هذه المرة. تأكد من اتصالك بالإنترنت وحاول مجدداً، أو تواصل مع فريق الجمعية.";
    showToast("تعذّر الإرسال، حاول مرة أخرى.");
  } finally {
    submitBtn.disabled = false;
    prevBtn.disabled = false;
    label.textContent = originalLabel;
  }
});

// الحالة الابتدائية
setView("hero");
render();
