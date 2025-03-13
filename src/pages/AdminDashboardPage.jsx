import { useState, useEffect } from 'react';
import { fetchJobs, createJob, updateJob, deleteJob } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatDate } from '../lib/utils';
import { useToast } from '../components/ui/use-toast';
import { handleError } from '../lib/errors';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Edit, Trash2, X, Search, FileText, Building, MapPin, Briefcase } from 'lucide-react';

const AdminDashboardPage = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    category: '',
    salary: '',
    description: '',
    requirements: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote'];
  const categories = ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Other'];

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const jobsData = await fetchJobs();
      setJobs(jobsData);
    } catch (err) {
      setError('Failed to load jobs. Please try again later.');
      handleError(err, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user selects
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = ['title', 'company', 'location', 'type', 'description'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      type: 'Full-time',
      category: '',
      salary: '',
      description: '',
      requirements: ''
    });
    setFormErrors({});
    setSelectedJob(null);
  };

  const openNewJobDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditJobDialog = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      type: job.type || 'Full-time',
      category: job.category || '',
      salary: job.salary || '',
      description: job.description || '',
      requirements: job.requirements || ''
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (job) => {
    setSelectedJob(job);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (selectedJob) {
        // Update existing job
        await updateJob(selectedJob.id, formData);
        toast({
          title: "Job Updated",
          description: "The job listing has been updated successfully.",
        });
      } else {
        // Create new job
        await createJob(formData);
        toast({
          title: "Job Created",
          description: "The new job listing has been created successfully.",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadJobs(); // Refresh job list
    } catch (err) {
      const errors = handleError(err, toast);
      if (errors) {
        setFormErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;
    
    try {
      setIsSubmitting(true);
      await deleteJob(selectedJob.id);
      
      toast({
        title: "Job Deleted",
        description: "The job listing has been deleted successfully.",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedJob(null);
      loadJobs(); // Refresh job list
    } catch (err) {
      handleError(err, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <ErrorMessage message={error} className="mb-6" />
        <Button onClick={loadJobs} className="bg-brand hover:bg-brand-dark">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage job listings for MKA USA Job Board
          </p>
        </div>
        <Button 
          onClick={openNewJobDialog}
          className="bg-brand hover:bg-brand-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Job
        </Button>
      </div>
      
      <div className="bg-white border border-brand-100 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-brand-100">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-xl font-semibold text-brand-dark">
              Manage Job Listings
            </h2>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 border-brand-100"
              />
            </div>
          </div>
        </div>
        
        {jobs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-brand mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-brand-dark mb-2">No jobs have been created yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first job listing to help Khuddam find employment opportunities
            </p>
            <Button 
              onClick={openNewJobDialog}
              className="bg-brand hover:bg-brand-dark"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Job
            </Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="h-12 w-12 text-brand mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-brand-dark mb-2">No matching jobs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or create a new job listing
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="border-brand text-brand-dark"
              >
                Clear Search
              </Button>
              <Button 
                onClick={openNewJobDialog}
                className="bg-brand hover:bg-brand-dark"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Job
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark uppercase tracking-wider">Posted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-brand-dark uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-brand-50/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-brand-dark">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>{job.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>{job.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="bg-brand-50 text-brand-dark text-xs px-2 py-1 rounded-full">
                          {job.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(job.datePosted)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditJobDialog(job)}
                        className="text-brand hover:text-brand-dark hover:bg-brand-50 mr-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDeleteDialog(job)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Job Form Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg overflow-y-auto border border-brand-100">
            <Dialog.Title className="text-xl font-bold text-brand-dark mb-4">
              {selectedJob ? 'Edit Job' : 'Add New Job'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className={formErrors.title ? "text-destructive" : ""}>
                    Job Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={formErrors.title ? "border-destructive" : "border-brand-100"}
                  />
                  {formErrors.title && (
                    <p className="text-destructive text-sm">{formErrors.title}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company" className={formErrors.company ? "text-destructive" : ""}>
                    Company
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={formErrors.company ? "border-destructive" : "border-brand-100"}
                  />
                  {formErrors.company && (
                    <p className="text-destructive text-sm">{formErrors.company}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className={formErrors.location ? "text-destructive" : ""}>
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={formErrors.location ? "border-destructive" : "border-brand-100"}
                  />
                  {formErrors.location && (
                    <p className="text-destructive text-sm">{formErrors.location}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className={formErrors.type ? "text-destructive" : ""}>
                    Job Type
                  </Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger id="type" className={formErrors.type ? "border-destructive" : "border-brand-100"}>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.type && (
                    <p className="text-destructive text-sm">{formErrors.type}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger id="category" className="border-brand-100">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salary">
                    Salary (Optional)
                  </Label>
                  <Input
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="e.g. $50,000 - $70,000"
                    className="border-brand-100"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className={formErrors.description ? "text-destructive" : ""}>
                  Job Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full rounded-md border ${formErrors.description ? "border-destructive" : "border-brand-100"} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {formErrors.description && (
                  <p className="text-destructive text-sm">{formErrors.description}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requirements">
                  Requirements (Optional)
                </Label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-md border border-brand-100 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-brand text-brand-dark"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand hover:bg-brand-dark"
                >
                  {isSubmitting ? 'Saving...' : (selectedJob ? 'Update Job' : 'Create Job')}
                </Button>
              </div>
            </form>
            
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-brand-dark focus:outline-none"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      
      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg border border-brand-100">
            <Dialog.Title className="text-xl font-bold text-brand-dark mb-4">
              Confirm Deletion
            </Dialog.Title>
            
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete the job listing "{selectedJob?.title}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="border-brand text-brand-dark"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Job'}
              </Button>
            </div>
            
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-brand-dark focus:outline-none"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default AdminDashboardPage;
