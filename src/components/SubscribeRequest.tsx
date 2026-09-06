import { useState } from "react";
import { PAY_NAME, PAY_NUMBER, PAY_NUMBER_ALT, isActivationCode, saveRequest, type PayRequest } from "@/lib/billing";

export default function SubscribeRequest({
  plan,
  price,
  title,
  blurb,
  onActivated,
}: {
  plan: PayRequest["plan"];
  price: string;
  title: string;
  blurb: string;
  onActivated: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setError("Please add your name and a number or email we can reply to.");
      return;
    }
    setError("");
    saveRequest({
      id: `r_${Date.now()}`,
      at: Date.now(),
      plan,
      name: name.trim(),
      contact: contact.trim(),
      message: message.trim(),
    });
    setSent(true);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-xl font-black tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>

      {!sent ? (
        <form onSubmit={send} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Your number or email"
              className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={`Message us about the ${price} plan…`}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90"
              style={{ background: "var(--gradient-fun)" }}
            >
              Send request ({price})
            </button>
            <span className="text-xs text-muted-foreground">Feedback box only — no live chat. We reply on your number.</span>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold">✅ Request sent. Now pay {price} to this number:</p>
            <p className="mt-2 select-all text-2xl font-black tracking-tight">{PAY_NUMBER}</p>
            <p className="select-all text-lg font-black tracking-tight text-muted-foreground">{PAY_NUMBER_ALT}</p>
            <p className="text-xs text-muted-foreground">Account name: {PAY_NAME}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Send the transfer, then we send you an activation code on your number. Paste it below to unlock. No refunds on cancel — money and Focolara already given are not returned.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Activation code"
              className="min-w-52 flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => (isActivationCode(code) ? onActivated() : setError("That code is not valid yet."))}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Activate
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
