import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, CheckSquare, Square } from 'lucide-react';

interface Option {
  id: number;
  name: string;
}

interface EnhancedMultiSelectProps {
  options: Option[];
  selectedValues: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  label?: string;
  loading?: boolean;
  required?: boolean;
}

const EnhancedMultiSelect: React.FC<EnhancedMultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "选择选项...",
  label,
  loading = false,
  required = false
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
      const newSelectedValues = selectedValues.filter(id => id !== optionId);
      onChange(newSelectedValues);
    } else {
      const newSelectedValues = [...selectedValues, optionId];
      onChange(newSelectedValues);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredOptions.map(option => option.id);
    const newSelectedValues = [...new Set([...selectedValues, ...allIds])];
    onChange(newSelectedValues);
  };

  const handleDeselectAll = () => {
    const filteredIds = filteredOptions.map(option => option.id);
    const newSelectedValues = selectedValues.filter(id => !filteredIds.includes(id));
    onChange(newSelectedValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
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
                {selectedOptions.slice(0, 3).map(option => (
                  <span
                    key={option.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {option.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleOption(option.id);
                      }}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedOptions.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    +{selectedOptions.length - 3} 更多
                  </span>
                )}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200 space-y-2">
            <input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll();
                }}
                className="flex-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                选择全部
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeselectAll();
                }}
                className="flex-1 px-3 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                取消全部
              </button>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <span>加载中...</span>
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
                  <div className="flex items-center justify-center w-4 h-4 mr-3">
                    {selectedValues.includes(option.id) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${
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

export default EnhancedMultiSelect;