import React, { useState } from 'react';
import { ChevronDown, CheckCircle, Clock, AlertCircle, Eye, FileText } from 'lucide-react';

const TaskStatusDropdown = ({ task, onStatusChange, onEvidenceRequired }) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    {
      value: 'not-started',
      label: 'Not Started',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      available: task.status === 'not-started'
    },
    {
      value: 'accept',
      label: 'Accept Task',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      available: task.status === 'not-started' || task.status === 'assigned',
      requiresEvidence: false // Changed to false for single click
    },
    {
      value: 'in-progress',
      label: 'In Progress',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      available: task.status === 'accepted' || task.status === 'in-progress' || task.status === 'needs-revision'
    },
    {
      value: 'review',
      label: 'Ready for Review',
      icon: Eye,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      available: task.status === 'in-progress' || task.status === 'needs-revision',
      requiresEvidence: true // Require evidence when submitting for review
    },
    {
      value: 'cant-complete',
      label: "Can't Complete",
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      available: task.status === 'in-progress',
      requiresEvidence: true // Requires details/reason
    }
  ];

  const getCurrentStatus = () => {
    const currentStatus = statusOptions.find(option => option.value === task.status);
    if (currentStatus) return currentStatus;
    
    // Handle special cases
    if (task.status === 'assigned') {
      return {
        value: 'assigned',
        label: 'Assigned',
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      };
    }
    
    if (task.status === 'needs-revision') {
      return {
        value: 'needs-revision',
        label: 'Needs Revision',
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      };
    }
    
    if (task.status === 'completed') {
      return {
        value: 'completed',
        label: 'Completed',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    }
    
    return statusOptions[0]; // Default to not-started
  };

  const currentStatus = getCurrentStatus();
  const CurrentIcon = currentStatus.icon;

  const handleStatusSelect = (option) => {
    setIsOpen(false);
    
    if (option.requiresEvidence) {
      // Open evidence modal
      onEvidenceRequired(option.value, task);
    } else {
      // Direct status change
      onStatusChange(task._id, option.value);
    }
  };

  const availableOptions = statusOptions.filter(option => 
    option.available && option.value !== task.status
  );

    return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${currentStatus.bgColor} ${currentStatus.color} hover:opacity-80 shadow-sm border border-transparent hover:shadow-md`}
      >
        <CurrentIcon className="h-4 w-4 mr-2" />
        {currentStatus.label}
        <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {availableOptions.length > 0 ? (
                availableOptions.map((option) => {
                  const OptionIcon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option)}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <OptionIcon className="h-4 w-4 mr-3 text-gray-500" />
                      {option.label}
                      {option.requiresEvidence && (
                        <span className="ml-auto text-xs text-blue-500">Evidence Required</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No status changes available
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskStatusDropdown;