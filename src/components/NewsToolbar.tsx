import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Info, ChevronDown, Calendar, Radio, Antenna, Map, Signal, Search, Square, Calculator, FileCode, Trash2 } from 'lucide-react';

export interface CoverageFilters {
  tech: string;
  band: string;
  utm: string;
  bsMc: string;
}

interface NewsToolbarProps {
  isMobile?: boolean;
  infoMode?: boolean;
  onInfoModeChange?: (enabled: boolean) => void;
  onFiltersChange?: (filters: CoverageFilters) => void;
  onDateChange?: (date: string) => void;
  onCellIdSearch?: (cellId: string) => void;
}

const NewsToolbar: React.FC<NewsToolbarProps> = ({ isMobile = false, infoMode = false, onInfoModeChange, onFiltersChange, onDateChange, onCellIdSearch }) => {
  const [showSecondRow, setShowSecondRow] = useState(false);
  const [eaPercent, setEaPercent] = useState('5');
  const [cellPercent, setCellPercent] = useState('5');
  const [selectedDate, setSelectedDate] = useState('09-12-2025');
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedBand, setSelectedBand] = useState('');
  const [selectedUtm, setSelectedUtm] = useState('');
  const [selectedBsMc, setSelectedBsMc] = useState('');
  const [cellIdSearch, setCellIdSearch] = useState('');

  const updateFilter = (key: keyof CoverageFilters, value: string) => {
    const newFilters = {
      tech: key === 'tech' ? value : selectedTech,
      band: key === 'band' ? value : selectedBand,
      utm: key === 'utm' ? value : selectedUtm,
      bsMc: key === 'bsMc' ? value : selectedBsMc,
    };
    
    if (key === 'tech') setSelectedTech(value);
    if (key === 'band') setSelectedBand(value);
    if (key === 'utm') setSelectedUtm(value);
    if (key === 'bsMc') setSelectedBsMc(value);
    
    onFiltersChange?.(newFilters);
  };

  const dates = ['09-12-2025', '08-12-2025', '07-12-2025', '06-12-2025', '05-12-2025'];
  const techs = ['LTE', '5G', 'All'];
  const bands = ['700', '850', '1900', 'All'];
  const utms = ['49', '50', '51', '52', '53', '54', '55', '56', 'All'];
  const bsMcs = ['BS', 'MC', 'All'];

  return (
    <div className="absolute top-4 left-4 right-4 z-30 flex flex-col gap-2">
      {/* Row 1: Coverage Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">Coverage Filters:</span>
        
        {/* Date Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{selectedDate || 'Date'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-white border border-gray-200 shadow-lg z-50">
            {dates.map((date) => (
              <DropdownMenuItem key={date} onClick={() => { setSelectedDate(date); onDateChange?.(date); }} className="flex items-center gap-2 hover:bg-gray-100 text-black">
                {date}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tech Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Radio className="h-4 w-4" />
              <span className="text-sm">{selectedTech || 'Tech'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32 bg-white border border-gray-200 shadow-lg z-50">
            {techs.map((tech) => (
              <DropdownMenuItem key={tech} onClick={() => updateFilter('tech', tech)} className="flex items-center gap-2 hover:bg-gray-100 text-black">
                {tech}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Band Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Antenna className="h-4 w-4" />
              <span className="text-sm">{selectedBand || 'Band'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32 bg-white border border-gray-200 shadow-lg z-50">
            {bands.map((band) => (
              <DropdownMenuItem key={band} onClick={() => updateFilter('band', band)} className="flex items-center gap-2 hover:bg-gray-100 text-black">
                {band}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* UTM Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Map className="h-4 w-4" />
              <span className="text-sm">{selectedUtm || 'UTM'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32 bg-white border border-gray-200 shadow-lg z-50">
            {utms.map((utm) => (
              <DropdownMenuItem key={utm} onClick={() => updateFilter('utm', utm)} className="flex items-center gap-2 hover:bg-gray-100 text-black">
                {utm}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* BS/MC Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Signal className="h-4 w-4" />
              <span className="text-sm">{selectedBsMc || 'BS/MC'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32 bg-white border border-gray-200 shadow-lg z-50">
            {bsMcs.map((item) => (
              <DropdownMenuItem key={item} onClick={() => updateFilter('bsMc', item)} className="flex items-center gap-2 hover:bg-gray-100 text-black">
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="secondary" 
          size="sm" 
          className={`h-10 w-10 p-0 border shadow-sm ${infoMode ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          onClick={() => onInfoModeChange?.(!infoMode)}
        >
          <Info className={`h-4 w-4 ${infoMode ? 'text-blue-700' : 'text-blue-500'}`} />
        </Button>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-sm px-2 h-10">
          <span className="text-sm text-gray-700 whitespace-nowrap">Cell-ID:</span>
          <Input 
            className="w-24 h-7 text-sm border-0 shadow-none focus-visible:ring-0 bg-white" 
            placeholder="" 
            value={cellIdSearch}
            onChange={(e) => setCellIdSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && cellIdSearch.trim()) {
                onCellIdSearch?.(cellIdSearch.trim());
              }
            }}
          />
        </div>

        <Button 
          variant="secondary" 
          size="sm" 
          className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1"
          onClick={() => {
            if (cellIdSearch.trim()) {
              onCellIdSearch?.(cellIdSearch.trim());
            }
          }}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search</span>
        </Button>

        <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600">
          <span className="text-sm">Cows</span>
        </Button>

        <Button 
          variant="secondary" 
          size="sm" 
          className={`h-10 px-3 border shadow-sm flex items-center gap-1 ${showSecondRow ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setShowSecondRow(!showSecondRow)}
        >
          <span className="text-sm">Test Tools</span>
        </Button>
      </div>

      {/* Row 2: Action Buttons (toggleable) */}
      {showSecondRow && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
            <Square className="h-4 w-4" />
            <span className="text-sm">Draw Polygon</span>
          </Button>

          <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            <span className="text-sm">Calculate Intersect</span>
          </Button>

          <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            <span className="text-sm">Calculate MFE Polygon</span>
          </Button>

          <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">Clear</span>
          </Button>

          <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
            <FileCode className="h-4 w-4" />
            <span className="text-sm">GML</span>
          </Button>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-sm px-2 h-10">
            <span className="text-sm text-gray-700 whitespace-nowrap">EA %:</span>
            <Input 
              type="number" 
              className="w-14 h-7 text-sm border-0 shadow-none focus-visible:ring-0 bg-white text-black" 
              value={eaPercent}
              onChange={(e) => setEaPercent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-sm px-2 h-10">
            <span className="text-sm text-gray-700 whitespace-nowrap">Cell %:</span>
            <Input 
              type="number" 
              className="w-14 h-7 text-sm border-0 shadow-none focus-visible:ring-0 bg-white text-black" 
              value={cellPercent}
              onChange={(e) => setCellPercent(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsToolbar;
