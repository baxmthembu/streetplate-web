"use client";

import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) {
      setInvalid(true);
      setMessage("Enter your email address.");
      return;
    }
    if (!emailPattern.test(value)) {
      setInvalid(true);
      setMessage("Enter a valid email address.");
      return;
    }
    setInvalid(false);
    setMessage(
      "Marketing subscriptions are not available yet. Your email was not submitted or stored.",
    );
  }

  return (
    <div className="newsletter-form-wrap">
      <form noValidate onSubmit={submit}>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={invalid}
          required
        />
        <button type="submit">
          Join the waitlist <Search size={18} aria-hidden="true" />
        </button>
      </form>
      {message && (
        <p className="form-message" role={invalid ? "alert" : "status"}>
          {message}
        </p>
      )}
    </div>
  );
}
