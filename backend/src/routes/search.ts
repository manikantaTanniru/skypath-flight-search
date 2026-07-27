import { Router } from "express";
import { validateSearchQuery } from "../middleware/validateSearchQuery";
import { runSearch } from "../services/searchService";
import { FlightGraph } from "../types/flight";

export function searchRouter(graph: FlightGraph): Router {
  const router = Router();

  router.get("/search", validateSearchQuery, (req, res, next) => {
    try {
      const { origin, destination, date } = req.searchQuery!;
      const response = runSearch(graph, origin, destination, date);
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
