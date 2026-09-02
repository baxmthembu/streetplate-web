import { FlaskConical } from "lucide-react";

export function DemoNotice() {
  return (
    <aside className="demo-notice">
      <FlaskConical size={18} aria-hidden="true" />
      <p>
        Preview content — vendor names, meals and prices on this screen are
        design fixtures, not production marketplace claims.
      </p>
    </aside>
  );
}
