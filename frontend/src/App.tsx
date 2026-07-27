import EmptyState from "./components/EmptyState";
import ErrorBanner from "./components/ErrorBanner";
import LoadingState from "./components/LoadingState";
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
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorBanner message={state.error.message} />}
      {state.status === "success" && state.data.count === 0 && (
        <EmptyState origin={state.data.origin} destination={state.data.destination} date={state.data.date} />
      )}
      {state.status === "success" && state.data.count > 0 && <ResultsList data={state.data} />}
    </main>
  );
}
