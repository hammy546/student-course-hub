// Client-side: handles the interest registration and withdrawal forms without a full page reload.
// This is the "asynchronous client-side update" pattern for Video 3.

// ── Register interest ────────────────────────────────────────
const form = document.getElementById("interest-form");
const message = document.getElementById("interest-message");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const programmeId = form.dataset.programmeId;
    const data = new FormData(form);
    const submitBtn = form.querySelector("button[type='submit']");

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const res = await fetch(`/programmes/${programmeId}/interest`, {
        method: "POST",
        body: data,
      });

      const json = await res.json();

      message.textContent = json.message ?? json.error ?? "Something went wrong.";
      message.className = "interest-feedback " + (res.ok ? "success" : "error");

      if (res.ok) {
        form.reset();
      }
    } catch {
      message.textContent = "Network error — please try again.";
      message.className = "interest-feedback error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register interest";
    }
  });
}

// ── Withdraw interest ────────────────────────────────────────
const withdrawForm = document.getElementById("withdraw-form");
const withdrawMessage = document.getElementById("withdraw-message");

if (withdrawForm) {
  withdrawForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const programmeId = withdrawForm.dataset.programmeId;
    const data = new FormData(withdrawForm);
    const submitBtn = withdrawForm.querySelector("button[type='submit']");

    submitBtn.disabled = true;
    submitBtn.textContent = "Withdrawing…";

    try {
      const res = await fetch(`/programmes/${programmeId}/interest`, {
        method: "DELETE",
        body: data,
      });

      const json = await res.json();

      withdrawMessage.textContent = json.message ?? json.error ?? "Something went wrong.";
      withdrawMessage.className = "interest-feedback " + (res.ok ? "success" : "error");

      if (res.ok) {
        withdrawForm.reset();
      }
    } catch {
      withdrawMessage.textContent = "Network error — please try again.";
      withdrawMessage.className = "interest-feedback error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Withdraw interest";
    }
  });
}
