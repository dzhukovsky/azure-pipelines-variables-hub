import "azure-devops-ui/Core/Observable";
import {
  IObservableArray,
  IObservableValue,
  IReadonlyObservableArray,
  IReadonlyObservableValue,
  useObservable,
  useObservableArray,
  useSubscription,
} from "azure-devops-ui/Core/Observable";
import { DependencyList, useCallback } from "react";

declare module "azure-devops-ui/Core/Observable" {
  export function useSubscription<T>(
    sourceObservable: IReadonlyObservableValue<T>,
    callbackFn: (value: T) => void,
    callbackDependencies?: DependencyList
  ): void;

  export function useSubscription<T>(
    sourceObservable: IReadonlyObservableArray<T>,
    callbackFn: (value: T[]) => void,
    callbackDependencies?: DependencyList
  ): void;

  export function useDerivedObservable<TSource, T>(
    sourceObservable: IReadonlyObservableValue<TSource>,
    getDerivedValue: (source: TSource) => T,
    callbackDependencies: DependencyList
  ): IObservableValue<T>;
}

function useDerivedObservableArray<T>(
  sourceObservable: IReadonlyObservableArray<T>
): IObservableArray<T>;

function useDerivedObservableArray<TSource, T>(
  sourceObservable: IReadonlyObservableArray<TSource>,
  getDerivedValue: (src: TSource[]) => T[],
  callbackDependencies: DependencyList
): IObservableArray<T>;

function useDerivedObservableArray<TSource, T = TSource>(
  sourceObservable: IReadonlyObservableArray<TSource>,
  getDerivedValue: (source: TSource[]) => T[] = (source) =>
    source as unknown as T[],
  callbackDependencies: DependencyList = [sourceObservable]
): IObservableArray<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getDerivedValueCallback = useCallback(
    getDerivedValue,
    callbackDependencies
  );

  const [observable] = useObservableArray(() =>
    getDerivedValueCallback(sourceObservable.value)
  );

  useSubscription(
    sourceObservable,
    (newValue) => {
      const derivedValue = getDerivedValueCallback(newValue);
      observable.splice(0, observable.length, ...derivedValue);
    },
    [getDerivedValueCallback]
  );

  return observable;
}

export function useDerivedObservable<TSource, T>(
  sourceObservable: IReadonlyObservableArray<TSource>,
  getDerivedValue: (source: TSource[]) => T,
  callbackDependencies: DependencyList = [sourceObservable]
): IReadonlyObservableValue<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getDerivedValueCallback = useCallback(
    getDerivedValue,
    callbackDependencies
  );

  const [observable] = useObservable(() =>
    getDerivedValueCallback(sourceObservable.value)
  );

  useSubscription(
    sourceObservable,
    (newValue) => {
      const derivedValue = getDerivedValueCallback(newValue);
      observable.value = derivedValue;
    },
    [getDerivedValueCallback]
  );

  return observable;
}

export { useDerivedObservableArray };
