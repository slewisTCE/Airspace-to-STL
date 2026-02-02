import { useEffect, useRef } from 'react';

export function useWhatChanged(deps: unknown[], hookName = 'useMemo') {
  const prevDeps = useRef(deps);

  useEffect(() => {
    const changedDependencies = deps.map((newDep, index) => {
      const oldDep = prevDeps.current[index];
      if (newDep !== oldDep) {
        if (typeof newDep === 'object' && typeof oldDep === 'object') {
          return `Dependency at index ${index} changed. Old: ${JSON.stringify(oldDep)}, New: ${JSON.stringify(newDep)}`;
        }
        return `Dependency at index ${index} changed. Old: ${oldDep}, New: ${newDep}`;
      }
      return null;
    }).filter(item => item !== null);

    if (changedDependencies.length > 0) {
      console.log(`${hookName} re-ran. Changed dependencies:`, changedDependencies);
    }
    
    prevDeps.current = deps;
  }, [deps, hookName]);
}

