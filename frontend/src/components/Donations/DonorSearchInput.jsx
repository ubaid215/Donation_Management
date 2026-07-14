import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, X, Loader2 } from 'lucide-react';
import useDonations from '../hooks/useDonations';
import toast from 'react-hot-toast';

const DonorSearchInput = ({ onDonorSelect, value, onChange }) => {
  const { getDonorSuggestions, getDonorByPhone } = useDonations();
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      const results = await getDonorSuggestions(query, 5);
      
      setSuggestions(results || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      setLoading(true);
      
      // Fetch full donor details by phone
      const donor = await getDonorByPhone(suggestion.donorPhone);
      
      if (donor) {
        setSelectedDonor(donor);
        onDonorSelect(donor);
        setShowSuggestions(false);
        toast.success(`Donor loaded: ${donor.donorName}`);
      } else {
        toast.error('Donor details not found');
      }
    } catch (error) {
      console.error('Error fetching donor details:', error);
      toast.error('Failed to load donor details');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedDonor(null);
    onDonorSelect(null);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          placeholder="Search by name or phone..."
          className="input pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.donorPhone}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{suggestion.donorName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-600">{suggestion.donorPhone}</span>
                </div>
              </div>
              {suggestion.lastDonationDate && (
                <div className="text-xs text-gray-500">
                  Last: {new Date(suggestion.lastDonationDate).toLocaleDateString()}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Donor Info */}
      {selectedDonor && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Donor History</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-600">Total Donations:</span>
                  <span className="ml-2 font-medium">{selectedDonor.totalDonations}</span>
                </div>
                <div>
                  <span className="text-blue-600">Total Amount:</span>
                  <span className="ml-2 font-medium">Rs {selectedDonor.totalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-600">Last Purpose:</span>
                  <span className="ml-2 font-medium">{selectedDonor.lastPurpose || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-600">Last Method:</span>
                  <span className="ml-2 font-medium">{selectedDonor.lastPaymentMethod || 'N/A'}</span>
                </div>
              </div>

              {selectedDonor.recentDonations && selectedDonor.recentDonations.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-blue-900">Recent Donations:</span>
                  <div className="mt-1 space-y-1">
                    {selectedDonor.recentDonations.slice(0, 3).map((donation) => (
                      <div key={donation.id} className="text-xs text-blue-700">
                        Rs {donation.amount.toLocaleString()} - {donation.purpose} ({new Date(donation.date).toLocaleDateString()})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-blue-600 hover:text-blue-800 ml-4"
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorSearchInput;