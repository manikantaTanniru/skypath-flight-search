interface AirportInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export default function AirportInput({ label, value, onChange, error, placeholder }: AirportInputProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={3}
        placeholder={placeholder}
        className={error ? "input input-error" : "input"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
