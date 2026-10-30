import * as React from "react";

import { useAsRef } from "@/hooks/use-as-ref";
import type { ActionState } from "@/types/action-state";

/**
 * Runs `onResult` once for each new `useActionState` result.
 *
 * A plain `useEffect(..., [state, onSaved])` re-runs whenever a parent passes a
 * new callback, so one result could toast twice, refetch again and again, or
 * restart a `router.push` until the navigation never finished. The state object
 * is new per action call, so its identity tells a new result from a re-render.
 */
function useActionResult<TData>(
  state: ActionState<TData>,
  onResult: (state: ActionState<TData>) => void,
) {
  const handledState = React.useRef(state);
  const onResultRef = useAsRef(onResult);

  React.useEffect(() => {
    if (state === handledState.current) return;
    handledState.current = state;

    onResultRef.current(state);
  }, [state, onResultRef]);
}

export { useActionResult };
