import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchJobs, fetchCategories } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import JobCard from '../components/JobCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { handleError } from '../lib/errors';
import { useToast } from '../components/ui/use-toast';

const JobListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [jobTypes, setJobTypes] = useState(['Full-time', 'Part-time', 'Contract', 'Remote']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { toast } = useToast();

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    type: searchParams.get('type') || ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get filter values from URL params
        const searchFilter = searchParams.get('search') || '';
        const categoryFilter = searchParams.get('category') || '';
        const locationFilter = searchParams.get('location') || '';
        const typeFilter = searchParams.get('type') || '';
        
        // Update filter state
        setFilters({
          search: searchFilter,
          category: categoryFilter,
          location: locationFilter,
          type: typeFilter
        });
        
        // Fetch jobs with filters
        const jobsData = await fetchJobs({
          search: searchFilter,
          category: categoryFilter,
          location: locationFilter,
          type: typeFilter
        });
        
        setJobs(jobsData);
        
        // Fetch categories
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        
        // Extract unique locations from jobs
        const uniqueLocations = [...new Set(jobsData.map(job => job.location))];
        setLocations(uniqueLocations);
        
      } catch (err) {
        setError('Failed to load jobs. Please try again later.');
        handleError(err, toast);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [searchParams, toast]);

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      type: ''
    });
    setSearchParams({});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Update URL with current search term
    const params = new URLSearchParams(searchParams);
    if (filters.search) {
      params.set('search', filters.search);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  const hasActiveFilters = filters.category || filters.location || filters.type || filters.search;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Job Listings</h1>
        <p className="text-muted-foreground">
          Browse opportunities posted by fellow Khuddam
        </p>
      </div>
      
      {/* Search Bar - Always visible */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10"
            />
          </div>
          <Button type="submit" className="bg-brand hover:bg-brand-dark">Search</Button>
          <Button 
            type="button" 
            variant="outline" 
            className="border-brand text-brand-dark md:hidden"
            onClick={toggleMobileFilters}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.category && (
            <div className="bg-brand-50 text-brand-dark text-sm px-3 py-1 rounded-full flex items-center">
              Category: {filters.category}
              <button 
                onClick={() => handleFilterChange('category', '')}
                className="ml-2 text-brand-dark/70 hover:text-brand-dark"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.location && (
            <div className="bg-brand-50 text-brand-dark text-sm px-3 py-1 rounded-full flex items-center">
              Location: {filters.location}
              <button 
                onClick={() => handleFilterChange('location', '')}
                className="ml-2 text-brand-dark/70 hover:text-brand-dark"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.type && (
            <div className="bg-brand-50 text-brand-dark text-sm px-3 py-1 rounded-full flex items-center">
              Type: {filters.type}
              <button 
                onClick={() => handleFilterChange('type', '')}
                className="ml-2 text-brand-dark/70 hover:text-brand-dark"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-muted-foreground hover:text-brand-dark text-sm"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar - Desktop */}
        <div className={`lg:block ${showMobileFilters ? 'block' : 'hidden'}`}>
          <div className="bg-white border border-brand-100 rounded-lg p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-dark">Filters</h2>
              <button 
                onClick={toggleMobileFilters}
                className="lg:hidden text-muted-foreground hover:text-brand-dark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger className="border-brand-100">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Location</label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => handleFilterChange('location', value)}
                >
                  <SelectTrigger className="border-brand-100">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Job Type</label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger className="border-brand-100">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {jobTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-brand text-brand-dark mt-2" 
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
        
        {/* Job Listings */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <ErrorMessage message={error} className="mb-4" />
          ) : jobs.length === 0 ? (
            <div className="bg-brand-50 p-8 rounded-lg text-center">
              <Search className="h-12 w-12 text-brand mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-dark mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your search filters or check back later for new opportunities."
                  : "There are currently no job listings available. Please check back later."}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} className="bg-brand hover:bg-brand-dark">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
                {hasActiveFilters && ' matching your filters'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListingPage;
