import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { formatDate, truncateText } from '../lib/utils';
import { MapPin, Clock, Briefcase, Building } from 'lucide-react';

const JobCard = ({ job }) => {
  return (
    <div className="bg-white border border-brand-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-brand-dark mb-1 line-clamp-1">{job.title}</h3>
            <div className="flex items-center text-muted-foreground mb-2">
              <Building className="h-4 w-4 mr-1" />
              <span className="text-sm">{job.company}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 mr-2" />
            <span>{job.type}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>Posted: {formatDate(job.datePosted)}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {truncateText(job.description, 120)}
        </p>
        
        <Link to={`/jobs/${job.id}`} className="block">
          <Button 
            variant="outline" 
            className="w-full border-brand text-brand-dark hover:bg-brand-50"
          >
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
