import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Briefcase, Users, Building, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchJobs } from '../services/api';
import JobCard from '../components/JobCard';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeaturedJobs = async () => {
      try {
        setIsLoading(true);
        const jobs = await fetchJobs();
        // Get the 3 most recent jobs
        setFeaturedJobs(jobs.slice(0, 3));
      } catch (err) {
        setError('Failed to load featured jobs');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedJobs();
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-16 px-4 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6">
            MKA USA Job Board
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connecting Khuddam with career opportunities through the Sanat-o-Tijarat Department
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/jobs">
              <Button size="lg" className="bg-brand hover:bg-brand-dark text-white">
                Browse Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="outline" size="lg" className="border-brand text-brand-dark hover:bg-brand-50">
                Post a Job
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl font-bold text-brand-dark mb-6">
          For Khuddam, By Khuddam
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          This job board is exclusively for members of Majlis Khuddamul Ahmadiyya USA who are seeking employment 
          or who have job openings and want to help their brothers secure positions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="flex flex-col items-center">
            <div className="bg-brand-50 p-4 rounded-full mb-4">
              <Briefcase className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold text-brand-dark mb-2">Find Opportunities</h3>
            <p className="text-muted-foreground">
              Browse job listings posted by fellow Khuddam across various industries
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-brand-50 p-4 rounded-full mb-4">
              <Building className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold text-brand-dark mb-2">Post Openings</h3>
            <p className="text-muted-foreground">
              Share job opportunities from your company to help other Khuddam
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-brand-50 p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold text-brand-dark mb-2">Support Brothers</h3>
            <p className="text-muted-foreground">
              Strengthen our brotherhood by helping each other advance professionally
            </p>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-brand-dark">Featured Opportunities</h2>
          <Link to="/jobs" className="text-brand hover:text-brand-dark flex items-center gap-1">
            View all jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="text-center py-12 bg-brand-50 rounded-lg">
            <Search className="h-12 w-12 text-brand mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-brand-dark mb-2">No jobs available yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to post a job opportunity for your fellow Khuddam
            </p>
            <Link to="/admin/login">
              <Button className="bg-brand hover:bg-brand-dark text-white">
                Post a Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-brand-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-brand-dark mb-4">
          Ready to find your next opportunity?
        </h2>
        <p className="text-muted-foreground mb-6">
          Browse all available positions or post a job opening to help your fellow Khuddam
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/jobs">
            <Button className="bg-brand hover:bg-brand-dark text-white">
              Browse All Jobs
            </Button>
          </Link>
          <Link to="/admin/login">
            <Button variant="outline" className="border-brand text-brand-dark hover:bg-brand-50">
              Post a Job
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
