import { db } from '../config/database.js';

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
  console.log(`[RequestLogger] 🔍 Request headers:`, req.headers);
  console.log(`[RequestLogger] 🔍 Request body:`, req.body);
  console.log(`[RequestLogger] 🔍 Client IP:`, getClientIP(req));
  
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
      console.log(`[RequestLogger] 🔍 Response captured via send():`, typeof body, body ? String(body).substring(0, 200) : 'empty');
    }
    return originalSend.call(this, body);
  };

  // Override res.json to capture response
  res.json = function(body) {
    if (!responseCaptured) {
      responseBody = safeStringify(body);
      responseCaptured = true;
      console.log(`[RequestLogger] 🔍 Response captured via json():`, typeof body, responseBody ? responseBody.substring(0, 200) : 'empty');
    }
    return originalJson.call(this, body);
  };

  // Override res.end to capture response
  res.end = function(chunk, encoding) {
    if (!responseCaptured && chunk) {
      responseBody = chunk;
      responseCaptured = true;
      console.log(`[RequestLogger] 🔍 Response captured via end():`, typeof chunk, chunk ? String(chunk).substring(0, 200) : 'empty');
    }
    return originalEnd.call(this, chunk, encoding);
  };

  // Log the request when response finishes
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const statusCode = res.statusCode;
    
    console.log(`[RequestLogger] 🔍 Response finished for: ${req.method} ${req.originalUrl || req.url}`);
    console.log(`[RequestLogger] 🔍 Status Code: ${statusCode}, Response Time: ${responseTime}ms`);
    console.log(`[RequestLogger] 🔍 Response Body Length: ${responseBody ? String(responseBody).length : 0}`);
    
    // Check if this is an API endpoint that should be logged
    const shouldLog = req.path.startsWith('/api/') || req.originalUrl?.startsWith('/api/');
    
    // Exclude logs management endpoints to prevent infinite logging loop
    const isLogsEndpoint = (req.originalUrl || req.path).includes('/api/logs');
    
    console.log(`[RequestLogger] 🔍 Should log this request? ${shouldLog && !isLogsEndpoint} (path: ${req.path}, originalUrl: ${req.originalUrl}, isLogsEndpoint: ${isLogsEndpoint})`);
    
    if (shouldLog && !isLogsEndpoint) {
      console.log(`[RequestLogger] 🔍 Preparing to log API request to database...`);
      
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

      console.log(`[RequestLogger] 🔍 Log data prepared:`, {
        endpoint: logData.endpoint,
        method: logData.method,
        status_code: logData.status_code,
        success: logData.success,
        client_ip: logData.client_ip,
        user_id: logData.user_id,
        response_time: logData.response_time,
        request_body_length: logData.request_body ? logData.request_body.length : 0,
        response_body_length: logData.response_body ? logData.response_body.length : 0
      });

      // Insert log into database
      const insertQuery = `
        INSERT INTO api_request_logs (
          endpoint, method, status_code, success, request_body, 
          response_body, error_message, client_ip, user_agent, 
          user_id, response_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
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
      ];

      console.log(`[RequestLogger] 🔍 Executing database insert with params:`, insertParams.map((param, index) => 
        index === 4 || index === 5 || index === 6 ? `${typeof param} (length: ${param ? String(param).length : 0})` : param
      ));

      db.run(insertQuery, insertParams, function(err) {
        if (err) {
          console.error('[RequestLogger] ❌ Error inserting log into database:', err);
          console.error('[RequestLogger] ❌ Failed query:', insertQuery);
          console.error('[RequestLogger] ❌ Failed params:', insertParams);
        } else {
          console.log(`[RequestLogger] ✅ API request successfully logged to database. Log ID: ${this.lastID}`);
          console.log(`[RequestLogger] ✅ Logged endpoint: ${logData.endpoint}, Method: ${logData.method}, Status: ${logData.status_code}`);
        }
      });
    } else {
      console.log(`[RequestLogger] 🔍 Skipping log for non-API request: ${req.method} ${req.originalUrl || req.path}`);
    }
  });

  // Handle errors during request processing
  res.on('error', (error) => {
    console.error(`[RequestLogger] ❌ Response error for ${req.method} ${req.originalUrl || req.path}:`, error);
  });

  next();
};

// Middleware specifically for conversion tracking (can be used as additional logging)
export const logConversionRequest = (req, res, next) => {
  console.log(`[ConversionLogger] 🎯 Conversion request received: ${req.method} ${req.originalUrl || req.path}`);
  console.log(`[ConversionLogger] 🎯 Conversion data:`, req.body);
  console.log(`[ConversionLogger] 🎯 Client IP:`, getClientIP(req));
  console.log(`[ConversionLogger] 🎯 User Agent:`, req.headers['user-agent']);
  next();
};