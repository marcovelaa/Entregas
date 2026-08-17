"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPosData,
  fetchPosProducts,
  getRequestErrorMessage,
  isRequestCancelled,
} from "../pos-api";
import type { PosData } from "../pos-types";

const emptyPosData: PosData = {
  productos: [],
  clientes: [],
  categorias: [],
  aprobadores: [],
};

type LoadStatus = "loading" | "ready" | "error";

export function usePosData() {
  const [data, setData] = useState<PosData>(emptyPosData);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const productRequestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    setError(null);

    try {
      const nextData = await fetchPosData(controller.signal);
      if (!controller.signal.aborted) {
        setData(nextData);
        setStatus("ready");
      }
    } catch (requestError) {
      if (!controller.signal.aborted && !isRequestCancelled(requestError)) {
        setStatus("error");
        setError(
          getRequestErrorMessage(
            requestError,
            "No se pudo cargar el catálogo de caja.",
          ),
        );
      }
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    productRequestRef.current?.abort();
    const controller = new AbortController();
    productRequestRef.current = controller;

    try {
      const productos = await fetchPosProducts(controller.signal);
      if (!controller.signal.aborted) {
        setData((current) => ({ ...current, productos }));
      }
    } catch (requestError) {
      if (!controller.signal.aborted && !isRequestCancelled(requestError)) {
        setError(
          getRequestErrorMessage(
            requestError,
            "No se pudo actualizar el catálogo de caja.",
          ),
        );
      }
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
      requestRef.current?.abort();
      productRequestRef.current?.abort();
    };
  }, [load]);

  return {
    ...data,
    status,
    error,
    retry: load,
    refreshProducts,
  };
}
