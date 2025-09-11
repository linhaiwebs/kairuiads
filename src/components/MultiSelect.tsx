import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  id: number;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  label?: string;
  loading?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "选择选项...",
  label,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => 
    selectedValues.includes(option.id)
  );

  const handleToggleOption = (optionId: number) => {
    if (selectedValues.includes(optionId)) {
      // 如果已选中，则取消选择
      const newSelectedValues = selectedValues.filter(id => id !== optionId);
      onChange(newSelectedValues);
    } else {
      // 如果未选中，则添加到选择列表
      const newSelectedValues = [...selectedValues, optionId];
      onChange(newSelectedValues);
    }
  };

  const handleRemoveOption = (optionId: number) => {
    const newSelectedValues = selectedValues.filter(id => id !== optionId);
    onChange(newSelectedValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div
        className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map(option => (
                  <span
                    key={option.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {option.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveOption(option.id);
                      }}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mx-auto"></div>
                <span className="ml-2">加载中...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                没有找到选项
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                    selectedValues.includes(option.id) ? 'bg-indigo-50' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleOption(option.id);
                  }}
                >
                  <div className={`flex items-center justify-center w-4 h-4 mr-3 border rounded ${
                    selectedValues.includes(option.id) 
                      ? 'border-indigo-600 bg-indigo-600' 
                      : 'border-gray-300'
                  }`}>
                    {selectedValues.includes(option.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    selectedValues.includes(option.id) ? 'text-indigo-900 font-medium' : 'text-gray-900'
                  }`}>
                    {option.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;