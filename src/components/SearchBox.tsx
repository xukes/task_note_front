import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Task } from '../types';
import { api } from '../api';

interface SearchBoxProps {
  onTaskClick: (task: Task) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onTaskClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const search = async () => {
      if (query.trim()) {
        try {
          const tasks = await api.searchTasks(query);
          setResults(tasks);
          setIsOpen(true);
          setSelectedIndex(-1); // Reset selection on new search
        } catch (error) {
          console.error('Search failed:', error);
        }
      } else {
        setResults([]);
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    const timeoutId = setTimeout(search, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (task: Task) => {
    onTaskClick(task);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const formatHighlight = (html: string) => {
    return html.replace(/<mark>/g, '<mark class="text-blue-600 bg-transparent font-bold">');
  };

  return (
    <div className="relative mb-6" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索任务..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      {isOpen && results.length > 0 && (
        <div 
          ref={listRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
        >
          {results.map((task, index) => (
            <div
              key={task.id}
              onClick={() => handleSelect(task)}
              className={`p-3 cursor-pointer border-b border-gray-100 last:border-0 ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-800">
                {task.highlights?.title ? (
                   <span dangerouslySetInnerHTML={{ __html: formatHighlight(task.highlights.title[0]) }} />
                ) : (
                  task.title
                )}
              </div>
              {(task.highlights?.content || (task.notes && task.notes.length > 0)) && (
                <div className="text-sm text-gray-500 truncate mt-1">
                   {task.highlights?.content ? (
                      <span dangerouslySetInnerHTML={{ __html: formatHighlight(task.highlights.content[0]) }} />
                   ) : (
                      task.notes[0]?.content
                   )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
