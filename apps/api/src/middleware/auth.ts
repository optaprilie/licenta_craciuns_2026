import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Missing token" });
    return;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    res.locals.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
