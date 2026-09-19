/* Small pieces shared by the offline prototype and the live workspace. */

import { useState, type ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="fp-field">
      <span className="fp-label">{label}</span>
      {children}
      {hint && !error ? <small className="fp-hint">{hint}</small> : null}
      {error ? <small className="fp-error">{error}</small> : null}
    </label>
  );
}

export function Rows({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="fp-rows">
      {items.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const ACCEPTED = /\.(pdf|png|jpe?g)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

/* Files never leave the browser in the prototype; the live workspace reads the
   chosen file and sends it with the application. Both use the same control, so
   the limits a borrower sees are the limits the API enforces. */
export function Upload({
  label,
  files,
  error,
  sample,
  multiple = true,
  onChange,
  onPick,
}: {
  label: string;
  files: string[];
  error?: string;
  sample?: string[];
  multiple?: boolean;
  onChange: (files: string[]) => void;
  onPick?: (file: File | null) => void;
}) {
  const [problem, setProblem] = useState("");

  const add = (list: FileList | null) => {
    const picked = Array.from(list || []);
    const bad = picked.find((file) => file.size > MAX_BYTES || !ACCEPTED.test(file.name));
    if (bad) {
      setProblem("Use PDF, PNG or JPG files under 5 MB.");
      onPick?.(null);
      return;
    }
    setProblem("");
    onPick?.(picked[0] ?? null);
    onChange(multiple ? [...new Set([...files, ...picked.map((f) => f.name)])] : picked.map((f) => f.name));
  };

  return (
    <div className="fp-upload">
      <div className="fp-upload-head">
        <span className="fp-label">{label}</span>
        {sample ? (
          <button type="button" className="fp-link" onClick={() => onChange(sample)}>
            Use sample files
          </button>
        ) : null}
      </div>
      <input
        type="file"
        aria-label={label}
        multiple={multiple}
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(event) => add(event.target.files)}
      />
      {files.map((file) => (
        <div className="fp-file" key={file}>
          <span>{file}</span>
          <button
            type="button"
            aria-label={`Remove ${file}`}
            onClick={() => {
              onChange(files.filter((f) => f !== file));
              onPick?.(null);
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <small className="fp-hint">
        {onPick ? "Sent to Float with your application." : "Files stay on your device. Only the names are saved."}
      </small>
      {problem ? <small className="fp-error">{problem}</small> : null}
      {error && !problem ? <small className="fp-error">{error}</small> : null}
    </div>
  );
}
