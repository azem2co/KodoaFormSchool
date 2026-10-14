// إعدادات المشروع: ضع روابط صفحات الجمعية، ثم رابط استقبال الإجابات عند تجهيز الربط.
const CONFIG = {
  facebookUrl: "https://www.facebook.com/QudwaAssoc/", // مثال: https://www.facebook.com/YourPage
  instagramUrl: "https://www.instagram.com/qudwaassoc/", // مثال: https://www.instagram.com/YourPage
  // SheetDB API المرتبط بجدول Google Sheets
  submitEndpoint: "https://sheetdb.io/api/v1/up8tahpqes5ri",
};

const form = document.getElementById("surveyForm");
const formMessage = document.getElementById("formMessage");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function setSocialLink(selector, url) {
  const link = document.querySelector(selector);
  if (!link) return;
  if (url && /^https:\/\/(www\.)?(facebook\.com|instagram\.com)\//i.test(url)) {
    link.href = url;
    link.classList.remove("is-disabled");
  } else {
    link.href = "#social";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast(
        "أضف رابط الصفحة الحقيقي داخل CONFIG في ملف script.js قبل نشر الموقع.",
      );
    });
  }
}
setSocialLink('[data-social="facebook"]', CONFIG.facebookUrl);
setSocialLink('[data-social="instagram"]', CONFIG.instagramUrl);

function clearErrors() {
  form
    .querySelectorAll(".invalid")
    .forEach((el) => el.classList.remove("invalid"));
  form.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
  formMessage.hidden = true;
  formMessage.className = "form-message";
}

function showFieldError(control, message) {
  control.classList.add("invalid");
  const parent = control.closest(".field, .question-block, .choice-fieldset");
  const error = parent ? parent.querySelector(".field-error") : null;
  if (error) error.textContent = message;
}

function validateForm() {
  clearErrors();
  let firstInvalid = null;
  const requiredFields = [
    ["studentName", "اكتب اسم الطالب لو سمحت."],
    ["grade", "اختار الصف لو سمحت."],
    ["bestPart", "اختار أفضل فقرة."],
    ["bestReason", "خبرنا ليش اخترت هالفقرة."],
    ["worstPart", "اختار الفقرة الأقل تفضيلاً."],
    ["worstReason", "خبرنا شو ما ناسبك أو شو ممكن نطوّر."],
  ];
  requiredFields.forEach(([name, message]) => {
    const control = form.elements[name];
    if (control && !String(control.value || "").trim()) {
      showFieldError(control, message);
      firstInvalid ||= control;
    }
  });

  if (!form.querySelector('input[name="outsideInterest"]:checked')) {
    const fieldset = form.querySelector(".choice-fieldset");
    const error = fieldset.querySelector(".field-error");
    error.textContent = "اختار الجواب الأقرب لرأيك.";
    firstInvalid ||= fieldset.querySelector("input");
  }
  if (firstInvalid) {
    firstInvalid.focus({ preventScroll: true });
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("بقي كم حقل مطلوب؛ راجع الإجابات المعلّمة.");
    return false;
  }
  return true;
}

function collectAnswers() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.submittedAt = new Date().toISOString();
  data.formName = "استبيان نشاطات المدرسة - جمعية قدوة";
  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateForm()) return;
  const submitButton = form.querySelector(".submit-button");
  const buttonLabel = submitButton.querySelector("span");
  const originalLabel = buttonLabel.textContent;
  const answers = collectAnswers();

  if (!CONFIG.submitEndpoint) {
    formMessage.hidden = false;
    formMessage.className = "form-message info";
    formMessage.textContent =
      "التصميم جاهز، لكن استقبال الإجابات غير مفعّل بعد. لن تُرسل إجاباتك حالياً. على إدارة الموقع ربط النموذج بوجهة استقبال آمنة قبل مشاركته مع الطلاب.";
    formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("النموذج بحاجة لربط استقبال الإجابات قبل النشر.");
    return;
  }

  try {
    submitButton.disabled = true;
    buttonLabel.textContent = "عم نرسل إجاباتك...";
    // SheetDB expects records wrapped in a "data" array.
    const response = await fetch(CONFIG.submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [answers] }),
    });
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Submission failed (${response.status}) ${details}`);
    }
    formMessage.hidden = false;
    formMessage.className = "form-message success";
    formMessage.textContent = "وصلت إجاباتك، شكراً لمشاركتك! 💙";
    form.reset();
    formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    formMessage.hidden = false;
    formMessage.className = "form-message info";
    formMessage.textContent =
      "ما قدرنا نرسل الإجابات هالمرة. تأكد من الاتصال وحاول من جديد، أو تواصل مع فريق الجمعية.";
    showToast("تعذّر الإرسال. جرّب مرة ثانية.");
  } finally {
    submitButton.disabled = false;
    buttonLabel.textContent = originalLabel;
  }
});

// امسح رسالة الخطأ بمجرد أن يبدأ الطالب بتعديل الحقل.
form.querySelectorAll("input, select, textarea").forEach((control) => {
  control.addEventListener("input", () => {
    control.classList.remove("invalid");
    const parent = control.closest(".field, .question-block, .choice-fieldset");
    const error = parent?.querySelector(".field-error");
    if (error) error.textContent = "";
  });
  control.addEventListener("change", () => {
    control.classList.remove("invalid");
    const parent = control.closest(".field, .question-block, .choice-fieldset");
    const error = parent?.querySelector(".field-error");
    if (error) error.textContent = "";
  });
});
