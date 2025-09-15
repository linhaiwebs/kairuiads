// 日期时间工具函数

/**
 * 获取用户选择的时区
 */
export const getUserTimezone = (): string => {
  return localStorage.getItem('user_timezone') || 'Asia/Shanghai';
};

/**
 * 格式化日期时间，支持时区转换
 * @param dateString - 日期字符串（假设为 UTC 时间）
 * @param targetTimeZone - 目标时区（可选，默认使用用户选择的时区）
 * @param options - 格式化选项
 */
export const formatDateTime = (
  dateString: string, 
  targetTimeZone?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return '-';
  
  try {
    // 如果 dateString 是 MySQL DATETIME 格式 (YYYY-MM-DD HH:MM:SS)，需要明确指定为 UTC
    let date: Date;
    if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // MySQL DATETIME 格式，假设为 UTC 时间
      date = new Date(dateString + 'Z');
    } else {
      // 其他格式，直接解析
      date = new Date(dateString);
    }
    
    const timezone = targetTimeZone || getUserTimezone();
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    return date.toLocaleString('zh-CN', finalOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * 格式化日期（不包含时间）
 * @param dateString - 日期字符串
 * @param targetTimeZone - 目标时区（可选）
 */
export const formatDate = (
  dateString: string, 
  targetTimeZone?: string
): string => {
  return formatDateTime(dateString, targetTimeZone, {
    hour: undefined,
    minute: undefined,
    second: undefined
  });
};

/**
 * 格式化时间（不包含日期）
 * @param dateString - 日期字符串
 * @param targetTimeZone - 目标时区（可选）
 */
export const formatTime = (
  dateString: string, 
  targetTimeZone?: string
): string => {
  return formatDateTime(dateString, targetTimeZone, {
    year: undefined,
    month: undefined,
    day: undefined
  });
};

/**
 * 格式化时间戳（Unix 时间戳）
 * @param timestamp - Unix 时间戳（秒）
 * @param targetTimeZone - 目标时区（可选）
 */
export const formatTimestamp = (
  timestamp: number, 
  targetTimeZone?: string
): string => {
  if (!timestamp) return '-';
  
  const date = new Date(timestamp * 1000);
  const timezone = targetTimeZone || getUserTimezone();
  
  try {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return timestamp.toString();
  }
};

/**
 * 获取时区显示名称
 * @param timezoneId - 时区 ID
 */
export const getTimezoneDisplayName = (timezoneId: string): string => {
  const timezoneMap: { [key: string]: string } = {
    'UTC': 'UTC (协调世界时)',
    'Asia/Shanghai': '北京时间 (UTC+8)',
    'Asia/Tokyo': '东京时间 (UTC+9)',
    'America/New_York': '纽约时间 (UTC-5/-4)',
    'America/Los_Angeles': '洛杉矶时间 (UTC-8/-7)',
    'Europe/London': '伦敦时间 (UTC+0/+1)',
    'Europe/Berlin': '柏林时间 (UTC+1/+2)',
    'Asia/Hong_Kong': '香港时间 (UTC+8)',
    'Asia/Singapore': '新加坡时间 (UTC+8)',
    'Australia/Sydney': '悉尼时间 (UTC+10/+11)',
    'Asia/Seoul': '首尔时间 (UTC+9)',
    'Asia/Dubai': '迪拜时间 (UTC+4)',
    'America/Chicago': '芝加哥时间 (UTC-6/-5)',
    'America/Denver': '丹佛时间 (UTC-7/-6)',
    'Pacific/Auckland': '奥克兰时间 (UTC+12/+13)'
  };
  
  return timezoneMap[timezoneId] || timezoneId;
};