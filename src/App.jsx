import React, { useState } from 'react';

// --- Data Definitions ---
const searchOptions = [
  { id: 'AND', label: 'AND' },
  { id: 'OR', label: 'OR' },
  { id: 'NOT', label: 'NOT' },
];

const resultsPerPageOptions = [10, 25, 50, 100];
const sortMethodOptions = [
  { id: 'hits', label: 'Number of Visits' },
  { id: 'alphabetical', label: 'Alphabetical' },
];

// --- Icon Components ---

const HamburgerIcon = ({ isOpen }) => (
  <svg 
    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* This SVG creates a simple 3-line hamburger menu */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
);

// --- Main Component ---

const App = () => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('AND');
  
  // Menu/Dropdown state
  const [showSettings, setShowSettings] = useState(false);

  // Settings state
  const [resultsPerPage, setResultsPerPage] = useState(resultsPerPageOptions[0]);
  const [sortMethod, setSortMethod] = useState(sortMethodOptions[0].id);
  
  // Pagination state (pageNumber is 0-indexed for the API)
  const [pageNumber, setPageNumber] = useState(0); 
  const [totalPages, setTotalPages] = useState(0); 

  // State to store search results and loading status
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedOperator = searchOptions.find(opt => opt.id === selectedOperatorId);

  // Handlers for settings (remain the same)
  const handleOperatorChange = (e) => {
    setSelectedOperatorId(e.target.value);
  };
  
  const handleResultsPerPageChange = (e) => {
    setResultsPerPage(Number(e.target.value));
  };

  const handleSortMethodChange = (e) => {
    setSortMethod(e.target.value);
  };
  
  // Handler for sending click event to backend and redirecting
  const handleClickUrl = async (url) => {
    let finalUrl = url;

    // If the URL does not start with a protocol (http/https), we prepend one.
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
        console.log(`URL corrected to absolute path for redirection: ${finalUrl}`);
    }

    try {
      console.log(`Tracking click for URL: ${url}`);
      
      // Send POST request to track the click
      await fetch('http://localhost:8080/click-tracker', { // Placeholder click tracking endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clickedUrl: url}),
      });

      console.log("Click tracked successfully. Redirecting...");
      
    } catch (error) {
      console.error("Error tracking click, redirecting anyway:", error);
    }
    
    // Redirect the user to the corrected, absolute URL
    window.location.href = finalUrl;
  };

  // NEW: Handler for removing a link
  const handleRemoveLink = async (url, index, e) => {
    // CRITICAL: Stop propagation so clicking the delete button doesn't trigger the link redirection
    e.stopPropagation(); 
    
    console.log(`Attempting to remove outdated link: ${url}`);
    
    try {
      // Placeholder for the removal API endpoint
      const res = await fetch('http://localhost:8080/remove-link', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlToRemove: url}),
      });
      
      if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      console.log(`Link removal request successful for: ${url}`);
      
      // OPTIMISTIC UI UPDATE: Remove the link from the local search results state
      setSearchResults(prevResults => prevResults.filter((_, i) => i !== index));
      
    } catch (error) {
      console.error("Error removing link:", error);
    }
  };


  // Handler for changing the page (1-indexed)
  const handlePageChange = (newPageOneIndexed) => {
    const newPageZeroIndexed = newPageOneIndexed - 1;
    if (newPageZeroIndexed !== pageNumber && newPageZeroIndexed >= 0 && newPageZeroIndexed < totalPages) {
        // Update page state and trigger search with the new page number
        setPageNumber(newPageZeroIndexed);
        handleSearch(newPageZeroIndexed);
    }
  };

  // Handler for the main search action - now accepts an optional page override
  async function handleSearch(pageOverride = pageNumber) {
    if (!searchTerm.trim()) {
        console.log("Search term is empty. Displaying previous results if any.");
        setShowSettings(false);
        return;
    }
    
    setIsLoading(true); // Start loading

    try {
        // Mocking exponential backoff logic here, but using simple fetch call
        const res = await fetch('http://localhost:8080/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searchTerm : searchTerm,
              operator : selectedOperator.label,
              numberOfResults : resultsPerPage,
              pageNumber : pageOverride, // Use the overridden page number
              sortMethod : sortMethod
            }),
          })
          
          if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
          }

          const json = await res.json();
          console.log("Search API Response:", json);
          
          if (json) {
            // Update pagination state from the response
            if (json.totalPages !== undefined) setTotalPages(json.totalPages);
            // Ensure the pageNumber state reflects what the server returned
            if (json.number !== undefined) setPageNumber(json.number); 
            
            // Set the results state from the 'content' array
            if (Array.isArray(json.content[0])) {
                setSearchResults(json.content);
            } else {
              const rawContent = json.content;

              // Function to convert objects into the required [circularShift, url] array format
              const transformedContent = rawContent.map(entity => {
                return [
                  entity.circularShift, // Get the value of the circularShift property
                  entity.url           // Get the value of the url property
                ];
              });
              setSearchResults(transformedContent);
            }
          }

    } catch (error) {
        console.error("Error during search:", error);
        // Optionally display a user-friendly error message
    } finally {
        setIsLoading(false); // End loading
        // Close settings after search
        setShowSettings(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // When searching via enter, always reset to the first page
      setPageNumber(0);
      handleSearch(0);
    }
  };
  
  // Function to toggle the Settings Panel
  const toggleSettingsPanel = () => {
    setShowSettings(prev => !prev);
  };

  // Logic to determine which page buttons to display
  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;

    const currentPageOneIndexed = pageNumber + 1;
    const maxVisiblePages = 7; // Show 7 buttons max (e.g., 1 ... 4 5 6 ... 10)
    const pages = [];
    
    // Simple logic: show first, last, and a window around the current page
    let startPage = Math.max(1, currentPageOneIndexed - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we hit the total pages limit
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add "Previous" button
    pages.push(
        <button
            key="prev"
            onClick={() => handlePageChange(currentPageOneIndexed - 1)}
            disabled={currentPageOneIndexed === 1}
            className="p-2 mx-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            &lt; Prev
        </button>
    );

    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
        const isCurrent = i === currentPageOneIndexed;
        pages.push(
            <button
                key={i}
                onClick={() => handlePageChange(i)}
                className={`p-2 mx-1 rounded-lg font-semibold min-w-[32px] transition-colors ${
                    isCurrent 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-500 hover:text-white'
                }`}
            >
                {i}
            </button>
        );
    }
    
    // Add "Next" button
    pages.push(
        <button
            key="next"
            onClick={() => handlePageChange(currentPageOneIndexed + 1)}
            disabled={currentPageOneIndexed === totalPages}
            className="p-2 mx-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Next &gt;
        </button>
    );

    return (
        <div className="flex justify-center items-center flex-wrap gap-2 pt-4">
            {pages}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      
      <div className="w-full max-w-lg md:max-w-xl relative mt-16"> 
        
        {/* The Pill-Shaped Search Bar (Search Input + Hamburger) */}
        <div 
          className="flex border-2 border-gray-300 rounded-full bg-white transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20"
          onKeyDown={handleKeyDown}
        >

          {/* 1. Main Input Field */}
          <input
            type="text"
            placeholder={`Enter search terms (Operator: ${selectedOperator.label})`}
            aria-label="Search input field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow py-3 px-4 text-gray-800 text-base md:text-lg border-none bg-transparent placeholder-gray-500 rounded-l-full focus:outline-none"
          />

          {/* 2. Controls Area: Hamburger Settings Button */}
          <div className="flex items-stretch">
            
            {/* Hamburger Settings Button */}
            <button
              onClick={toggleSettingsPanel}
              // The hamburger button now has the rounded-r-full class to complete the pill shape
              className="h-full px-5 flex items-center justify-center text-gray-700 transition-colors duration-200 border-l-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 rounded-r-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Toggle search settings menu"
              aria-expanded={showSettings}
              title="Search Settings"
            >
              <HamburgerIcon isOpen={showSettings} />
            </button>
          </div>
        </div>

        {/* 3. Settings Panel */}
        {showSettings && (
          <div className="absolute right-0 mt-2 w-full sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 p-4 space-y-4">
            
            {/* Operator Selector */}
            <div className="space-y-1">
                <label htmlFor="search-operator" className="text-sm font-semibold text-gray-700 block">
                    Search Operator
                </label>
                <select
                    id="search-operator"
                    value={selectedOperatorId}
                    onChange={handleOperatorChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    aria-label="Select boolean search operator"
                >
                    {searchOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                </select>
            </div>

            {/* Results Per Page Selector */}
            <div className="space-y-1">
                <label htmlFor="results-per-page" className="text-sm font-semibold text-gray-700 block">
                    Results per page
                </label>
                <select
                    id="results-per-page"
                    value={resultsPerPage}
                    onChange={handleResultsPerPageChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    aria-label="Select number of results per page"
                >
                    {resultsPerPageOptions.map(num => (
                        <option key={num} value={num}>{num} Results</option>
                    ))}
                </select>
            </div>

            {/* Sorting Method Selector */}
            <div className="space-y-1">
                <label htmlFor="sort-method" className="text-sm font-semibold text-gray-700 block">
                    Sort by
                </label>
                <select
                    id="sort-method"
                    value={sortMethod}
                    onChange={handleSortMethodChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    aria-label="Select sorting method"
                >
                    {sortMethodOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                </select>
            </div>
            
            <button 
                onClick={() => { setPageNumber(0); handleSearch(0); }} // Reset page to 0 on new search from settings
                className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-150 shadow-md"
            >
                Apply & Search
            </button>
          </div>
        )}
        
        {/* Optional: Overlay to close settings on outside click */}
        {showSettings && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* 4. Search Results Display Area */}
      <div className="w-full max-w-lg md:max-w-xl mt-8 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Search Results</h2>
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center text-blue-600 font-semibold py-4">
            Loading results...
          </div>
        )}
        
        {/* No Results Message */}
        {!isLoading && searchResults.length === 0 && searchTerm.trim() && (
            <div className="text-center text-gray-500 py-4 border-2 border-dashed border-gray-300 p-6 rounded-lg">
                No results found for your query. Try different terms or operator.
            </div>
        )}

        {/* Display Results */}
        {!isLoading && searchResults.length > 0 && (
          <div className="space-y-6">
            {searchResults.map((result, index) => {
              // Deconstruct the array: [description, url]
              const description = result[0];
              const url = result[1];

              return (
                <div 
                  key={index} 
                  // Add click handler to the entire card
                  onClick={() => handleClickUrl(url)}
                  // Styling to indicate the card is clickable
                  // Added flex classes to position the button to the right
                  className="bg-white p-4 rounded-xl shadow-md border border-gray-100 transition-shadow hover:shadow-lg cursor-pointer flex justify-between items-start"
                  role="link"
                  tabIndex="0"
                  aria-label={`Open ${url}`}
                >
                  
                  <div className="flex-grow pr-4"> {/* Main content area */}
                    <div 
                      className="block text-sm text-blue-600 font-medium truncate hover:underline"
                      title={url}
                    >
                      {url}
                    </div>
                    <p className="mt-1 text-base text-gray-800">
                      {description}
                    </p>
                  </div>
                  
                  {/* Remove Link Button */}
                  <button
                    onClick={(e) => handleRemoveLink(url, index, e)}
                    className="ml-4 flex-shrink-0 bg-red-500 text-white text-xs font-semibold py-1 px-3 rounded-full hover:bg-red-600 transition duration-150 shadow-md whitespace-nowrap"
                    title="Remove outdated link"
                    aria-label={`Remove link for ${url}`}
                  >
                    Remove Link
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        {/* 5. Pagination Controls */}
        {!isLoading && searchResults.length > 0 && renderPaginationButtons()}

        {/* Initial Prompt Message */}
        {!isLoading && searchResults.length === 0 && !searchTerm.trim() && (
             <div className="text-center text-gray-500 py-4 border-2 border-dashed border-gray-300 p-6 rounded-lg">
                Start your search by typing in the bar above.
            </div>
        )}

      </div>

    </div>
  );
};

export default App;