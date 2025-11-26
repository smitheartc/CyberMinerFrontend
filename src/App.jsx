import React, { useState } from 'react';

// Define the Boolean search operators for the dropdown
const searchOptions = [
  { id: 'AND', label: 'AND' },
  { id: 'OR', label: 'OR' },
  { id: 'NOT', label: 'NOT' },
];

// Reusable Arrow Icon component
const ChevronDownIcon = ({ isOpen }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
  </svg>
);

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  // Default to 'AND' operator
  const [selectedOperatorId, setSelectedOperatorId] = useState('OR');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Find the currently selected operator object
  const selectedOperator = searchOptions.find(opt => opt.id === selectedOperatorId);

  // Handler for selecting an item from the dropdown
  const handleOptionSelect = (id) => {
    setSelectedOperatorId(id);
    setIsDropdownOpen(false); // Close the dropdown after selection
  };

  // Handler for the main search action
   async function handleSearch() {
    if (!searchTerm.trim()) {
        console.log("Search term is empty.");
        return;
    }


    
    // Log the full Boolean search string
    const fullQuery = `${selectedOperator.label} ${searchTerm}`;
    console.log(`Executing Boolean Search: ${fullQuery}`);
    
    const res = await fetch('http://localhost:8080/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "searchTerm": searchTerm, "operator": selectedOperator.label }),
    })
    const json =await res.json()
    console.log(json);
    console.log(json[1])
  };

  // Handler for key down event on the container
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      {/* Container for the search bar and the dropdown, needs relative positioning */}
      <div className="w-full max-w-lg md:max-w-xl relative">
        
        {/* The Pill-Shaped Search Bar */}
        <div 
          className="flex border-2 border-gray-300 rounded-full bg-white transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20"
          onKeyDown={handleKeyDown}
        >

          {/* 1. The Main Input Field */}
          <input
            type="text"
            placeholder="Enter search terms..."
            aria-label="Search input field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow py-3 px-4 text-gray-800 text-base md:text-lg border-none bg-transparent placeholder-gray-500 rounded-l-full focus:outline-none"
          />

          {/* 2. The Separator and Dropdown Button Area */}
          <div className="flex items-center">
            
            {/* Display the selected operator label */}
            <span 
                className="text-sm text-gray-800 px-2 py-1 font-semibold"
                title={`Current Operator: ${selectedOperator.label}`}
            >
                {selectedOperator.label}
            </span>
            
            {/* The Dropdown Toggle Button */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-full px-5 flex items-center justify-center text-gray-700 transition-colors duration-200 border-l-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 rounded-r-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Toggle search operator dropdown"
              aria-expanded={isDropdownOpen}
              title="Change Operator"
            >
              <ChevronDownIcon isOpen={isDropdownOpen} />
            </button>
          </div>
        </div>

        {/* 3. The Dropdown Menu (Conditional Rendering) */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-full sm:w-32 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
            <ul className="py-2" role="menu">
              {searchOptions.map((option) => (
                <li key={option.id}>
                  <button
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 font-medium ${
                      option.id === selectedOperatorId
                        ? 'bg-blue-500 text-white font-bold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-current={option.id === selectedOperatorId ? 'page' : undefined}
                    role="menuitem"
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Optional: Overlay to close dropdown on outside click */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;