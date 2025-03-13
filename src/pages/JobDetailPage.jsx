import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchJobById, applyForJob } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatDate } from '../lib/utils';
import { useToast } from '../components/ui/use-toast';
import { handleError } from '../lib/errors';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { MapPin, Clock, Briefcase, Building, Calendar, DollarSign, ChevronLeft } from 'lucide-react';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const jobData = await fetchJobById(id);
        setJob(jobData);
      } catch (err) {
        setError('Failed to load job details. Please try again later.');
        handleError(err, toast);
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [id, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
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

  const validateForm = () => {
    const errors = {};
    
    if (!applicationData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!applicationData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicationData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!applicationData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!applicationData.coverLetter.trim()) {
      errors.coverLetter = 'Cover letter is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await applyForJob(id, applicationData);
      
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted.",
        variant: "default",
      });
      
      setShowApplicationForm(false);
      setApplicationData({
        name: '',
        email: '',
        phone: '',
        coverLetter: ''
      });
    } catch (err) {
      const errors = handleError(err, toast);
      if (errors) {
        setFormErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto text-center py-10">
        <ErrorMessage message={error || "Job not found"} className="mb-6" />
        <Button onClick={() => navigate('/jobs')} variant="outline" className="border-brand text-brand-dark">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/jobs" className="text-brand hover:text-brand-dark inline-flex items-center">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Jobs
        </Link>
      </div>
      
      <div className="bg-white border border-brand-100 rounded-lg shadow-sm overflow-hidden mb-8">
        {/* Header */}
        <div className="border-b border-brand-100 p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">{job.title}</h1>
          <div className="flex items-center text-muted-foreground">
            <Building className="h-4 w-4 mr-2" />
            <span className="text-lg">{job.company}</span>
          </div>
        </div>
        
        {/* Job Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-brand-50 p-4 rounded-lg flex items-start">
              <MapPin className="h-5 w-5 text-brand mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-brand-dark mb-1">Location</h3>
                <p className="text-muted-foreground">{job.location}</p>
              </div>
            </div>
            <div className="bg-brand-50 p-4 rounded-lg flex items-start">
              <Briefcase className="h-5 w-5 text-brand mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-brand-dark mb-1">Job Type</h3>
                <p className="text-muted-foreground">{job.type}</p>
              </div>
            </div>
            <div className="bg-brand-50 p-4 rounded-lg flex items-start">
              <Calendar className="h-5 w-5 text-brand mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-brand-dark mb-1">Posted On</h3>
                <p className="text-muted-foreground">{formatDate(job.datePosted)}</p>
              </div>
            </div>
          </div>
          
          {job.salary && (
            <div className="mb-6 flex items-start">
              <DollarSign className="h-5 w-5 text-brand mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-brand-dark mb-1">Salary</h2>
                <p className="text-muted-foreground">{job.salary}</p>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-brand-dark mb-4 flex items-center">
              <span>Job Description</span>
            </h2>
            <div className="job-description prose prose-brand max-w-none">
              <p className="whitespace-pre-line">{job.description}</p>
            </div>
          </div>
          
          {job.requirements && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-brand-dark mb-4">Requirements</h2>
              <div className="job-description prose prose-brand max-w-none">
                <p className="whitespace-pre-line">{job.requirements}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-8">
            <Button 
              size="lg" 
              className="bg-brand hover:bg-brand-dark"
              onClick={() => setShowApplicationForm(!showApplicationForm)}
            >
              {showApplicationForm ? 'Cancel Application' : 'Apply for this Job'}
            </Button>
          </div>
        </div>
      </div>
      
      {showApplicationForm && (
        <div className="bg-white border border-brand-100 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-brand-dark mb-6">Apply for {job.title}</h2>
          
          <form onSubmit={handleApply} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className={formErrors.name ? "text-destructive" : ""}>
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={applicationData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? "border-destructive" : "border-brand-100"}
                />
                {formErrors.name && (
                  <p className="text-destructive text-sm">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className={formErrors.email ? "text-destructive" : ""}>
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={applicationData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? "border-destructive" : "border-brand-100"}
                />
                {formErrors.email && (
                  <p className="text-destructive text-sm">{formErrors.email}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className={formErrors.phone ? "text-destructive" : ""}>
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={applicationData.phone}
                onChange={handleInputChange}
                className={formErrors.phone ? "border-destructive" : "border-brand-100"}
              />
              {formErrors.phone && (
                <p className="text-destructive text-sm">{formErrors.phone}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coverLetter" className={formErrors.coverLetter ? "text-destructive" : ""}>
                Cover Letter
              </Label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                value={applicationData.coverLetter}
                onChange={handleInputChange}
                rows={6}
                className={`w-full rounded-md border ${formErrors.coverLetter ? "border-destructive" : "border-brand-100"} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              />
              {formErrors.coverLetter && (
                <p className="text-destructive text-sm">{formErrors.coverLetter}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-brand hover:bg-brand-dark"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
