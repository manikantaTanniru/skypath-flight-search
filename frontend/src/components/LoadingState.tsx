export default function LoadingState() {
  return (
    <div className="state-panel" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>Searching for flights...</span>
    </div>
  );
}
