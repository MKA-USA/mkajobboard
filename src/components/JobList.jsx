import JobCard from './JobCard';

const JobList = ({ jobs, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-lg text-center">
        <h3 className="text-xl font-medium mb-2">No jobs found</h3>
        <p>Try adjusting your search filters or check back later for new opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};

export default JobList;
