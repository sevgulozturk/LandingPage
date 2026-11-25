/* ==========================================================================
   Sèmuse Mosaic — landing page scripts
   1. Countdown to the next workshop
   2. Sign-up form → Web3Forms API → delivered to the owner's email
   ========================================================================== */

/* ---------- Configuration (edit these) ---------- */
const CONFIG = {
  // Next workshop start (ISO 8601 with timezone offset)
  nextWorkshop: "2026-12-05T14:00:00-05:00",

  // Free access key from https://web3forms.com (enter your email there; the
  // key is safe to expose in front-end code — it can only send to that email).
  web3formsKey: "YOUR_ACCESS_KEY_HERE",
  apiUrl: "https://api.web3forms.com/submit",
};

/* ---------- 1. Countdown ---------- */
(function initCountdown() {
  const els = {
    d: document.getElementById("d"),
    h: document.getElementById("h"),
    m: document.getElementById("m"),
    s: document.getElementById("s"),
  };
  if (!els.d) return;

  const target = new Date(CONFIG.nextWorkshop).getTime();
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    let diff = Math.max(0, target - Date.now());
    const units = [
      ["d", 86_400_000],
      ["h", 3_600_000],
      ["m", 60_000],
      ["s", 1_000],
    ];
    for (const [key, ms] of units) {
      els[key].textContent = pad(Math.floor(diff / ms));
      diff %= ms;
    }
  }

  tick();
  setInterval(tick, 1000);
})();

/* ---------- 2. Sign-up form ---------- */
(function initSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const emailInput = form.elements.email;
  const consent = form.elements.consent;
  const honeypot = form.elements.botcheck;
  const button = document.getElementById("submitBtn");
  const message = document.getElementById("formMsg");
  const thanks = document.getElementById("thanks");
  const defaultLabel = button.textContent;

  const showError = (text, field) => {
    message.textContent = text;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  };

  const clearErrors = () => {
    message.textContent = "";
    emailInput.removeAttribute("aria-invalid");
  };

  // Validate on the client before calling the API
  function validate() {
    if (!emailInput.value.trim() || !emailInput.checkValidity()) {
      showError("Please enter a valid email address.", emailInput);
      return false;
    }
    if (!consent.checked) {
      showError("Please tick the box to receive updates.");
      return false;
    }
    return true;
  }

  // Send the submission with fetch() to the Web3Forms API.
  // API reference: https://docs.web3forms.com/getting-started/api-reference
  async function sendToApi() {
    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey,
        subject: "New Sèmuse Mosaic workshop sign-up",
        from_name: "Sèmuse Mosaic website",
        email: emailInput.value.trim(),
        message: "This visitor asked to hear about upcoming mosaic lamp workshops.",
        botcheck: honeypot.checked, // spam protection
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Request failed");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    if (honeypot.checked) return; // a bot filled the hidden field
    if (!validate()) return;

    // Friendly reminder while the site owner has not added their key yet
    if (CONFIG.web3formsKey === "YOUR_ACCESS_KEY_HERE") {
      showError("Form is not connected yet: add your Web3Forms access key in js/main.js.");
      return;
    }

    button.disabled = true;
    button.textContent = "Sending…";

    try {
      await sendToApi();
      form.style.display = "none";
      thanks.style.display = "block";
    } catch (error) {
      console.error("Sign-up failed:", error);
      showError("Something went wrong. Please try again in a moment.");
      button.disabled = false;
      button.textContent = defaultLabel;
    }
  });

  emailInput.addEventListener("input", clearErrors);
})();
