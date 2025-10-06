const loggerMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`;
  
  console.log(logMessage);
  
  // Store the timestamp in the request object for potential use in response
  req.requestTimestamp = timestamp;
  
  next();
};

module.exports = loggerMiddleware;