import ResultsList from "./components/ResultsList";
import SearchForm from "./components/SearchForm";
import { useFlightSearch } from "./hooks/useFlightSearch";

export default function App() {
  const { state, runSearch } = useFlightSearch();

  return (
    <main className="page">
      <h1>SkyPath</h1>
      <p>Flight connection search</p>
      <SearchForm onSubmit={runSearch} isLoading={state.status === "loading"} />
      {state.status === "success" && <ResultsList data={state.data} />}
      {state.status === "error" && <p role="alert">{state.error.message}</p>}
    </main>
  );
}
