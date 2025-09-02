import React from 'react';
import { X, School, Hospital, ShoppingCart, Users, User, Heart, Minus, AlertTriangle, ArrowUp, Building2, Home, MapPin, Target, Flame, Eye } from 'lucide-react';

interface LegendProps {
  isOpen: boolean;
  onClose: () => void;
}

const Legend: React.FC<LegendProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const legendSections = [
    {
      title: "Shared Zone Statuses",
      items: [
        { icon: "circle", color: "bg-gray-200", label: "Normal" },
        { icon: "circle", color: "bg-purple-500", label: "Shelter in place" },
        { icon: "circle", color: "bg-teal-600", label: "Training" },
        { icon: "stripes", color: "bg-gray-400", label: "Internal zone status" },
        { icon: "circle", color: "bg-blue-500", label: "Advisory" },
        { icon: "circle", color: "bg-yellow-400", label: "Evacuation warning" },
        { icon: "circle", color: "bg-red-500", label: "Evacuation order" },
        { icon: "circle", color: "bg-green-500", label: "Evacuation order lifted" },
      ]
    },
    {
      title: "Critical Evacuation Facilities",
      items: [
        { icon: School, color: "bg-blue-600", label: "School" },
        { icon: Hospital, color: "bg-blue-600", label: "Hospital" },
        { icon: ShoppingCart, color: "bg-blue-600", label: "Childcare" },
        { icon: Users, color: "bg-blue-600", label: "Assisted Living" },
        { icon: User, color: "bg-blue-600", label: "Individual Needs Assistance" },
        { icon: Heart, color: "bg-blue-600", label: "Other" },
      ]
    },
    {
      title: "Traffic",
      items: [
        { icon: Minus, color: "bg-red-700", label: "Road Closure" },
        { icon: AlertTriangle, color: "bg-red-700", label: "Traffic Control Point" },
      ]
    },
    {
      title: "Equipment",
      items: [
        { icon: Target, color: "bg-yellow-600", label: "Sensor" },
        { icon: "speaker", color: "bg-yellow-600", label: "Speaker" },
      ]
    },
    {
      title: "Arrival points",
      items: [
        { icon: ArrowUp, color: "bg-green-500", label: "On-ramp" },
        { icon: Building2, color: "bg-green-500", label: "Temporary Evacuation Point" },
        { icon: "paw", color: "bg-green-500", label: "Animal Shelter" },
        { icon: Building2, color: "bg-green-500", label: "Resource Center" },
        { icon: Home, color: "bg-green-500", label: "Shelter" },
        { icon: MapPin, color: "bg-green-500", label: "Rally Point" },
      ]
    },
    {
      title: "Hazards",
      items: [
        { icon: "circle", color: "bg-pink-300", label: "Red Flag Warning" },
        { icon: "circle", color: "bg-red-500", label: "Heat Detection (MODIS)" },
        { icon: "circle", color: "bg-red-600", label: "Heat Detection (VIIRS)" },
        { icon: "circle", color: "bg-red-700", label: "Active Fire Perimeter" },
        { icon: Flame, color: "bg-red-600", label: "Active Fire" },
      ]
    }
  ];

  const renderIcon = (item: any, index: number) => {
    const iconProps = {
      className: `h-4 w-4 text-white`,
      key: index
    };

    if (item.icon === "circle") {
      return <div className={`w-4 h-4 rounded-full ${item.color}`} />;
    }
    if (item.icon === "stripes") {
      return (
        <div className="w-4 h-4 bg-gray-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-30 transform rotate-45" 
               style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, white 2px, white 4px)' }} />
        </div>
      );
    }
    if (item.icon === "speaker") {
      return (
        <div className={`w-5 h-5 ${item.color} rounded flex items-center justify-center`}>
          <div className="w-2 h-2 bg-white rounded-sm" />
        </div>
      );
    }
    if (item.icon === "paw") {
      return (
        <div className={`w-5 h-5 ${item.color} rounded flex items-center justify-center`}>
          <div className="text-white text-xs">🐾</div>
        </div>
      );
    }

    const IconComponent = item.icon;
    return (
      <div className={`w-5 h-5 ${item.color} rounded flex items-center justify-center`}>
        <IconComponent {...iconProps} />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] m-4">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <h2 className="text-2xl font-semibold text-gray-900">Legend</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {legendSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3">
                      {renderIcon(item, itemIndex)}
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legend;