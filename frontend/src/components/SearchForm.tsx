import { FormEvent, useState } from "react";
import { SearchParams } from "../api/searchClient";
import { SearchFormErrors, validateSearchForm } from "../utils/validation";
import AirportInput from "./AirportInput";

interface SearchFormProps {
  onSubmit: (params: SearchParams) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<SearchFormErrors>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = { origin, destination, date };
    const validationErrors = validateSearchForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        date: date.trim()
      });
    }
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} noValidate>
      <AirportInput label="Origin" value={origin} onChange={setOrigin} error={errors.origin} placeholder="JFK" />
      <AirportInput
        label="Destination"
        value={destination}
        onChange={setDestination}
        error={errors.destination}
        placeholder="LAX"
      />
      <label className="field">
        <span className="field-label">Date</span>
        <input
          type="date"
          value={date}
          className={errors.date ? "input input-error" : "input"}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={Boolean(errors.date)}
        />
        {errors.date && <span className="field-error">{errors.date}</span>}
      </label>
      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? "Searching..." : "Search flights"}
      </button>
    </form>
  );
}
