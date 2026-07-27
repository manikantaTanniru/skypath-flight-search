const AIRPORT_CODE_RE = /^[A-Za-z]{3}$/;

export interface SearchFormValues {
  origin: string;
  destination: string;
  date: string;
}

export interface SearchFormErrors {
  origin?: string;
  destination?: string;
  date?: string;
}

export function validateSearchForm(values: SearchFormValues): SearchFormErrors {
  const errors: SearchFormErrors = {};

  if (!values.origin.trim()) {
    errors.origin = "Origin is required.";
  } else if (!AIRPORT_CODE_RE.test(values.origin.trim())) {
    errors.origin = "Origin must be a 3-letter airport code.";
  }

  if (!values.destination.trim()) {
    errors.destination = "Destination is required.";
  } else if (!AIRPORT_CODE_RE.test(values.destination.trim())) {
    errors.destination = "Destination must be a 3-letter airport code.";
  }

  if (
    !errors.origin &&
    !errors.destination &&
    values.origin.trim().toUpperCase() === values.destination.trim().toUpperCase()
  ) {
    errors.destination = "Destination must be different from origin.";
  }

  if (!values.date.trim()) {
    errors.date = "Date is required.";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date.trim())) {
    errors.date = "Date must be in YYYY-MM-DD format.";
  }

  return errors;
}
