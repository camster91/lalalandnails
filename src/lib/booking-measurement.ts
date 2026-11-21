// The spam trap also returns ok:true. Only a created request has a saved ID.
export function savedBookingTracker(onSaved: () => void) {
  const observed = new Set<string>();
  return (status: number, result: {ok?: boolean; id?: unknown}) => {
    if (status !== 201 || result.ok !== true || typeof result.id !== 'string' || !result.id || observed.has(result.id)) return;
    observed.add(result.id);
    onSaved();
  };
}
