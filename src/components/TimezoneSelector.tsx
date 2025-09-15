import React, { useState, useEffect } from 'react';
import { Globe, Clock } from 'lucide-react';

interface TimezoneOption {
  id: string;
  name: string;
  offset: string;
}

interface TimezoneSelectorProps {
  className?: string;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ className = '' }) => {
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');

  // 常用时区列表
  const timezoneOptions: TimezoneOption[] = [
    { id: 'UTC', name: 'UTC (协调世界时)', offset: '+00:00' },
    { id: 'Asia/Shanghai', name: '北京时间 (UTC+8)', offset: '+08:00' },
    { id: 'Asia/Tokyo', name: '东京时间 (UTC+9)', offset: '+09:00' },
    { id: 'America/New_York', name: '纽约时间 (UTC-5/-4)', offset: '-05:00' },
    { id: 'America/Los_Angeles', name: '洛杉矶时间 (UTC-8/-7)', offset: '-08:00' },
    { id: 'Europe/London', name: '伦敦时间 (UTC+0/+1)', offset: '+00:00' },
    { id: 'Europe/Berlin', name: '柏林时间 (UTC+1/+2)', offset: '+01:00' },
    { id: 'Asia/Hong_Kong', name: '香港时间 (UTC+8)', offset: '+08:00' },
    { id: 'Asia/Singapore', name: '新加坡时间 (UTC+8)', offset: '+08:00' },
    { id: 'Australia/Sydney', name: '悉尼时间 (UTC+10/+11)', offset: '+10:00' },
    { id: 'Asia/Seoul', name: '首尔时间 (UTC+9)', offset: '+09:00' },
    { id: 'Asia/Dubai', name: '迪拜时间 (UTC+4)', offset: '+04:00' },
    { id: 'America/Chicago', name: '芝加哥时间 (UTC-6/-5)', offset: '-06:00' },
    { id: 'America/Denver', name: '丹佛时间 (UTC-7/-6)', offset: '-07:00' },
    { id: 'Pacific/Auckland', name: '奥克兰时间 (UTC+12/+13)', offset: '+12:00' }
  ];

  useEffect(() => {
    // 从 localStorage 读取用户选择的时区
    const savedTimezone = localStorage.getItem('user_timezone');
    if (savedTimezone) {
      setSelectedTimezone(savedTimezone);
    } else {
      // 默认使用北京时间
      setSelectedTimezone('Asia/Shanghai');
      localStorage.setItem('user_timezone', 'Asia/Shanghai');
    }
  }, []);

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    console.log('🕐 [TimezoneSelector] Timezone changed from', selectedTimezone, 'to', newTimezone);
    setSelectedTimezone(newTimezone);
    localStorage.setItem('user_timezone', newTimezone);
    
    // 触发自定义事件，通知其他组件时区已更改
    window.dispatchEvent(new CustomEvent('timezoneChanged', { 
      detail: { timezone: newTimezone } 
    }));
    console.log('🕐 [TimezoneSelector] Dispatched timezoneChanged event');
  };

  const getCurrentTime = () => {
    if (!selectedTimezone) return '';
    
    try {
      const now = new Date();
      return now.toLocaleString('zh-CN', {
        timeZone: selectedTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-gray-500" />
        <select
          value={selectedTimezone}
          onChange={handleTimezoneChange}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {timezoneOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedTimezone && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{getCurrentTime()}</span>
        </div>
      )}
    </div>
  );
};

export default TimezoneSelector;