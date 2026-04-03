// Client-side: handles the interest registration form without a full page reload.
// This is the "asynchronous client-side update" pattern for Video 3.

const form = document.getElementById("interest-form");
const message = document.getElementById("interest-message");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent traditional form submission

    const programmeId = form.dataset.programmeId;
    const data = new FormData(form);

    try {
      const res = await fetch(`/programmes/${programmeId}/interest`, {
        method: "POST",
        body: data,
      });

      const json = await res.json();

      message.textContent = json.message ?? json.error ?? "Something went wrong.";
      message.className = res.ok ? "success" : "error";

      if (res.ok) {
        form.reset();
      }
    } catch {
      message.textContent = "Network error — please try again.";
      message.className = "error";
    }
  });
}