const jwt = require("jsonwebtoken");

// Protects private routes. Verifies the JWT sent in the Authorization
// header and attaches the decoded user id to req.userId.
//
// IMPORTANT: every controller must use req.userId (from the verified
// token) to scope its database queries - never a userId sent in the
// request body or query string. This is what keeps each shop owner's
// data completely isolated from every other owner's.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized. Invalid or expired token." });
  }
}

module.exports = authMiddleware;
