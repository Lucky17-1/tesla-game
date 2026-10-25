import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContact } from "@/lib/contact.functions";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Contact — ${SITE.name}` },
      {
        name: "description",
        content: "Get in touch with VoltEdge — corrections, feedback and partnership inquiries.",
      },
      { property: "og:title", content: `Contact — ${SITE.name}` },
      { property: "og:description", content: "Get in touch with the VoltEdge team." },
    ],
  }),
  component: ContactPage,
});

type Status = "idle" | "sending" | "sent" | "error" | "failed";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const MAX = { name: 80, email: 255, message: 2000 } as const;

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = "Please enter your name.";
  else if (form.name.trim().length > MAX.name) errors.name = "Name is too long.";
  if (!form.email.trim()) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
    errors.email = "That email address doesn't look valid.";
  if (!form.message.trim()) errors.message = "Please enter a message.";
  else if (form.message.trim().length < 10)
    errors.message = "Please write at least 10 characters.";
  else if (form.message.trim().length > MAX.message)
    errors.message = `Message must be under ${MAX.message} characters.`;
  return errors;
}

function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "General", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setStatus("idle");
  };

  const send = useServerFn(submitContact);
  const startedAt = useRef(Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [failMsg, setFailMsg] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await send({
        data: { ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim(), website: honeypot, startedAt: startedAt.current },
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", subject: "General", message: "" });
      } else {
        setFailMsg(res.error);
        setStatus("failed");
      }
    } catch {
      setFailMsg("Something went wrong sending your message. Please check your details and try again.");
      setStatus("failed");
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 ${
      hasError ? "border-destructive" : "border-input"
    }`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Contact us</h1>
      <p className="mt-2 text-muted-foreground">
        Corrections, feedback, or partnership inquiries — we read everything.
      </p>

      {status === "sent" && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm"
        >
          <p className="font-semibold text-primary">Thanks — your message was received.</p>
          <p className="mt-1 text-muted-foreground">We'll get back to you at the email address you gave.</p>
        </div>
      )}

      {status === "failed" && (
        <div role="alert" className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="font-semibold text-destructive">{failMsg}</p>
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="font-semibold text-destructive">
            Please fix the highlighted fields below.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={set("name")}
              maxLength={MAX.name}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
              className={inputClass(!!errors.name)}
              placeholder="Your name"
            />
            {errors.name && (
              <p id="contact-name-error" className="mt-1 text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              maxLength={MAX.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
              className={inputClass(!!errors.email)}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p id="contact-email-error" className="mt-1 text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium">
            Subject
          </label>
          <select
            id="contact-subject"
            value={form.subject}
            onChange={set("subject")}
            className={inputClass(false)}
          >
            <option>General</option>
            <option>Correction</option>
            <option>Game feedback</option>
            <option>Partnership</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={6}
            value={form.message}
            onChange={set("message")}
            maxLength={MAX.message}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            className={inputClass(!!errors.message)}
            placeholder="How can we help?"
          />
          {errors.message ? (
            <p id="contact-message-error" className="mt-1 text-xs text-destructive">
              {errors.message}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {form.message.length}/{MAX.message} characters
            </p>
          )}
        </div>

        {/* Honeypot: hidden from people, bots tend to fill it */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-lg bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--primary)]"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>

        <p className="text-xs text-muted-foreground">
          Your message is stored securely and only the site owner can read it.
        </p>
      </form>
    </main>
  );
}
