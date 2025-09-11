import { getConnection } from '../config/database.js';

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// Helper function to safely stringify objects
const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return String(obj);
  }
};

// Helper function to truncate long strings
const truncateString = (str, maxLength = 10000) => {
  if (!str) return null;
  const stringValue = typeof str === 'string' ? str : String(str);
  return stringValue.length > maxLength ? stringValue.substring(0, maxLength) + '...' : stringValue;
};

// Middleware to log ALL API requests
export const logApiRequest = (req, res, next) => {
  const startTime = Date.now();
  console.log(`[RequestLogger] 🔍 Intercepting request: ${req.method} ${req.originalUrl || req.url}`);
  
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  let responseBody = '';
  let responseCaptured = false;

  // Override res.send to capture response
  res.send = function(body) {
    if (!responseCaptured) {
      responseBody = body;
      responseCaptured = true;
    }
    return originalSend.call(this, body);
  };

  // Override res.json to capture response
  res.json = function(body) {
    if (!responseCaptured) {
      responseBody = safeStringify(body);
      responseCaptured = true;
    }
    return originalJson.call(this, body);
  };

  // Override res.end to capture response
  res.end = function(chunk, encoding) {
    if (!responseCaptured && chunk) {
      responseBody = chunk;
      responseCaptured = true;
    }
    return originalEnd.call(this, chunk, encoding);
  };

  // Log the request when response finishes
  res.on('finish', async () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const statusCode = res.statusCode;
    
    // Check if this is an API endpoint that should be logged
    const shouldLog = req.path.startsWith('/api/') || req.originalUrl?.startsWith('/api/');
    
    // Exclude logs management endpoints to prevent infinite logging loop
    const isLogsEndpoint = (req.originalUrl || req.path).includes('/api/logs');
    
    if (shouldLog && !isLogsEndpoint) {
      try {
        const db = getConnection();
        
        const logData = {
          endpoint: req.originalUrl || req.path,
          method: req.method,
          status_code: statusCode,
          success: statusCode >= 200 && statusCode < 400,
          request_body: req.method !== 'GET' ? truncateString(safeStringify(req.body)) : null,
          response_body: truncateString(responseBody),
          error_message: statusCode >= 400 ? truncateString(responseBody) : null,
          client_ip: getClientIP(req),
          user_agent: req.headers['user-agent'],
          user_id: req.user ? req.user.id : null,
          response_time: responseTime
        };

        // Insert log into database
        await db.execute(`
          INSERT INTO api_request_logs (
            endpoint, method, status_code, success, request_body, 
            response_body, error_message, client_ip, user_agent, 
            user_id, response_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          logData.endpoint,
          logData.method,
          logData.status_code,
          logData.success ? 1 : 0,
          logData.request_body,
          logData.response_body,
          logData.error_message,
          logData.client_ip,
          logData.user_agent,
          logData.user_id,
          logData.response_time
        ]);

        console.log(`[RequestLogger] ✅ API request logged: ${logData.endpoint}`);
      } catch (dbError) {
        console.error('[RequestLogger] ❌ Error logging to database:', dbError);
      }
    }
  });

  next();
};

// Middleware specifically for conversion tracking
export const logConversionRequest = (req, res, next) => {
  console.log(`[ConversionLogger] 🎯 Conversion request received: ${req.method} ${req.originalUrl || req.path}`);
  console.log(`[ConversionLogger] 🎯 Conversion data:`, req.body);
  console.log(`[ConversionLogger] 🎯 Client IP:`, getClientIP(req));
  console.log(`[ConversionLogger] 🎯 User Agent:`, req.headers['user-agent']);
  next();
};