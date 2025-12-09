import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';

interface NewsToolbarProps {
  isMobile?: boolean;
}

const NewsToolbar: React.FC<NewsToolbarProps> = ({ isMobile = false }) => {
  const [showSecondRow, setShowSecondRow] = useState(false);
  const [eaPercent, setEaPercent] = useState('5');
  const [cellPercent, setCellPercent] = useState('5');

  return (
    <div className="absolute top-2 left-2 right-2 z-30 flex flex-col gap-1">
      {/* Row 1: Coverage Filters */}
      <div className="bg-white border border-gray-200 rounded shadow-sm px-2 py-1.5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Coverage Filters:</span>
        
        <Select>
          <SelectTrigger className="w-28 h-7 text-xs">
            <SelectValue placeholder="date" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="09-12-2025">09-12-2025</SelectItem>
            <SelectItem value="08-12-2025">08-12-2025</SelectItem>
            <SelectItem value="07-12-2025">07-12-2025</SelectItem>
            <SelectItem value="06-12-2025">06-12-2025</SelectItem>
            <SelectItem value="05-12-2025">05-12-2025</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue placeholder="tech" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="lte">LTE</SelectItem>
            <SelectItem value="5g">5G</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue placeholder="band" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="700">700</SelectItem>
            <SelectItem value="850">850</SelectItem>
            <SelectItem value="1900">1900</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue placeholder="utm" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="11">11</SelectItem>
            <SelectItem value="12">12</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue placeholder="bs/mc" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="bs">BS</SelectItem>
            <SelectItem value="mc">MC</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Info className="h-4 w-4 text-blue-500" />
        </Button>

        <span className="text-sm text-gray-700 whitespace-nowrap">Cell-ID:</span>
        <Input className="w-28 h-7 text-xs" placeholder="" />

        <Button variant="outline" size="sm" className="h-7 text-xs px-3">
          Search
        </Button>

        <Button variant="outline" size="sm" className="h-7 text-xs px-3">
          Cows
        </Button>

        <Button 
          variant={showSecondRow ? "default" : "outline"} 
          size="sm" 
          className={`h-7 text-xs px-3 ${showSecondRow ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
          onClick={() => setShowSecondRow(!showSecondRow)}
        >
          Test Tools
        </Button>
      </div>

      {/* Row 2: Action Buttons (toggleable) */}
      {showSecondRow && (
        <div className="bg-white border border-gray-200 rounded shadow-sm px-2 py-1.5 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs px-3">
            Draw Polygon
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs px-3">
            Calculate Intersect
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs px-3">
            Calculate MFE Polygon
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs px-3">
            Clear
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs px-3">
            GML
          </Button>

          <span className="text-sm text-gray-700 whitespace-nowrap">EA %:</span>
          <Input 
            type="number" 
            className="w-14 h-7 text-xs" 
            value={eaPercent}
            onChange={(e) => setEaPercent(e.target.value)}
          />

          <span className="text-sm text-gray-700 whitespace-nowrap">Cell %:</span>
          <Input 
            type="number" 
            className="w-14 h-7 text-xs" 
            value={cellPercent}
            onChange={(e) => setCellPercent(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default NewsToolbar;
