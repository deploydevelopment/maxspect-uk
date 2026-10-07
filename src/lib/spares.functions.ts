import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadSparesShop, loadSupplyProduct } from "./supply-engine.server";

export const getSparesShop = createServerFn({ method: "GET" }).handler(async () => loadSparesShop());

export const getSupplyProduct = createServerFn({ method: "GET" })
  .validator((id: string) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => loadSupplyProduct(id));
